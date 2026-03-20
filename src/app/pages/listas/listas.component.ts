import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-listas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container animate-in">
      <div class="glass-card placeholder-card">
        <div class="icon">📝</div>
        <h1>Minhas Listas Salvas</h1>
        <p>Em breve você poderá salvar suas listas frequentes aqui para comparar quando quiser.</p>
        <button class="btn btn-primary" routerLink="/comparador">Voltar ao Comparador</button>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-card {
      padding: 100px 40px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      margin-top: 40px;
    }
    .icon { font-size: 80px; }
    h1 { color: var(--text); }
    p { color: var(--text-muted); margin-bottom: 20px; }
  `]
})
export class ListasComponent {}
