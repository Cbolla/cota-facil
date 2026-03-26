import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CotaService } from '../../services/cota.service';
import { ExcelService } from '../../services/excel.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-listas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container animate-in">
      <div class="header-actions">
        <div class="title-group">
          <h1>Minhas Cotações Salvas</h1>
          <p>Acesse e exporte suas comparações de preços a qualquer momento.</p>
        </div>
        <button class="btn btn-primary" routerLink="/comparador">➕ Nova Cotação</button>
      </div>

      <div class="table-container glass-card">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Nome da Cotação</th>
              <th>Data</th>
              <th>Itens</th>
              <th>Valor Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (quote of savedQuotes; track quote.id) {
              <tr>
                <td>
                  <div class="quote-cell">
                    <span class="icon">📄</span>
                    <strong>{{ quote.name }}</strong>
                  </div>
                </td>
                <td>{{ quote.date | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ quote.items.length }} produtos</td>
                <td><strong class="total-price">{{ quote.total | currency:'BRL' }}</strong></td>
                <td>
                  <div class="actions">
                    <button class="action-btn excel" title="Baixar Excel" (click)="exportExcel(quote)">📊</button>
                    <button class="action-btn danger" title="Excluir" (click)="deleteQuote(quote.id)">🗑️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="empty-table-msg">
                  <div class="empty-state">
                    <span>📭</span>
                    <p>Você ainda não possui cotações salvas.</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .title-group h1 { font-size: 28px; color: #fff; margin-bottom: 5px; }
    .title-group p { color: var(--text-muted); font-size: 14px; }

    .table-container { padding: 0; overflow: hidden; }
    .modern-table { width: 100%; border-collapse: collapse; }
    .modern-table th { padding: 18px 24px; background: rgba(255,255,255,0.03); color: var(--text-muted); text-align: left; font-size: 13px; text-transform: uppercase; }
    .modern-table td { padding: 16px 24px; border-bottom: 1px solid var(--glass-border); color: #fff; }
    
    .quote-cell { display: flex; align-items: center; gap: 10px; }
    .total-price { color: var(--accent); }

    .actions { display: flex; gap: 8px; }
    .action-btn { 
      width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--glass-border); 
      background: rgba(255,255,255,0.05); cursor: pointer; display: flex; align-items: center; justify-content: center; 
      transition: all 0.2s;
    }
    .action-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
    .action-btn.excel { color: #10b981; }
    .action-btn.danger { color: #f43f5e; }

    .empty-state { padding: 60px; text-align: center; }
    .empty-state span { font-size: 48px; display: block; margin-bottom: 10px; }
    
    @media (max-width: 768px) {
      .header-actions { flex-direction: column; align-items: flex-start; gap: 15px; }
      .title-group h1 { font-size: 24px; }
      .table-container { overflow-x: auto; }
      .modern-table { min-width: 600px; }
    }
  `]
})
export class ListasComponent implements OnInit {
  private cotaService = inject(CotaService);
  private excelService = inject(ExcelService);
  
  savedQuotes: any[] = [];

  ngOnInit() {
    this.loadQuotes();
  }

  loadQuotes() {
    this.cotaService.getSavedQuotes().subscribe({
      next: (data: any[]) => this.savedQuotes = data,
      error: (err: any) => console.error('Error loading quotes:', err)
    });
  }

  exportExcel(quote: any) {
    this.excelService.exportComparison(quote.results, quote.total);
  }

  deleteQuote(id: string) {
    if (confirm('Tem certeza que deseja excluir esta cotação?')) {
      this.cotaService.deleteQuote(id).subscribe({
        next: () => this.loadQuotes(),
        error: (err: any) => alert('Erro ao excluir: ' + err.message)
      });
    }
  }
}
