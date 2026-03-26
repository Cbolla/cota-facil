import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CotaService } from '../../services/cota.service';
import { ExcelService } from '../../services/excel.service';
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
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container animate-in">
      <div class="dashboard-grid" [class.show-inv]="isInventoryVisible">
        
        <!-- COLUNA 1: INPUT -->
        <div class="panel glass-card input-panel">
          <div class="panel-header">
            <div class="h-main">
               <h3>Sua Lista</h3>
               <button routerLink="/historico" class="history-link-btn">📜 Ver Histórico</button>
            </div>
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

          <div class="input-actions-area" 
               (dragover)="onDragOver($event)" 
               (dragleave)="onDragLeave($event)" 
               (drop)="onDrop($event)"
               [class.dragging]="isDragging">
            
            @if (isDragging) {
              <div class="drag-overlay animate-in">
                <div class="drop-icon">📥</div>
                <p>Solte o arquivo Excel aqui</p>
              </div>
            }

            <div class="input-header">
               <input type="file" #fileUploader (change)="onManualFileUpload($event)" style="display: none" accept=".txt,.csv,.xlsx,.xls">
               <button class="ghost-btn" (click)="fileUploader.click()">🖇️ Importar Excel</button>
               <button class="ghost-btn trash" (click)="userInput = ''; results = []">🗑️ Limpar</button>
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
             <div class="panel-header inventory-header">
               <h3>Produtos em: {{ selectedCompanyName }}</h3>
               <button class="ghost-btn excel" (click)="downloadCatalog()">📥 Excel</button>
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
                 <span>{{ results.length }} itens processados</span>
              </div>
              <div class="total-badge">
                 <small>Total Estimado</small>
                 <strong>{{ getTotalCheapest() | currency:'BRL' }}</strong>
              </div>
            </div>

            <div class="filter-pills">
              <button [class.active]="activeFilter === 'all'" (click)="activeFilter = 'all'">
                Tudo <small>{{ results.length }}</small>
              </button>
              <button [class.active]="activeFilter === 'CERTO'" (click)="activeFilter = 'CERTO'">
                Encontrados <small>{{ getCountByStatus('CERTO') }}</small>
              </button>
              <button [class.active]="activeFilter === 'DUVIDA'" (click)="activeFilter = 'DUVIDA'">
                Dúvidas <small>{{ getCountByStatus('DUVIDA') }}</small>
              </button>
              <button [class.active]="activeFilter === 'NAO_ENCONTRADO'" (click)="activeFilter = 'NAO_ENCONTRADO'">
                Não Achou <small>{{ getCountByStatus('NAO_ENCONTRADO') }}</small>
              </button>
            </div>

            <div class="results-scroll scroll-area">
              @for (res of filteredResults; track $index) {
                <div class="modern-res-card" [class]="res.status.toLowerCase()">
                  <div class="res-meta">
                    <span class="res-status-tag">{{ res.status }}</span>
                    <div class="res-requested">{{ res.requested }}</div>
                  </div>

                  @if (res.status !== 'NAO_ENCONTRADO') {
                    <div class="res-match">
                       <div class="store-tag">🏪 {{ res.companyName }}</div>
                       <div class="prod-name">{{ res.matchedProduct }}</div>
                    </div>
                  } @else {
                    <div class="res-missing">
                      <span class="icon">🔍</span>
                      Infelizmente não encontramos este item no catálogo.
                    </div>
                  }

                  <div class="res-price">
                    @if (res.status !== 'NAO_ENCONTRADO') {
                      <span>{{ res.price | currency:'BRL' }}</span>
                    } @else {
                      <span class="no-price">--</span>
                    }
                  </div>

                  @if (res.status === 'DUVIDA') {
                    <div class="duvida-alert clickable" (click)="confirmProduct(res)">
                      <div class="status-dot"></div>
                      <span>⚠️ Confirmar</span>
                    </div>
                  }
                </div>
              }
            </div>
            
            <div class="export-actions">
              <button class="export-btn excel" (click)="exportExcel()">📊 Excel</button>
              <button class="export-btn save" (click)="saveToProfile()">💾 Salvar</button>
              <div class="divider"></div>
              <button class="export-btn secondary" (click)="exportTxt()">📄 TXT</button>
              <button class="export-btn secondary" (click)="exportCsv()">📁 CSV</button>
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

      <!-- MODAL DE PREVIEW INTELIGENTE -->
      @if (showImportModal) {
        <div class="modal-overlay animate-in" (click)="showImportModal = false">
          <div class="modal-content glass-card import-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="h-title">
                <h2>Configurar Importação</h2>
                <p>Ajuste as colunas e linhas para importar os produtos corretamente.</p>
              </div>
              <button class="close-btn" (click)="showImportModal = false">✕</button>
            </div>

            <div class="modal-body">
              <div class="import-controls">
            <div class="control-group selection-hint full-width">
              <label>Dica:</label>
              <p>Clique em um <strong># Número</strong> para ignorar a linha ou no <strong>Cabeçalho (Col X)</strong> para selecionar a coluna de produtos.</p>
            </div>
          </div>

              <div class="preview-scroll scroll-area">
                <table class="mini-table preview-table">
                  <thead>
                    <tr>
                      <th class="idx-col">#</th>
                      @for (cell of previewData[0]; track $index) {
                        <th [class.selected]="$index === selectedProdCol" 
                            (click)="selectedProdCol = $index"
                            class="clickable-header">
                          Col {{ $index + 1 }}
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of previewData.slice(0, 50); track $index) {
                      <tr [class.ignored-manually]="ignoredRows.has($index)"
                          (click)="toggleRow($index)">
                        <td class="idx-col">{{ $index }}</td>
                        @for (cell of row; track $index) {
                          <td [class.selected]="$index === selectedProdCol">{{ cell }}</td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
                @if (previewData.length > 50) {
                  <div class="preview-footer-msg">Exibindo primeiras 50 linhas para ajuste de {{ previewData.length }} totais.</div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showImportModal = false">Cancelar</button>
              <button class="btn btn-primary" (click)="confirmImport()">Importar Agora</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .container { padding: 40px; max-width: 1600px; margin: 0 auto; min-height: calc(100vh - 100px); }
    .dashboard-grid { display: grid; grid-template-columns: 380px 1fr; gap: 30px; height: calc(100vh - 180px); transition: all 0.3s ease; }
    .dashboard-grid.show-inv { grid-template-columns: 380px 380px 1fr; }

    .panel { display: flex; flex-direction: column; overflow: hidden; padding: 25px; border-radius: 20px; position: relative; height: 100%; }
    .scroll-area { flex: 1; overflow-y: auto; padding-right: 10px; }
    
    /* Custom Scrollbar */
    .scroll-area::-webkit-scrollbar { width: 4px; }
    .scroll-area::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
    .scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    .scroll-area::-webkit-scrollbar-thumb:hover { background: var(--accent); }

    .panel-header { margin-bottom: 20px; flex-shrink: 0; }
    .panel-header .h-main { display: flex; justify-content: space-between; align-items: center; }
    .history-link-btn { background: none; border: none; color: var(--accent); font-size: 11px; font-weight: 800; text-transform: uppercase; cursor: pointer; text-decoration: underline; }
    .panel-header h3 { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 5px; }
    .panel-header p { font-size: 13px; color: var(--text-muted); }

    /* RESPONSIVIDADE MOBILE PREDIAL */
    @media (max-width: 1024px) {
      .container { padding: 20px 15px; min-height: auto; }
      .dashboard-grid { 
        grid-template-columns: 1fr !important; 
        height: auto; 
        gap: 20px; 
      }
      .panel { height: auto; min-height: 400px; padding: 20px; }
      .input-actions-area { min-height: 250px; }
      .modern-res-card { 
        grid-template-columns: 1fr !important; 
        gap: 15px; 
        padding: 20px;
      }
      .res-price { text-align: left; font-size: 22px; margin-top: 10px; }
      .res-missing { grid-column: 1; }
      
      /* IMPORT MODAL MOBILE */
      .modal-overlay { padding: 0; align-items: flex-end; }
      .import-modal { 
        max-width: 100%; 
        width: 100%;
        max-height: 95vh; 
        height: auto;
        border-radius: 24px 24px 0 0; 
        border: none;
      }
      .modal-header, .modal-body, .modal-footer { padding: 15px 20px; }
      .modal-header h2 { font-size: 18px; }
      .modal-header p { font-size: 11px; }
      .import-controls { margin-bottom: 15px; }
      
      .preview-scroll { 
        overflow-x: auto; 
        -webkit-overflow-scrolling: touch; 
        border-radius: 12px;
        background: rgba(0,0,0,0.2);
        margin: 0 -5px;
      }
      .preview-table { min-width: 600px; }
      .preview-table th, .preview-table td { padding: 8px; font-size: 11px; }
      
      .modal-footer { flex-direction: column-reverse; gap: 10px; }
      .modal-footer .btn { width: 100%; padding: 15px; }
      
      .import-controls .selection-hint p { font-size: 10px; }
      .idx-col { display: none; }
    }

    .store-selection { margin-bottom: 25px; flex-shrink: 0; }
    .store-selection label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
    .select-wrapper select { width: 100%; background: #0f172a; color: #fff; padding: 12px; border: 1px solid var(--glass-border); border-radius: 12px; outline: none; }

    .input-actions-area { 
      flex: 1; display: flex; flex-direction: column; background: rgba(0,0,0,0.2); 
      border-radius: 16px; border: 1px solid var(--glass-border); padding: 15px; 
      margin-bottom: 20px; position: relative; transition: all 0.3s ease; overflow: hidden;
    }
    .input-actions-area.dragging { border-color: var(--accent); background: rgba(124, 115, 255, 0.1); transform: scale(1.02); }
    
    .drag-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.9); border-radius: 16px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 10; pointer-events: none; border: 2px dashed var(--accent);
    }
    .drag-overlay .drop-icon { font-size: 40px; margin-bottom: 10px; }

    .input-header { display: flex; gap: 10px; margin-bottom: 15px; flex-shrink: 0; }
    .ghost-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: #fff; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .ghost-btn:hover { background: rgba(255,255,255,0.1); }
    .ghost-btn.trash { padding: 8px; color: #f43f5e; border-color: rgba(244, 63, 94, 0.2); }

    textarea { flex: 1; background: none; border: none; color: #fff; font-family: 'Inter', sans-serif; font-size: 15px; resize: none; outline: none; padding: 5px; overflow-y: auto; }
    textarea::-webkit-scrollbar { width: 4px; }
    textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    
    .glow-btn { 
      flex-shrink: 0;
      background: linear-gradient(135deg, #7c73ff 0%, #6366f1 100%); 
      color: #fff; border: none; padding: 16px; border-radius: 16px; 
      font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px;
      cursor: pointer; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2); transition: all 0.3s ease;
      width: 100%;
    }
    .glow-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4); }
    .glow-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .toggle-inv-btn { flex-shrink: 0; margin-top: 15px; background: none; border: none; color: var(--accent); font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: underline; width: 100%; text-align: center; }

    /* Results */
    .results-panel.empty { display: flex; align-items: center; justify-content: center; text-align: center; background: rgba(255,255,255,0.02); }
    .empty-results .empty-icon { font-size: 64px; margin-bottom: 20px; opacity: 0.8; }
    .empty-results h3 { font-size: 22px; color: #fff; margin-bottom: 10px; }
    .empty-results p { color: var(--text-muted); line-height: 1.6; }

    .results-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 15px; border-bottom: 1px solid var(--glass-border); flex-shrink: 0; }
    .results-header .h-info span { font-size: 13px; color: var(--accent); font-weight: 700; text-transform: uppercase; }
    .total-badge { text-align: right; background: var(--accent); color: #000; padding: 8px 15px; border-radius: 12px; flex-shrink: 0; }
    .total-badge small { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .total-badge strong { font-size: 20px; font-weight: 900; }

    .results-scroll { margin-top: 10px; flex: 1; padding: 10px; overflow-y: auto; }
    
    .filter-pills { display: flex; gap: 8px; margin-top: 15px; padding: 0 10px; flex-wrap: wrap; flex-shrink: 0; }
    .filter-pills button { 
      background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); color: var(--text-muted); 
      padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; gap: 6px;
    }
    .filter-pills button small { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 6px; opacity: 0.6; }
    .filter-pills button:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
    .filter-pills button.active { background: var(--accent); border-color: var(--accent); color: #000; }
    .filter-pills button.active small { background: rgba(0,0,0,0.1); color: #000; opacity: 1; }
    .modern-res-card { 
      background: rgba(255,255,255,0.03); padding: 25px 20px 20px 20px; border-radius: 16px; 
      margin-bottom: 20px; display: grid; grid-template-columns: 1fr 240px 120px;
      align-items: center; border: 1px solid rgba(255,255,255,0.05); position: relative;
    }
    .res-meta { display: flex; flex-direction: column; gap: 5px; }
    .res-status-tag { font-size: 9px; font-weight: 900; background: rgba(255,255,255,0.1); width: fit-content; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .res-requested { font-weight: 700; color: #fff; font-size: 15px; }
    
    .store-tag { font-size: 10px; color: var(--accent); font-weight: 800; text-transform: uppercase; margin-bottom: 3px; display: flex; align-items: center; gap: 4px; }
    .prod-name { font-size: 13px; color: var(--text-muted); line-height: 1.4; }
    
    .res-price { font-weight: 800; font-size: 18px; color: #fff; text-align: right; }
    .no-price { opacity: 0.3; }
    
    .res-missing { color: #f43f5e; font-size: 12px; grid-column: 2 / span 2; display: flex; align-items: center; gap: 8px; opacity: 0.8; }
    .res-missing .icon { font-size: 16px; }

    .modern-res-card.certo { border-left: 4px solid var(--accent); }
    .modern-res-card.certo .res-status-tag { background: rgba(124, 115, 255, 0.2); color: var(--accent); }
    
    .modern-res-card.duvida { border-left: 4px solid #fbbf24; background: rgba(251,191,36,0.05); }
    .modern-res-card.duvida .res-status-tag { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
    
    .modern-res-card.nao_encontrado { border-left: 4px solid var(--secondary); opacity: 0.6; }
    .modern-res-card.nao_encontrado .res-status-tag { background: rgba(255, 255, 255, 0.05); color: #94a3b8; }

    .duvida-alert { position: absolute; top: 12px; right: 12px; background: #fbbf24; color: #000; font-size: 10px; font-weight: 900; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 5px; cursor: pointer; transition: all 0.2s; }
    .duvida-alert:hover { transform: scale(1.05); background: #fcd34d; }

    /* Modal Import */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
      padding: 20px;
    }
    .import-modal { width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; padding: 0 !important; overflow: hidden; background: #1e293b; border: 1px solid var(--glass-border); }
    .modal-header { padding: 25px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { color: #fff; font-size: 24px; font-weight: 800; }
    .close-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
    .modal-body { flex: 1; padding: 25px; overflow-y: auto; }
    .modal-footer { padding: 20px; background: rgba(255,255,255,0.02); display: flex; justify-content: flex-end; gap: 15px; border-top: 1px solid var(--glass-border); }

    .import-controls { margin-bottom: 25px; }
    .import-controls.full-width { grid-template-columns: 1fr; }
    .selection-hint p { font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-top: 5px; }
    .selection-hint strong { color: var(--accent); }
    .control-group label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
    .control-group input, .control-group select { width: 100%; background: #0f172a; color: #fff; padding: 12px; border: 1px solid var(--glass-border); border-radius: 10px; outline: none; }

    .preview-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .preview-table th { background: rgba(255,255,255,0.05); padding: 12px; text-align: left; color: var(--text-muted); font-weight: 700; border: 1px solid var(--glass-border); }
    .preview-table th.clickable-header { cursor: pointer; transition: all 0.2s; }
    .preview-table th.clickable-header:hover { background: rgba(124, 115, 255, 0.1); color: #fff; }
    .preview-table td { padding: 10px 12px; border: 1px solid var(--glass-border); color: #fff; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
    .preview-table th.selected { background: var(--accent) !important; color: #000 !important; }
    .preview-table td.selected { background: rgba(124, 115, 255, 0.1); color: var(--accent); opacity: 1; font-weight: 600; }
    .preview-table tr.skipped td { opacity: 0.2; text-decoration: line-through; filter: grayscale(1); }
    .preview-table tr.ignored-manually td { background: rgba(244, 63, 94, 0.1) !important; color: #f43f5e !important; text-decoration: line-through; }
    .idx-col { width: 40px; text-align: center !important; background: rgba(0,0,0,0.3) !important; color: var(--text-muted); font-size: 10px; }
    
    .preview-table tr { cursor: pointer; transition: background 0.2s; }
    .preview-table tr:hover:not(.skipped) { background: rgba(255,255,255,0.05); }

    .btn { padding: 12px 24px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: var(--accent); color: #000; }
    .btn-secondary { background: rgba(255,255,255,0.05); color: #fff; }
    .btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

    .scroll-area { overflow-y: auto; flex: 1; }
    .export-actions { display: flex; gap: 10px; margin-top: 20px; flex-shrink: 0; }
    .export-btn { flex: 1; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: #fff; border-radius: 12px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .export-btn:hover { background: rgba(255,255,255,0.1); }
    .export-btn.excel { background: #10b981; border: none; }
    .export-btn.save { background: #6366f1; border: none; }
    .divider { width: 1px; height: 30px; background: var(--glass-border); margin: 0 10px; }
  `]
})
export class ComparadorComponent implements OnInit {
  private cotaService = inject(CotaService);
  private excelService = inject(ExcelService);
  
  userInput: string = '';
  results: ComparisonResult[] = [];
  isProcessing: boolean = false;
  
  isDragging = false;
  showImportModal = false;
  previewData: any[][] = [];
  skipRows = 0;
  selectedProdCol = 0;
  rawWorkbookData: any[][] = [];
  ignoredRows: Set<number> = new Set();
  activeFilter: string = 'all';

  selectedCompanyId?: string;
  selectedCompanyName: string = '';
  companies: any[] = [];
  selectedCompanyInventory: any[] = [];
  isInventoryVisible: boolean = false;

  ngOnInit() {
    this.cotaService.getEmpresas().subscribe((data: any[]) => this.companies = data);
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onManualFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File) {
    this.ignoredRows.clear();
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
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
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result as string;
        const lines = content.split('\n');
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

  confirmImport() {
    const products = this.rawWorkbookData
      .filter((_, idx) => !this.ignoredRows.has(idx))
      .map(row => row[this.selectedProdCol])
      .filter(p => p && p.toString().trim() !== '' && !['CERTO','DUVIDA','NAO_ENCONTRADO','STATUS','PRODUTO','ITEM'].includes(p.toString().toUpperCase()));
    
    this.userInput = products.join('\n');
    this.showImportModal = false;
    this.compareLists();
  }

  onCompanyChange() {
    if (this.selectedCompanyId) {
      this.isProcessing = true;
      this.cotaService.getMyCompany(this.selectedCompanyId).subscribe({
        next: (data: any) => {
          this.selectedCompanyInventory = data.inventory || [];
          this.selectedCompanyName = data.name;
          this.isProcessing = false;
          if (this.userInput) this.compareLists();
        },
        error: (err: any) => {
          console.error('Erro ao buscar produtos:', err);
          this.isInventoryVisible = false;
          this.isProcessing = false;
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
        // Ordenação lógica: CERTO, DUVIDA, NAO_ENCONTRADO
        const priority: Record<string, number> = { 'CERTO': 0, 'DUVIDA': 1, 'NAO_ENCONTRADO': 2 };
        this.results = data.sort((a, b) => priority[a.status] - priority[b.status]);
        this.isProcessing = false;
      },
      error: (err: any) => {
        console.error('Error comparing lists:', err);
        this.isProcessing = false;
      }
    });
  }

  get filteredResults(): ComparisonResult[] {
    if (this.activeFilter === 'all') return this.results;
    return this.results.filter(r => r.status === this.activeFilter);
  }

  getCountByStatus(status: string): number {
    return this.results.filter(r => r.status === status).length;
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
        next: () => alert('Sugestão enviada com sucesso!'),
        error: () => alert('Erro ao enviar sugestão.')
      });
    }
  }

  exportExcel() {
    this.excelService.exportComparison(this.results, this.getTotalCheapest());
  }

  exportTxt() {
    let content = "COTAFÁCIL - RESULTADO\n\n";
    this.results.forEach(r => content += `${r.status}: ${r.requested} -> ${r.matchedProduct || '---'} (${r.price})\n`);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cotacao.txt';
    a.click();
  }

  exportCsv() {
    let csv = "Status;Solicitado;Encontrado;Loja;Preco\n";
    this.results.forEach(r => csv += `${r.status};${r.requested};${r.matchedProduct || ''};${r.companyName || ''};${r.price}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cotacao.csv';
    a.click();
  }

  saveToProfile() {
    if (!this.results.length) return;
    this.isProcessing = true;
    this.cotaService.saveQuote('Cotação Importada', this.results, this.getTotalCheapest()).subscribe({
      next: () => {
        this.isProcessing = false;
        alert('Cotação salva!');
      },
      error: () => {
        this.isProcessing = false;
        alert('Erro ao salvar.');
      }
    });
  }

  downloadCatalog() {
    this.excelService.exportInventory(this.selectedCompanyInventory, this.selectedCompanyName);
  }
}
