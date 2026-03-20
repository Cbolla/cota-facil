import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CotaService } from '../../services/cota.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container animate-in">
      <div class="header-section glass-card">
        <h1>Painel Administrativo</h1>
        <p>Gerenciamento de usuários e plataforma</p>
      </div>

      <div class="admin-grid">
        <!-- SEÇÃO USUÁRIOS -->
        <div class="glass-card panel-item">
          <div class="panel-header">
            <h3>👥 Usuários Cadastrados</h3>
          </div>
          <div class="scroll-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users; track user.id) {
                  <tr>
                    <td>#{{ user.id }}</td>
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>
                    <td><span class="badge" [class]="user.role.toLowerCase()">{{ user.role }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- SEÇÃO MAPEAMENTOS -->
        <div class="glass-card panel-item">
          <div class="panel-header">
            <h3>🔗 Solicitações de Vínculo (Sinônimos)</h3>
            <p>Aprove estes itens para que o sistema aprenda variações de nomes.</p>
          </div>
          <div class="scroll-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Digitado pelo Cliente</th>
                  <th>Produto no Catálogo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                @for (m of pendingMappings; track m.id) {
                  <tr>
                    <td><span class="raw-name">{{ m.originalName }}</span></td>
                    <td><span class="found-name">{{ m.matchedName }}</span></td>
                    <td>
                      <button class="action-btn approve" (click)="approve(m.id)">Aprovar Vínculo</button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="empty-cell">Nenhuma solicitação pendente.</td>
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
    .admin-container { padding: 40px; }
    .header-section { padding: 30px; margin-bottom: 30px; border: 1px solid var(--glass-border); }
    .header-section h1 { font-size: 28px; font-weight: 900; color: #fff; margin: 0; }
    .header-section p { color: var(--text-muted); margin-top: 5px; }

    .admin-grid { display: grid; grid-template-columns: 1fr; gap: 30px; }
    .panel-item { padding: 25px; border: 1px solid var(--glass-border); }
    .panel-header { margin-bottom: 20px; }
    .panel-header h3 { font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 5px; }
    .panel-header p { font-size: 13px; color: var(--text-muted); }

    .scroll-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: var(--text-muted); border-bottom: 2px solid var(--glass-border); }
    .data-table td { padding: 15px 12px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.05); }

    .badge { padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .badge.admin { background: #7c3aed30; color: #a78bfa; border: 1px solid #7c3aed50; }
    .badge.supplier { background: #05966930; color: #6ee7b7; border: 1px solid #05966950; }
    .badge.client { background: #2563eb30; color: #93c5fd; border: 1px solid #2563eb50; }

    .raw-name { font-weight: 700; color: #fff; }
    .found-name { color: var(--accent); font-weight: 600; }

    .action-btn { background: var(--accent); color: #000; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 800; transition: all 0.2s; }
    .action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(124, 115, 255, 0.3); }
    .action-btn.approve { background: #10b981; color: #fff; }

    .empty-cell { text-align: center; padding: 40px !important; color: var(--text-muted); font-style: italic; }
  `]
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);
  private cotaService = inject(CotaService);
  
  users: any[] = [];
  pendingMappings: any[] = [];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.http.get<any[]>('http://localhost:3000/api/admin/users').subscribe(data => this.users = data);
    this.cotaService.getPendingMappings().subscribe(data => this.pendingMappings = data);
  }

  approve(id: number) {
    this.cotaService.approveMapping(id).subscribe({
      next: () => {
        alert('Vínculo aprovado! Agora o sistema fará o pareamento automático para este nome.');
        this.loadData();
      },
      error: () => alert('Erro ao aprovar.')
    });
  }
}
