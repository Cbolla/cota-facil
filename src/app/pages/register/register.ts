import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container animate-in">
      <div class="auth-card glass-card">
        <div class="auth-header">
          <h2>Crie sua conta</h2>
          <p>Selecione seu perfil abaixo</p>
        </div>

        <form (ngSubmit)="onSubmit()" #regForm="ngForm">
          <div class="form-group role-selector">
            <button type="button" [class.active]="role === 'CLIENT'" (click)="role = 'CLIENT'">Comprador</button>
            <button type="button" [class.active]="role === 'SUPPLIER'" (click)="role = 'SUPPLIER'">Fornecedor</button>
          </div>

          <div class="form-group">
            <label>Nome</label>
            <input type="text" name="name" [(ngModel)]="name" required placeholder="Seu nome completo">
          </div>

          <div class="form-group">
            <label>E-mail</label>
            <input type="email" name="email" [(ngModel)]="email" required placeholder="seu@email.com" autocomplete="username">
          </div>

          <div class="form-group">
            <label>Senha</label>
            <input type="password" name="password" [(ngModel)]="password" required placeholder="••••••••" autocomplete="new-password">
          </div>

          @if (error) {
            <p class="error-msg">{{ error }}</p>
          }

          <button type="submit" [disabled]="isLoading" class="btn btn-primary">
            {{ isLoading ? 'Cadastrando...' : 'Criar Conta' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Já tem uma conta? <a routerLink="/login">Entrar</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; align-items: center; justify-content: center; min-height: 80vh; padding: 20px; }
    .auth-card { width: 100%; max-width: 450px; padding: 40px; }
    .role-selector { display: flex; gap: 10px; margin-bottom: 25px; }
    .role-selector button { 
      flex: 1; padding: 12px; border: 1px solid var(--glass-border); 
      background: var(--glass); color: #fff; border-radius: 8px; cursor: pointer; 
      transition: all 0.3s ease;
    }
    .role-selector button.active { 
      background: var(--primary); border-color: var(--accent); font-weight: 700; 
      box-shadow: 0 0 15px rgba(124, 115, 255, 0.3);
    }
    .form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
    input { background: var(--glass); border: 1px solid var(--glass-border); padding: 12px; border-radius: 8px; color: #fff; outline: none; }
    .btn-primary { width: 100%; }
    .error-msg { color: #f43f5e; font-size: 13px; text-align: center; margin-bottom: 15px; background: rgba(244, 63, 94, 0.1); padding: 8px; border-radius: 4px; }
    .auth-footer { margin-top: 20px; text-align: center; }
    .auth-footer a { color: var(--accent); text-decoration: none; font-weight: 600; }
    
    @media (max-width: 480px) {
      .auth-container { min-height: 100vh; padding: 15px; }
      .auth-card { padding: 25px 20px; border-radius: 20px; }
      .role-selector { flex-direction: column; }
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  role: 'CLIENT' | 'SUPPLIER' = 'CLIENT';
  error = '';
  isLoading = false;

  onSubmit() {
    this.isLoading = true;
    this.error = '';
    this.authService.register({ name: this.name, email: this.email, password: this.password, role: this.role }).subscribe({
      next: () => {
        if (this.role === 'SUPPLIER') this.router.navigate(['/vendedor']);
        else this.router.navigate(['/comparador']);
      },
      error: (err) => {
        this.error = err.message || 'Erro ao criar conta. Tente outro e-mail.';
        this.isLoading = false;
      }
    });
  }
}
