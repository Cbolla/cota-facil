import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CotaService } from '../../services/cota.service';
import { AuthService } from '../../services/auth.service';

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
              <input type="file" #fileInput (change)="onUpload($event)" style="display: none" accept=".txt,.csv">
              <button class="glow-btn" (click)="fileInput.click()">
                <span>📤 Importar Lista</span>
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Produto</th>
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
                    <td colspan="3" class="empty-state">
                      <div class="empty-content">
                        <p>Nenhum produto encontrado.</p>
                        <small>Suba um arquivo .txt (Nome;Preço) para começar.</small>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
      .price-edit { width: 120px; }
    }
  `]
})
export class SupplierComponent implements OnInit {
  private cotaService = inject(CotaService);
  private authService = inject(AuthService);
  
  company: any = null;
  isLoading = true;

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
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      const lines = content.split('\n');
      const inventory = lines.map((l: string) => {
        const parts = l.split(';');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const price = parseFloat(parts[1].trim().replace(',', '.'));
          return { name, price };
        }
        return null;
      }).filter((x: any) => x);

      this.isLoading = true;
      this.cotaService.uploadInventory(this.company.id, inventory).subscribe(() => {
        alert('Catálogo atualizado!');
        this.loadData(this.company.id);
      });
    };
    reader.readAsText(file);
  }
}
