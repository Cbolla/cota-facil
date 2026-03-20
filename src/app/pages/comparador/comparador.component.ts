import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CotaService } from '../../services/cota.service';
import * as XLSX from 'xlsx';

export interface ComparisonResult {
  requested: string;
  matchedProduct: string;
  companyName: string;
  price: number;
  score: number;
  status: 'CERTO' | 'DUVIDA' | 'NAO_ENCONTRADO';
}

@Component({
  selector: 'app-comparador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container animate-in">
      <div class="dashboard-grid" [class.show-inv]="isInventoryVisible">
        
        <!-- COLUNA 1: INPUT -->
        <div class="panel glass-card input-panel">
          <div class="panel-header">
            <h3>Sua Lista</h3>
            <p>Selecione um fornecedor ou busque o menor preço geral.</p>
          </div>

          <div class="store-selection">
            <label>Fornecedor:</label>
            <div class="select-wrapper">
              <select [(ngModel)]="selectedCompanyId" (change)="onCompanyChange()">
                <option [ngValue]="undefined">Menor preço (Geral)</option>
                @for (company of companies; track company.id) {
                  <option [ngValue]="company.id">{{ company.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="input-actions-area">
            <div class="input-header">
               <input type="file" #fileUploader (change)="onFileUpload($event)" style="display: none" accept=".txt,.csv,.xlsx,.xls">
               <button class="ghost-btn" (click)="fileUploader.click()">🖇️ Arquivo (Excel/TXT)</button>
               <button class="ghost-btn trash" (click)="userInput = ''; results = []">🗑️</button>
            </div>
            
            <textarea [(ngModel)]="userInput" 
                      placeholder="Ex:&#10;Sabão&#10;Detergente&#10;Camiseta" 
                      (input)="compareLists()"></textarea>
          </div>

          <button class="glow-btn compare-btn" (click)="compareLists()" [disabled]="isProcessing">
            <span class="icon">🔍</span>
            <span>{{ isProcessing ? 'Processando...' : 'Comparar Agora' }}</span>
          </button>
          
          @if (selectedCompanyId) {
            <button class="toggle-inv-btn" (click)="toggleInventory()">
              {{ isInventoryVisible ? '🙈 Esconder Catálogo' : '👁️ Ver Catálogo da Loja' }}
            </button>
          }
        </div>

        <!-- COLUNA 2: LISTA DA LOJA (OPCIONAL) -->
        @if (isInventoryVisible) {
          <div class="panel glass-card inventory-panel animate-in">
             <div class="panel-header">
               <h3>Produtos em: {{ selectedCompanyName }}</h3>
             </div>
             <div class="scroll-area">
               @for (item of selectedCompanyInventory; track item.id) {
                 <div class="inv-list-item">
                   <span class="p-n">{{ item.name }}</span>
                   <span class="p-p">{{ item.price | currency:'BRL' }}</span>
                 </div>
               } @empty {
                 <p class="empty-msg">Nenhum item encontrado.</p>
               }
             </div>
          </div>
        }

        <!-- COLUNA 3: RESULTADOS -->
        <div class="panel glass-card results-panel" [class.empty]="results.length === 0">
          @if (results.length > 0) {
            <div class="panel-header results-header">
              <div class="h-info">
                 <h3>Comparativo</h3>
                 <span>{{ foundProductsCount }} itens encontrados</span>
              </div>
              <div class="total-badge">
                 <small>Total Estimado</small>
                 <strong>{{ getTotalCheapest() | currency:'BRL' }}</strong>
              </div>
            </div>

            <div class="results-scroll scroll-area">
              @for (res of results; track res) {
                <div class="modern-res-card" [class]="res.status.toLowerCase()">
                  <div class="res-requested">{{ res.requested }}</div>
                  @if (res.status !== 'NAO_ENCONTRADO') {
                    <div class="res-match">
                       <div class="store-tag">{{ res.companyName }}</div>
                       <div class="prod-name">{{ res.matchedProduct }}</div>
                    </div>
                  } @else {
                    <div class="res-missing">Infelizmente não encontramos este item.</div>
                  }
                  <div class="res-price">
                    {{ res.status !== 'NAO_ENCONTRADO' ? (res.price | currency:'BRL') : '--' }}
                  </div>
                  @if (res.status === 'DUVIDA') {
                    <div class="duvida-alert clickable" (click)="confirmProduct(res)">
                      <div class="status-dot"></div>
                      <span>⚠️ Confirme o produto</span>
                    </div>
                  }
                </div>
              }
            </div>
            
            <div class="export-actions">
              <button class="export-btn" (click)="exportTxt()">📥 Relatório TXT</button>
              <button class="export-btn csv" (click)="exportCsv()">📂 Relatório CSV</button>
            </div>
          } @else {
            <div class="empty-results">
              <div class="empty-icon">🎒</div>
              <h3>Sua comparação aparecerá aqui</h3>
              <p>Adicione itens na sua lista ao lado e<br>clique em "Comparar Agora".</p>
            </div>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .container { padding: 40px; max-width: 1600px; margin: 0 auto; height: calc(100vh - 100px); }
    .dashboard-grid { display: grid; grid-template-columns: 380px 1fr; gap: 40px; height: 100%; transition: all 0.3s ease; }
    .dashboard-grid.show-inv { grid-template-columns: 380px 380px 1fr; }

    .panel { display: flex; flex-direction: column; overflow: hidden; padding: 25px; border-radius: 20px; }
    .panel-header { margin-bottom: 20px; }
    .panel-header h3 { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 5px; }
    .panel-header p { font-size: 13px; color: var(--text-muted); }

    .store-selection { margin-bottom: 25px; }
    .store-selection label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
    .select-wrapper select { width: 100%; background: #0f172a; color: #fff; padding: 12px; border: 1px solid var(--glass-border); border-radius: 12px; outline: none; }

    .input-actions-area { flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.2); border-radius: 16px; border: 1px solid var(--glass-border); padding: 15px; margin-bottom: 20px; }
    .input-header { display: flex; gap: 10px; margin-bottom: 15px; }
    .ghost-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: #fff; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .ghost-btn:hover { background: rgba(255,255,255,0.1); }
    .ghost-btn.trash { padding: 8px; color: #f43f5e; border-color: rgba(244, 63, 94, 0.2); }

    textarea { flex: 1; background: none; border: none; color: #fff; font-family: 'Inter', sans-serif; font-size: 15px; resize: none; outline: none; padding: 5px; }
    
    .glow-btn { 
      background: linear-gradient(135deg, #7c73ff 0%, #6366f1 100%); 
      color: #fff; border: none; padding: 16px; border-radius: 16px; 
      font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px;
      cursor: pointer; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2); transition: all 0.3s ease;
    }
    .glow-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4); }
    .glow-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .toggle-inv-btn { margin-top: 15px; background: none; border: none; color: var(--accent); font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: underline; }

    /* Results */
    .results-panel.empty { display: flex; align-items: center; justify-content: center; text-align: center; background: rgba(255,255,255,0.02); }
    .empty-results .empty-icon { font-size: 64px; margin-bottom: 20px; opacity: 0.8; }
    .empty-results h3 { font-size: 22px; color: #fff; margin-bottom: 10px; }
    .empty-results p { color: var(--text-muted); line-height: 1.6; }

    .results-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 15px; border-bottom: 1px solid var(--glass-border); }
    .results-header .h-info span { font-size: 13px; color: var(--accent); font-weight: 700; text-transform: uppercase; }
    .total-badge { text-align: right; background: var(--accent); color: #000; padding: 8px 15px; border-radius: 12px; }
    .total-badge small { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .total-badge strong { font-size: 20px; font-weight: 900; }

    .results-scroll { margin-top: 20px; flex: 1; padding: 10px; }
    .modern-res-card { 
      background: rgba(255,255,255,0.03); padding: 25px 20px 20px 20px; border-radius: 16px; 
      margin-bottom: 20px; display: grid; grid-template-columns: 1fr 200px 100px;
      align-items: center; border: 1px solid rgba(255,255,255,0.05); position: relative;
    }
    .res-requested { font-weight: 700; color: #fff; font-size: 15px; }
    .store-tag { font-size: 10px; color: var(--accent); font-weight: 800; text-transform: uppercase; margin-bottom: 3px; }
    .prod-name { font-size: 13px; color: var(--text-muted); }
    .res-price { font-weight: 800; font-size: 18px; color: #fff; text-align: right; }
    .res-missing { color: #f43f5e; font-size: 12px; grid-column: 2 / span 2; }

    .modern-res-card.certo { border-left: 4px solid var(--accent); }
    .modern-res-card.duvida { border-left: 4px solid #fbbf24; background: rgba(251,191,36,0.05); }
    .modern-res-card.nao_encontrado { border-left: 4px solid var(--secondary); opacity: 0.5; }

    .duvida-alert { position: absolute; top: 12px; right: 12px; background: #fbbf24; color: #000; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 5px; }
    .duvida-alert.clickable { cursor: pointer; transition: all 0.2s; }
    .duvida-alert.clickable:hover { transform: scale(1.05); background: #fcd34d; }
    .duvida-alert.confirmed { background: var(--accent); color: #000; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #000; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

    .scroll-area { overflow-y: auto; }
    .inv-list-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .inv-list-item .p-n { font-size: 14px; color: #fff; }
    .inv-list-item .p-p { font-weight: 700; color: var(--accent); }

    .export-actions { display: flex; gap: 10px; margin-top: 20px; }
    .export-btn { flex: 1; padding: 12px; background: none; border: 1px solid var(--glass-border); color: var(--text-muted); border-radius: 12px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .export-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .export-btn.csv:hover { border-color: #10b981; color: #10b981; }
  `]
})
export class ComparadorComponent implements OnInit {
  private cotaService = inject(CotaService);
  
  userInput: string = '';
  results: ComparisonResult[] = [];
  isProcessing: boolean = false;
  selectedCompanyId?: number;
  selectedCompanyName: string = '';
  companies: any[] = [];
  selectedCompanyInventory: any[] = [];
  isInventoryVisible: boolean = false;

  ngOnInit() {
    this.cotaService.getEmpresas().subscribe((data: any[]) => this.companies = data);
  }

  onCompanyChange() {
    if (this.selectedCompanyId) {
      this.cotaService.getEmpresaById(this.selectedCompanyId).subscribe({
        next: (data: any) => {
          this.selectedCompanyInventory = data.inventory || [];
          this.selectedCompanyName = data.name;
          if (this.userInput) this.compareLists();
        },
        error: (err: any) => {
          console.error('Erro ao buscar produtos:', err);
          this.isInventoryVisible = false;
        }
      });
    } else {
      this.selectedCompanyInventory = [];
      this.selectedCompanyName = '';
      this.isInventoryVisible = false;
      if (this.userInput) this.compareLists();
    }
  }

  toggleInventory() {
    this.isInventoryVisible = !this.isInventoryVisible;
  }

  compareLists() {
    if (!this.userInput.trim()) {
      this.results = [];
      return;
    }

    this.isProcessing = true;
    const items = this.userInput.split('\n').filter(line => line.trim() !== '');
    
    this.cotaService.compararListas(items, this.selectedCompanyId).subscribe({
      next: (data: any[]) => {
        this.results = data;
        this.isProcessing = false;
      },
      error: (err: any) => {
        console.error('Error comparing lists:', err);
        this.isProcessing = false;
      }
    });
  }

  onFileUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Pega a primeira coluna de cada linha (ignorando vazias)
        const products = json.map(row => row[0]).filter(p => p && p.toString().trim() !== '');
        this.userInput = products.join('\n');
        this.compareLists();
      };
      reader.readAsArrayBuffer(file);
    } else {
      // TXT ou CSV simples
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        const lines = content.split('\n');
        const cleanList = lines.map((l: string) => {
          const item = l.split(/[;,]/)[0];
          return item ? item.trim() : '';
        }).filter((x: string) => x !== '' && !['STATUS','PRODUTO','NOME','ITEM'].includes(x.toUpperCase()));
        
        this.userInput = cleanList.join('\n');
        this.compareLists();
      };
      reader.readAsText(file);
    }
  }

  exportTxt() {
    if (!this.results.length) return;
    let content = "COTAFÁCIL - RELATÓRIO DE COMPARAÇÃO\n\n";
    content += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
    content += `Total Estimado: R$ ${this.getTotalCheapest().toFixed(2)}\n\n`;
    this.results.forEach(r => {
      content += `[${r.status}] ${r.requested}\n`;
      if (r.status !== 'NAO_ENCONTRADO') {
        content += `   -> Encontrado: ${r.matchedProduct}\n`;
        content += `   -> Loja: ${r.companyName}\n`;
        content += `   -> Preço: R$ ${r.price.toFixed(2)}\n`;
      } else {
        content += `   -> ITEM NÃO LOCALIZADO\n`;
      }
      content += `-----------------------------------\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CotaFacil_${new Date().getTime()}.txt`;
    a.click();
  }

  exportCsv() {
    if (!this.results.length) return;
    let csv = "Status;Produto Solicitado;Produto Encontrado;Loja;Preco\n";
    this.results.forEach(r => {
      const price = r.price ? r.price.toString().replace('.', ',') : '0';
      csv += `${r.status};${r.requested};${r.matchedProduct || ''};${r.companyName || ''};${price}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CotaFacil_${new Date().getTime()}.csv`;
    a.click();
  }

  get foundProductsCount(): number {
    return this.results.filter(r => r.status !== 'NAO_ENCONTRADO').length;
  }

  getTotalCheapest(): number {
    return this.results.reduce((acc, curr) => acc + (curr.price || 0), 0);
  }

  confirmProduct(res: ComparisonResult) {
    if (confirm(`Você confirma que "${res.requested}" é o mesmo que "${res.matchedProduct}"?`)) {
      this.cotaService.confirmMatch(res.requested, res.matchedProduct).subscribe({
        next: (response) => {
          alert('Solicitação enviada! Se o administrador aprovar, este item será pareado automaticamente no futuro.');
        },
        error: (err) => alert('Erro ao enviar solicitação.')
      });
    }
  }
}
