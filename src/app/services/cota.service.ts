import { Injectable, inject } from '@angular/core';
import { 
  Firestore
} from '@angular/fire/firestore';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where,
  deleteDoc,
  setDoc,
  Timestamp,
  onSnapshot,
  DocumentData,
  Query
} from 'firebase/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from, map, of, firstValueFrom, switchMap } from 'rxjs';
import * as stringSimilarity from 'string-similarity';

@Injectable({
  providedIn: 'root'
})
export class CotaService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private getCollectionData<T>(q: Query<DocumentData>): Observable<T[]> {
    return new Observable(subscriber => {
      const unsubscribe = onSnapshot(q, 
        (snap) => {
          const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
          subscriber.next(items);
        },
        (err) => subscriber.error(err)
      );
      return { unsubscribe };
    });
  }

  getEmpresas(): Observable<any[]> {
    const empresasRef = collection(this.firestore, 'empresas');
    return this.getCollectionData<any>(empresasRef);
  }

  addEmpresa(name: string): Observable<any> {
    const empresasRef = collection(this.firestore, 'empresas');
    return from(addDoc(empresasRef, { 
      name, 
      createdAt: Timestamp.now(),
      status: 'ACTIVE'
    }));
  }

  getEmpresaById(id: string): Observable<any> {
    const docRef = doc(this.firestore, 'empresas', id);
    return from(getDoc(docRef)).pipe(
      map(snap => snap.exists() ? { id: snap.id, ...snap.data() } : null)
    );
  }

  getMyCompany(companyId: string): Observable<any> {
    return this.getEmpresaById(companyId).pipe(
      switchMap((company: any) => {
        if (!company) return of(null);
        return this.getProdutosByEmpresa(companyId).pipe(
          map(produtos => ({ ...company, inventory: produtos }))
        );
      })
    );
  }

  getProdutosByEmpresa(empresaId: string): Observable<any[]> {
    const produtosRef = collection(this.firestore, `empresas/${empresaId}/produtos`);
    return this.getCollectionData<any>(produtosRef);
  }

  compararListas(minhaLista: any[], companyId?: string): Observable<any[]> {
    return from(this.processarComparacao(minhaLista, companyId));
  }

  private async processarComparacao(minhaLista: any[], companyId?: string): Promise<any[]> {
    const results: any[] = [];
    const itemMap = new Map<string, any>(); // Cache results for duplicates

    // 1. Fetch ALL relevant products ONCE
    let allProducts: any[] = [];
    if (companyId) {
      const snap = await getDocs(collection(this.firestore, `empresas/${companyId}/produtos`));
      const empSnap = await getDoc(doc(this.firestore, 'empresas', companyId));
      const empName = empSnap.exists() ? (empSnap.data() as any).name : 'Loja';
      allProducts = snap.docs.map(d => ({ ...d.data() as any, id: d.id, empresaNome: empName }));
    } else {
      const empresasSnap = await getDocs(collection(this.firestore, 'empresas'));
      for (const empDoc of empresasSnap.docs) {
        const pSnap = await getDocs(collection(this.firestore, `empresas/${empDoc.id}/produtos`));
        allProducts.push(...pSnap.docs.map(d => ({ 
          ...d.data() as any, 
          id: d.id, 
          empresaNome: (empDoc.data() as any).name 
        })));
      }
    }

    // 2. Index inventory by Barcode for O(1) lookup + pre-process for fuzzy
    const barcodeIndex = new Map<string, any>();
    const processedInventory = allProducts.map(p => {
      const processed = {
        ...p,
        lowName: p.name.toLowerCase(),
        tokens: new Set(p.name.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2)),
        vol: this.extractVolume(p.name.toLowerCase())
      };
      if (p.barcode) {
        barcodeIndex.set(p.barcode.toString().trim(), processed);
      }
      return processed;
    });

    // 3. Process each requested item
    for (const rawItem of minhaLista) {
      const originalItem = rawItem.toString().trim();
      if (!originalItem) continue;
      
      // Parse "Name | Barcode"
      let itemName = originalItem;
      let itemBarcode = '';
      if (originalItem.includes('|')) {
        const parts = originalItem.split('|');
        itemName = parts[0].trim();
        itemBarcode = parts[1].trim();
      }

      const itemLower = itemName.toLowerCase();
      const cacheKey = itemBarcode ? `bc:${itemBarcode}` : `nm:${itemLower}`;
      
      if (itemMap.has(cacheKey)) {
        results.push({ ...itemMap.get(cacheKey), requested: itemName });
        continue;
      }

      let bestMatch: any = null;
      let matches: any[] = [];

      // PRIORITY 1: Exact Barcode Match
      if (itemBarcode && barcodeIndex.has(itemBarcode)) {
        const p = barcodeIndex.get(itemBarcode);
        bestMatch = {
          empresaNome: p.empresaNome,
          produtoNome: p.name,
          preco: p.price,
          similarity: 1.0,
          method: 'BARCODE'
        };
      } else {
        // PRIORITY 2: Fuzzy Name Match
        const itemVol = this.extractVolume(itemLower);
        const itemTokens = itemLower.split(/\s+/).filter((t: string) => t.length > 2);

        for (const p of processedInventory) {
          // FAST FILTER: Must share at least one keyword (brand/type)
          let sharesToken = false;
          for (const token of itemTokens) {
            if (p.tokens.has(token)) {
              sharesToken = true;
              break;
            }
          }
          if (!sharesToken && itemTokens.length > 0) continue;

          const similarity = this.calculateEnhancedSimilarityFast(itemLower, itemVol, p.lowName, p.vol);

          if (similarity > 0.35) {
            const match = {
              empresaNome: p.empresaNome,
              produtoNome: p.name,
              preco: p.price,
              similarity,
              method: 'FUZZY'
            };
            matches.push(match);
            
            if (similarity > 0.98) { // EARLY EXIT: Perfect match
              bestMatch = match;
              break;
            }
          }
        }
      }

      if (!bestMatch && matches.length > 0) {
        matches.sort((a, b) => b.similarity - a.similarity);
        bestMatch = matches[0];
      }

      const status: 'CERTO' | 'DUVIDA' | 'NAO_ENCONTRADO' = 
        !bestMatch ? 'NAO_ENCONTRADO' : 
        bestMatch.similarity > 0.85 ? 'CERTO' : 
        bestMatch.similarity < 0.3 ? 'NAO_ENCONTRADO' : 'DUVIDA';

      const finalRes = {
        requested: itemName,
        matchedProduct: bestMatch ? bestMatch.produtoNome : null,
        companyName: bestMatch ? bestMatch.empresaNome : 'Não encontrado',
        price: bestMatch ? bestMatch.preco : 0,
        score: bestMatch ? bestMatch.similarity : 0,
        status: status,
        method: bestMatch ? bestMatch.method : 'NONE',
        opcoes: matches.slice(0, 3)
      };

      itemMap.set(cacheKey, finalRes);
      results.push(finalRes);
    }

    return results;
  }

  private calculateEnhancedSimilarityFast(str1: string, vol1: string | null, str2: string, vol2: string | null): number {
    // 1. Base Score
    let score = stringSimilarity.compareTwoStrings(str1, str2);

    // 2. Volume Conflict (Pre-calculated vols used here)
    if (vol1 && vol2) {
      if (vol1 !== vol2) {
        score -= 0.6; // High penalty
      } else {
        score += 0.2; // High bonus
      }
    } else if ((vol1 && !vol2) || (!vol1 && vol2)) {
      score -= 0.15;
    }

    // 3. Exact Phrase
    if (str1.includes(str2) || str2.includes(str1)) score += 0.15;

    return Math.min(Math.max(score, 0), 1);
  }

  private calculateEnhancedSimilarity(str1: string, str2: string): number {
    // 1. Base Score (Dice Coefficient)
    let score = stringSimilarity.compareTwoStrings(str1, str2);

    // 2. Volume/Weight Conflict Check
    const vol1 = this.extractVolume(str1);
    const vol2 = this.extractVolume(str2);

    if (vol1 && vol2) {
      if (vol1 !== vol2) {
        score -= 0.5; // Heavy penalty for volume mismatch (e.g., 1L vs 5L)
      } else {
        score += 0.15; // Success match bonus
      }
    } else if ((vol1 && !vol2) || (!vol1 && vol2)) {
      score -= 0.1; // Penalty if one has volume and other doesn't
    }

    // 3. Keyword Match (First words usually represent brand/type)
    const words1 = str1.split(/\s+/).filter(w => w.length > 2);
    const words2 = str2.split(/\s+/).filter(w => w.length > 2);

    if (words1[0] === words2[0]) {
      score += 0.1; // Bonus for primary name match
    }

    // 4. Exact Phrase Check
    if (str1.includes(str2) || str2.includes(str1)) {
      score += 0.1;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  private extractVolume(text: string): string | null {
    // Matches patterns like 1L, 500ml, 1.5kg, 900g, 10lt, etc.
    const regex = /(\d+(?:[.,]\d+)?)\s*(l|ml|kg|g|lt|kg|gr|un|peça|cx)/i;
    const match = text.match(regex);
    if (!match) return null;
    
    let value = match[1].replace(',', '.');
    let unit = match[2].toLowerCase();
    
    // Normalize units
    if (unit === 'lt') unit = 'l';
    if (unit === 'gr') unit = 'g';
    
    return `${parseFloat(value)}${unit}`;
  }

  saveQuote(name: string, results: any[], total: number): Observable<any> {
    const user = this.auth.currentUser;
    if (!user) return of(null);

    const quotesRef = collection(this.firestore, `users/${user.uid}/quotes`);
    return from(addDoc(quotesRef, {
      name,
      results,
      total,
      createdAt: Timestamp.now()
    }));
  }

  getSavedQuotes(): Observable<any[]> {
    const user = this.auth.currentUser;
    if (!user) return of([]);

    const quotesRef = collection(this.firestore, `users/${user.uid}/quotes`);
    const q = query(quotesRef);
    return this.getCollectionData<any>(q);
  }

  deleteQuote(id: string): Observable<any> {
    const user = this.auth.currentUser;
    if (!user) return of(null);

    const docRef = doc(this.firestore, `users/${user.uid}/quotes`, id);
    return from(deleteDoc(docRef));
  }

  uploadInventory(companyId: string, inventory: any[]): Observable<any> {
    return from(this.batchUpload(companyId, inventory));
  }

  private async batchUpload(companyId: string, inventory: any[]) {
    for (const item of inventory) {
      const prodRef = doc(collection(this.firestore, `empresas/${companyId}/produtos`));
      await setDoc(prodRef, {
        name: item.name,
        price: item.price,
        barcode: item.barcode || '',
        unit: item.unit || 'un',
        updatedAt: Timestamp.now()
      });
    }
    return { count: inventory.length };
  }

  confirmMatch(originalName: string, matchedName: string): Observable<any> {
    const mappingRef = collection(this.firestore, 'productMappings');
    return from(addDoc(mappingRef, {
      originalName,
      matchedName,
      status: 'PENDING',
      createdAt: Timestamp.now()
    }));
  }

  // Admin specific
  getAllUsers(): Observable<any[]> {
    const usersRef = collection(this.firestore, 'users');
    return this.getCollectionData<any>(usersRef);
  }

  getPendingMappings(): Observable<any[]> {
    const mappingRef = collection(this.firestore, 'productMappings');
    const q = query(mappingRef, where('status', '==', 'PENDING'));
    return this.getCollectionData<any>(q);
  }

  approveMapping(id: string): Observable<any> {
    const docRef = doc(this.firestore, 'productMappings', id);
    return from(setDoc(docRef, { status: 'APPROVED' }, { merge: true }));
  }

  updateProductPrice(companyId: string, productId: string, price: number): Observable<any> {
    const docRef = doc(this.firestore, `empresas/${companyId}/produtos`, productId);
    return from(setDoc(docRef, { price, updatedAt: Timestamp.now() }, { merge: true }));
  }
}
