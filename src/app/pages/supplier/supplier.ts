import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="supplier-container animate-in">
      <div class="header-section glass-card preview-card">
        <div class="header-info">
          <h1>Olá, {{ company?.name }}</h1>
          <p>Seu catálogo está atualizado e visível para os compradores.</p>
        </div>
        <div class="header-stats">
          <div class="mini-stat">
            <span class="v">{{ company?.inventory?.length || 0 }}</span>
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
                  <th>EAN/Barcode</th>
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
                    <td><code class="barcode">{{ item.barcode || '---' }}</code></td>
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
                        <small>Suba um arquivo .txt (Nome;Código;Preço) para começar.</small>
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
    .barcode { font-size: 11px; opacity: 0.6; font-family: monospace; }
    .prod-name-cell { display: flex; align-items: center; gap: 10px; font-weight: 600; }
    
    .glow-btn { background: var(--primary); color: #fff; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: 700; position: relative; overflow: hidden; }
    .glow-btn:hover { box-shadow: 0 0 20px rgba(124, 115, 255, 0.4); }

    .empty-state { text-align: center; padding: 60px !important; color: var(--text-muted); }
  `]
})
export class SupplierComponent implements OnInit {
  private http = inject(HttpClient);
  company: any = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<any>('http://localhost:3000/api/supplier/my-company').subscribe(data => this.company = data);
  }

  updatePrice(item: any) {
    this.http.patch(`http://localhost:3000/api/supplier/inventory/${item.id}`, { price: item.price }).subscribe({
      next: () => {
        // Opção: Mostrar um "toast" rápido
        console.log('Preço atualizado');
      },
      error: (err) => alert('Erro ao atualizar preço')
    });
  }

  onUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      const lines = content.split('\n');
      const inventory = lines.map((l: string) => {
        const parts = l.split(';');
        if (parts.length >= 2) {
          const name = parts[0];
          const barcode = parts.length === 3 ? parts[1] : '';
          const price = parts.length === 3 ? parts[2] : parts[1];
          return { name: name.trim(), barcode: barcode?.trim(), price: parseFloat(price.replace(',', '.')) };
        }
        return null;
      }).filter((x: any) => x);

      this.http.post('http://localhost:3000/api/supplier/upload-inventory', { inventory }).subscribe(() => {
        alert('Inventário atualizado!');
        this.loadData();
      });
    };
    reader.readAsText(file);
  }
}
