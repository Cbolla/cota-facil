import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CotaService } from '../../services/cota.service';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container animate-in">
      <div class="header">
        <div class="h-title">
          <button routerLink="/comparador" class="back-btn">← Voltar</button>
          <h1>Minhas Cotações</h1>
          <p>Histórico completo de comparativos salvos</p>
        </div>
      </div>

      <div class="content">
        <div class="quotes-grid">
          @for (quote of quotes; track quote.id) {
            <div class="quote-card glass-card animate-in">
              <div class="card-header">
                <span class="date">{{ quote.createdAt?.toDate() | date:'dd/MM/yyyy HH:mm' }}</span>
                <h3>{{ quote.name || 'Cotação sem nome' }}</h3>
              </div>
              
              <div class="card-body">
                <div class="stat">
                  <span class="label">Itens</span>
                  <span class="value">{{ quote.results?.length || 0 }}</span>
                </div>
                <div class="stat">
                  <span class="label">Total</span>
                  <span class="value accent">{{ quote.total | currency:'BRL' }}</span>
                </div>
              </div>

              <div class="card-footer">
                <button class="btn btn-view" (click)="openDetail(quote)">👁️ Ver Detalhes</button>
                <button class="btn btn-delete" (click)="deleteQuote(quote.id)">🗑️ Excluir</button>
              </div>
            </div>
          } @empty {
            <div class="empty-state glass-card animate-in">
              <div class="icon">📦</div>
              <h3>Nenhuma cotação salva</h3>
              <p>Comece comparando preços e salve seus resultados.</p>
              <button routerLink="/comparador" class="glow-btn">Ir para Comparador</button>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- MODAL DE DETALHES -->
    @if (selectedQuote) {
      <div class="modal-overlay animate-in" (click)="selectedQuote = null">
        <div class="modal-content glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Detalhes da Cotação</h2>
              <button class="close-btn" (click)="selectedQuote = null">✕</button>
            </div>
            <div class="modal-body scroll-area">
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th>Produto Solicitado</th>
                      <th>Encontrado em Loja</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (res of selectedQuote.results; track $index) {
                      <tr>
                        <td>{{ res.requested }}</td>
                        <td>
                          @if (res.matchedProduct) {
                            <div class="match-info">
                              <strong>{{ res.matchedProduct }}</strong>
                              <small>{{ res.companyName }}</small>
                            </div>
                          } @else {
                            <span class="not-found">Não encontrado</span>
                          }
                        </td>
                        <td class="price">{{ (res.price || 0) | currency:'BRL' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
            </div>
            <div class="modal-footer">
               <div class="summary">
                 <small>Valor Total desta Cotação:</small>
                 <strong>{{ selectedQuote.total | currency:'BRL' }}</strong>
               </div>
               <button class="btn btn-primary" (click)="selectedQuote = null">Fechar</button>
            </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .container { padding: 40px; max-width: 1200px; margin: 0 auto; height: 100vh; overflow-y: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
    .back-btn { background: none; border: none; color: var(--accent); font-weight: 700; cursor: pointer; margin-bottom: 10px; display: block; }
    h1 { font-size: 32px; font-weight: 800; color: #fff; margin-bottom: 5px; }
    p { color: var(--text-muted); font-size: 14px; }

    .quotes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    
    @media (max-width: 768px) {
      .container { padding: 20px 15px; }
      h1 { font-size: 24px; }
      .header { flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 25px; }
      .quotes-grid { grid-template-columns: 1fr; }
      .quote-card { padding: 20px; }
      .modal-content { max-width: 100%; height: 100%; border-radius: 0; }
      .detail-table { font-size: 13px; }
      .detail-table th:nth-child(2), .detail-table td:nth-child(2) { display: none; }
    }

    .quote-card { padding: 25px; border-radius: 20px; transition: all 0.3s ease; }
    .quote-card:hover { transform: translateY(-5px); border-color: var(--accent); }
    
    .card-header .date { font-size: 11px; font-weight: 800; color: var(--accent); text-transform: uppercase; }
    .card-header h3 { font-size: 20px; color: #fff; margin: 5px 0 15px 0; }
    
    .card-body { display: flex; gap: 20px; padding: 15px 0; border-top: 1px solid var(--glass-border); border-bottom: 1px solid var(--glass-border); margin-bottom: 15px; }
    .stat { display: flex; flex-direction: column; }
    .stat .label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 800; }
    .stat .value { font-size: 18px; font-weight: 900; color: #fff; }
    .stat .value.accent { color: var(--accent); }
    
    .card-footer { display: flex; gap: 10px; }
    .btn { flex: 1; padding: 10px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; font-size: 12px; transition: all 0.2s; }
    .btn-view { background: rgba(124, 115, 255, 0.1); color: var(--accent); border: 1px solid rgba(124, 115, 255, 0.2); }
    .btn-delete { background: rgba(244, 63, 94, 0.1); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.2); }
    .btn:hover { transform: translateY(-2px); filter: brightness(1.2); }

    .empty-state { grid-column: 1 / -1; text-align: center; padding: 80px; }
    .empty-state .icon { font-size: 64px; margin-bottom: 20px; }
    .empty-state h3 { font-size: 24px; color: #fff; margin-bottom: 10px; }
    .empty-state p { color: var(--text-muted); margin-bottom: 25px; }
    
    .glow-btn { background: var(--accent); color: #000; padding: 12px 30px; border-radius: 12px; font-weight: 800; border: none; cursor: pointer; }

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-content { width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; padding: 0 !important; overflow: hidden; }
    .modal-header { padding: 25px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { color: #fff; font-size: 22px; }
    .close-btn { background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; }
    .modal-body { flex: 1; padding: 25px; overflow-y: auto; }
    .modal-footer { padding: 20px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border-top: 1px solid var(--glass-border); }
    
    .summary small { color: var(--text-muted); display: block; }
    .summary strong { font-size: 22px; color: var(--accent); }
    .btn-primary { background: var(--accent); color: #000; width: auto; padding: 12px 30px; }

    .detail-table { width: 100%; border-collapse: collapse; }
    .detail-table th { text-align: left; padding: 12px; color: var(--text-muted); font-size: 11px; text-transform: uppercase; border-bottom: 2px solid var(--glass-border); }
    .detail-table td { padding: 15px 12px; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; font-size: 14px; }
    .match-info strong { display: block; color: var(--accent); }
    .match-info small { color: var(--text-muted); font-size: 11px; }
    .not-found { color: #f43f5e; opacity: 0.7; }
    .price { font-weight: 800; text-align: right; }

    .scroll-area::-webkit-scrollbar { width: 4px; }
    .scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  `]
})
export class HistoricoComponent implements OnInit {
  private cotaService = inject(CotaService);
  quotes: any[] = [];
  selectedQuote: any = null;

  ngOnInit() {
    this.cotaService.getSavedQuotes().subscribe(data => {
      this.quotes = data.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
    });
  }

  deleteQuote(id: string) {
    if (confirm('Deseja excluir esta cotação permanentemente?')) {
      this.cotaService.deleteQuote(id).subscribe({
        next: () => {
          this.quotes = this.quotes.filter(q => q.id !== id);
          alert('Excluída com sucesso!');
        }
      });
    }
  }

  openDetail(quote: any) {
    this.selectedQuote = quote;
  }
}
