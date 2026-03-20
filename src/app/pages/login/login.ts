import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container animate-in">
      <div class="auth-card glass-card">
        <div class="auth-header">
          <h2>Bem-vindo de volta</h2>
          <p>Acesse seu painel CotaFácil</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label>E-mail</label>
            <input type="email" name="email" [(ngModel)]="email" required placeholder="seu@email.com">
          </div>

          <div class="form-group">
            <label>Senha</label>
            <input type="password" name="password" [(ngModel)]="password" required placeholder="••••••••">
          </div>

          @if (error) {
            <p class="error-msg">{{ error }}</p>
          }

          <button type="submit" [disabled]="isLoading" class="btn btn-primary">
            {{ isLoading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Não tem uma conta? <a routerLink="/register">Cadastre-se</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 40px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .form-group {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    input {
      background: var(--glass);
      border: 1px solid var(--glass-border);
      padding: 12px;
      border-radius: 8px;
      color: #fff;
      outline: none;
    }
    .btn-primary { width: 100%; margin-top: 10px; }
    .auth-footer { margin-top: 20px; text-align: center; font-size: 14px; }
    .auth-footer a { color: var(--accent); font-weight: 600; text-decoration: none; }
    .error-msg { color: #f43f5e; font-size: 13px; text-align: center; margin-bottom: 10px; }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = '';
  isLoading = false;

  onSubmit() {
    this.isLoading = true;
    this.error = '';
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        const role = res.user.role;
        if (role === 'ADMIN') this.router.navigate(['/admin']);
        else if (role === 'SUPPLIER') this.router.navigate(['/vendedor']);
        else this.router.navigate(['/comparador']);
      },
      error: (err) => {
        this.error = 'E-mail ou senha inválidos';
        this.isLoading = false;
      }
    });
  }
}
