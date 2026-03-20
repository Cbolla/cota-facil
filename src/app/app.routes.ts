import { Routes } from '@angular/router';
import { ComparadorComponent } from './pages/comparador/comparador.component';
import { AdminComponent } from './pages/admin/admin';
import { SupplierComponent } from './pages/supplier/supplier';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'comparador', 
    component: ComparadorComponent, 
    canActivate: [roleGuard(['CLIENT', 'ADMIN'])] 
  },
  { 
    path: 'vendedor', 
    component: SupplierComponent, 
    canActivate: [roleGuard(['SUPPLIER', 'ADMIN'])] 
  },
  { 
    path: 'admin', 
    component: AdminComponent, 
    canActivate: [roleGuard(['ADMIN'])] 
  },
  { path: '**', redirectTo: '/login' }
];
