import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CotaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  // Compatible method names
  getCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/client/companies`);
  }

  getEmpresas(): Observable<any[]> {
    return this.getCompanies();
  }

  compararListas(itemList: string[], companyId?: number): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/client/compare`, { itemList, companyId });
  }

  getEmpresaById(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/client/companies/${id}`);
  }

  confirmMatch(originalName: string, matchedName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/client/confirm-match`, { originalName, matchedName });
  }

  // Admin methods
  getPendingMappings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/pending-mappings`);
  }

  approveMapping(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/approve-mapping/${id}`, {});
  }

  // Admin/Supplier methods (proxies)
  addEmpresa(name: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, { name, email: `${name.toLowerCase().replace(/ /g, '')}@store.com`, password: 'password123', role: 'SUPPLIER' });
  }

  uploadInventory(companyId: number, inventory: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/supplier/upload-inventory`, { inventory });
  }
}
