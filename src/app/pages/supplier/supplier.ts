import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CotaService } from '../../services/cota.service';
import { AuthService } from '../../services/auth.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="supplier-container animate-in">
      @if (isLoading) {
        <div class="loading-overlay">
          <div class="spinner"></div>
          <p>Carregando seu catálogo...</p>
        </div>
      }

      <div class="header-section glass-card preview-card">
        <div class="header-info">
          <h1>Olá, {{ company?.name || 'Fornecedor' }}</h1>
          <p>Seu catálogo está atualizado e visível para os compradores.</p>
        </div>
        <div class="header-stats">
          <div class="mini-stat">
            <span class="v">
              @if (company?.inventory) {
                {{ company.inventory.length }}
              } @else {
                0
              }
            </span>
            <span class="l">Produtos</span>
          </div>
        </div>
      </div>

      <div class="main-content-grid">
        <div class="inventory-card glass-card">
          <div class="card-header">
            <h3>Gerenciar Catálogo</h3>
            <div class="actions">
              <input type="file" #fileInput (change)="onUpload($event)" style="display: none" accept=".txt,.csv,.xlsx,.xls">
              <button class="glow-btn" (click)="fileInput.click()">
                <span>📤 Importar Lista (Excel/CSV)</span>
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th width="180">Cód. Barras</th>
                  <th width="150">Preço (Un)</th>
                  <th width="100">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (item of company?.inventory; track item.id) {
                  <tr class="item-row">
                    <td>
                      <div class="prod-name-cell">
                        <span class="icon">📦</span>
                        {{ item.name }}
                      </div>
                    </td>
                    <td class="barcode-cell">
                      <span class="b-code">{{ item.barcode || '---' }}</span>
                    </td>
                    <td>
                      <div class="price-edit">
                        <span class="curr">R$</span>
                        <input type="number" step="0.01" 
                               [(ngModel)]="item.price" 
                               (change)="updatePrice(item)"
                               class="inline-input">
                      </div>
                    </td>
                    <td>
                      <span class="status-pill">Ativo</span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="empty-state">
                      <div class="empty-content">
                        <p>Nenhum produto encontrado.</p>
                        <small>Suba um arquivo .txt (Nome;Preço;Código) para começar.</small>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL DE PREVIEW INTELIGENTE (FORNECEDOR) -->
      @if (showImportModal) {
        <div class="modal-overlay animate-in" (click)="showImportModal = false">
          <div class="modal-content glass-card import-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="h-title">
                <h2>Configurar Catálogo</h2>
                <p>Mapeie as colunas de Nome, Preço e Código de Barras do seu catálogo.</p>
              </div>
              <button class="close-btn" (click)="showImportModal = false">✕</button>
            </div>

            <div class="modal-body">
              <div class="import-controls">
                <div class="control-group selection-hint full-width">
                  <label>Como usar:</label>
                  <p>Clique em um <strong># Número</strong> para ignorar a linha ou nos <strong>Cabeçalhos</strong> para definir as colunas de dados.</p>
                </div>
              </div>

              <div class="preview-scroll scroll-area">
                <table class="mini-table preview-table">
                  <thead>
                    <tr>
                      <th class="idx-col">#</th>
                      @for (cell of previewData[0]; track $index; let colIdx = $index) {
                        <th [class.sel-name]="colIdx === selectedProdCol" 
                            [class.sel-barcode]="colIdx === selectedBarcodeCol"
                            [class.sel-price]="colIdx === selectedPriceCol"
                            (click)="selectColumn(colIdx)"
                            class="clickable-header">
                          @if (colIdx === selectedProdCol) { 🏷️ Nome }
                          @else if (colIdx === selectedBarcodeCol) { 🔍 EAN }
                          @else if (colIdx === selectedPriceCol) { 💰 Preço }
                          @else { Col {{ colIdx + 1 }} }
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of previewData.slice(0, 50); track $index) {
                      <tr [class.ignored-manually]="ignoredRows.has($index)"
                          (click)="toggleRow($index)">
                        <td class="idx-col">{{ $index }}</td>
                        @for (cell of row; track $index; let colIdx = $index) {
                          <td [class.sel-name]="colIdx === selectedProdCol"
                              [class.sel-barcode]="colIdx === selectedBarcodeCol"
                              [class.sel-price]="colIdx === selectedPriceCol">
                            {{ cell }}
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-footer">
              <div class="selection-status">
                <span [class.ok]="selectedProdCol !== -1">🏷️ Nome: {{ selectedProdCol !== -1 ? 'OK' : 'Pendente' }}</span>
                <span [class.ok]="selectedPriceCol !== -1">💰 Preço: {{ selectedPriceCol !== -1 ? 'OK' : 'Pendente' }}</span>
                <span [class.ok]="selectedBarcodeCol !== -1">🔍 EAN: {{ selectedBarcodeCol !== -1 ? 'OK' : 'Opcional' }}</span>
              </div>
              <div class="f-btns">
                <button class="btn btn-secondary" (click)="showImportModal = false">Cancelar</button>
                <button class="btn btn-primary" (click)="confirmImport()" [disabled]="selectedProdCol === -1 || selectedPriceCol === -1">Salvar Catálogo</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .supplier-container { padding: 40px; display: flex; flex-direction: column; gap: 40px; }
    .preview-card { 
      padding: 30px 40px;
      background: linear-gradient(135deg, rgba(124, 115, 255, 0.1) 0%, rgba(124, 115, 255, 0.05) 100%);
      display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(124, 115, 255, 0.2);
    }
    .mini-stat { background: var(--primary); padding: 15px 25px; border-radius: 16px; text-align: center; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
    .mini-stat .v { font-size: 24px; font-weight: 800; display: block; color: #fff; }
    .mini-stat .l { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); }

    .main-content-grid { margin-top: 30px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }

    .modern-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
    .modern-table th { padding: 15px; text-align: left; color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .item-row { background: rgba(255,255,255,0.02); transition: transform 0.2s, background 0.2s; }
    .item-row:hover { background: rgba(255,255,255,0.05); transform: translateX(5px); }
    .item-row td { padding: 15px; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
    .item-row td:first-child { border-left: 1px solid rgba(255,255,255,0.05); border-radius: 12px 0 0 12px; }
    .item-row td:last-child { border-right: 1px solid rgba(255,255,255,0.05); border-radius: 0 12px 12px 0; }

    .price-edit { display: flex; align-items: center; background: rgba(0,0,0,0.2); padding: 5px 10px; border-radius: 8px; border: 1px solid var(--glass-border); }
    .curr { font-size: 12px; font-weight: 800; color: var(--accent); margin-right: 5px; }
    .inline-input { background: none; border: none; color: #fff; font-weight: 700; width: 100%; outline: none; }
    
    .status-pill { background: rgba(5, 150, 105, 0.1); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid rgba(5, 150, 105, 0.2); }
    .prod-name-cell { display: flex; align-items: center; gap: 10px; font-weight: 600; }
    
    .glow-btn { background: var(--primary); color: #fff; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 700; position: relative; overflow: hidden; }
    .glow-btn:hover { box-shadow: 0 0 20px rgba(124, 115, 255, 0.4); }

    .empty-state { text-align: center; padding: 60px !important; color: var(--text-muted); }

    .loading-overlay { 
      position: absolute; top:0; left:0; right:0; bottom:0; 
      background: rgba(0,0,0,0.7); display: flex; flex-direction: column; 
      align-items: center; justify-content: center; z-index: 10; border-radius: 20px;
    }
    .spinner { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid var(--accent); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    @media (max-width: 768px) {
      .supplier-container { padding: 20px 10px; }
      .preview-card { flex-direction: column; text-align: center; gap: 20px; padding: 25px; }
      .header-info h1 { font-size: 22px; }
      .header-info p { font-size: 13px; margin-bottom: 20px; }
      .mini-stat { width: 100%; }
      
      .card-header { flex-direction: column; gap: 15px; align-items: flex-start; }
      .glow-btn { width: 100%; text-align: center; justify-content: center; }
      
      .table-container { overflow-x: auto; border-radius: 12px; }
      .modern-table { min-width: 500px; }
      .item-row td { padding: 12px 10px; font-size: 13px; }
      .price-edit { width: 100px; }
      .barcode-cell { display: none; } /* Hide barcode on very small screens to save space */
    }

    /* MODAL SHARED STYLES */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .import-modal { width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; padding: 0 !important; overflow: hidden; background: #1e293b; border: 1px solid var(--glass-border); border-radius: 20px; }
    .modal-header { padding: 25px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { color: #fff; font-size: 24px; font-weight: 800; }
    .close-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
    .modal-body { flex: 1; padding: 25px; overflow-y: auto; }
    
    .modal-footer { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; background: rgba(255,255,255,0.02); border-top: 1px solid var(--glass-border); }
    .selection-status { display: flex; gap: 15px; font-size: 11px; font-weight: 700; color: var(--text-muted); }
    .selection-status span.ok { color: #fff; }
    .f-btns { display: flex; gap: 10px; }

    .preview-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .preview-table th { background: rgba(255,255,255,0.05); padding: 12px; text-align: left; color: var(--text-muted); font-weight: 700; border: 1px solid var(--glass-border); cursor: pointer; }
    .preview-table td { padding: 10px 12px; border: 1px solid var(--glass-border); color: #fff; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    
    .idx-col { width: 40px; text-align: center !important; background: rgba(0,0,0,0.3) !important; color: var(--text-muted); font-size: 10px; }
    .preview-table tr { cursor: pointer; transition: background 0.2s; }
    .preview-table tr:hover { background: rgba(255,255,255,0.05); }
    .preview-table tr.ignored-manually td { background: rgba(244, 63, 94, 0.1) !important; color: #f43f5e !important; text-decoration: line-through; }

    .preview-table th.sel-name { background: #10b981 !important; color: #000 !important; }
    .preview-table td.sel-name { background: rgba(16, 185, 129, 0.1); color: #10b981; font-weight: 600; }
    
    .preview-table th.sel-barcode { background: #3b82f6 !important; color: #fff !important; }
    .preview-table td.sel-barcode { background: rgba(59, 130, 246, 0.1); color: #3b82f6; font-weight: 600; }

    .preview-table th.sel-price { background: #fbbf24 !important; color: #000 !important; }
    .preview-table td.sel-price { background: rgba(251, 191, 36, 0.1); color: #fbbf24; font-weight: 600; }

    .btn { padding: 12px 24px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: var(--accent); color: #000; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: rgba(255,255,255,0.05); color: #fff; }

    @media (max-width: 1024px) {
      .modal-overlay { padding: 0; align-items: flex-end; }
      .import-modal { max-width: 100%; width: 100%; max-height: 95vh; border-radius: 24px 24px 0 0; }
      .modal-footer { flex-direction: column-reverse; gap: 15px; }
      .f-btns { width: 100%; }
      .f-btns button { flex: 1; }
      .selection-status { width: 100%; justify-content: space-around; }
      .idx-col { display: none; }
    }
  `]
})
export class SupplierComponent implements OnInit {
  private cotaService = inject(CotaService);
  private authService = inject(AuthService);
  
  company: any = null;
  isLoading = true;

  showImportModal = false;
  previewData: any[][] = [];
  rawWorkbookData: any[][] = [];
  selectedProdCol = 0;
  selectedBarcodeCol = -1;
  selectedPriceCol = -1;
  ignoredRows: Set<number> = new Set();

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user?.companyId) {
        this.loadData(user.companyId);
      } else {
        this.isLoading = false;
      }
    });
  }

  loadData(companyId: string) {
    this.isLoading = true;
    this.cotaService.getMyCompany(companyId).subscribe({
      next: (data) => {
        this.company = data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  updatePrice(item: any) {
    if (!this.company?.id) return;
    this.cotaService.updateProductPrice(this.company.id, item.id, item.price).subscribe({
      next: () => console.log('Preço atualizado'),
      error: () => alert('Erro ao atualizar preço')
    });
  }

  onUpload(event: any) {
    const file = event.target.files[0];
    if (!file || !this.company?.id) return;
    
    this.ignoredRows.clear();
    const reader = new FileReader();

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        this.rawWorkbookData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        this.previewData = [...this.rawWorkbookData];
        this.showImportModal = true;
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e: any) => {
        const content = e.target.result;
        const lines = (content as string).split('\n');
        this.rawWorkbookData = lines.map(line => line.split(/[;,]/));
        this.previewData = [...this.rawWorkbookData];
        this.showImportModal = true;
      };
      reader.readAsText(file);
    }
  }

  toggleRow(index: number) {
    if (this.ignoredRows.has(index)) {
      this.ignoredRows.delete(index);
    } else {
      this.ignoredRows.add(index);
    }
  }

  selectColumn(idx: number) {
    if (this.selectedProdCol === idx) {
      this.selectedProdCol = -1;
    } else if (this.selectedBarcodeCol === idx) {
      this.selectedBarcodeCol = -1;
    } else if (this.selectedPriceCol === idx) {
      this.selectedPriceCol = -1;
    } else {
      if (this.selectedProdCol === -1) this.selectedProdCol = idx;
      else if (this.selectedPriceCol === -1) this.selectedPriceCol = idx;
      else if (this.selectedBarcodeCol === -1) this.selectedBarcodeCol = idx;
      else {
        // Rotaciona (Nome > Preço > Código)
        this.selectedProdCol = idx;
      }
    }
  }

  confirmImport() {
    if (!this.company?.id) return;

    const inventory = this.rawWorkbookData
      .filter((_, idx) => !this.ignoredRows.has(idx))
      .map(row => {
        const name = (row[this.selectedProdCol] || '').toString().trim();
        const priceStr = (row[this.selectedPriceCol] || '').toString().trim().replace(',', '.');
        const price = parseFloat(priceStr);
        const barcode = this.selectedBarcodeCol !== -1 ? (row[this.selectedBarcodeCol] || '').toString().trim() : '';

        if (name && !isNaN(price)) {
          return { name, price, barcode };
        }
        return null;
      })
      .filter(x => x && !['PRODUTO','DESCRIÇÃO','NOME','PREÇO','PRICE','VALOR'].includes(x.name.toUpperCase()));

    if (inventory.length === 0) {
      alert('Nenhum dado válido encontrado para importar.');
      return;
    }

    this.isLoading = true;
    this.showImportModal = false;
    this.cotaService.uploadInventory(this.company.id, inventory).subscribe(() => {
      alert(`${inventory.length} produtos importados com sucesso!`);
      this.loadData(this.company.id);
    });
  }
}
