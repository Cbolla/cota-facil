import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  Auth, 
  authState,
  User as FirebaseUser
} from '@angular/fire/auth';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Observable, from, of, switchMap, map, tap, catchError, throwError } from 'rxjs';

export type Role = 'ADMIN' | 'SUPPLIER' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // Observable para o estado do usuário
  user$ = authState(this.auth).pipe(
    switchMap(fbUser => {
      if (!fbUser) return of(null);
      const userRef = doc(this.firestore, 'users', fbUser.uid);
      return from(getDoc(userRef)).pipe(
        map(snap => {
          if (!snap.exists()) return null;
          const data = snap.data();
          return {
            id: fbUser.uid,
            email: fbUser.email!,
            name: data['name'],
            role: data['role'],
            companyId: data['companyId']
          } as User;
        }),
        catchError(() => of(null))
      );
    }),
    tap(user => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    })
  );

  register(userData: { email: string, password: string, name: string, role: Role }): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, userData.email, userData.password)).pipe(
      switchMap(cred => {
        // 1. Atualiza Nome no Auth
        const profilePromise = updateProfile(cred.user, { displayName: userData.name });
        
        // 2. Salva no Firestore
        const userRef = doc(this.firestore, 'users', cred.user.uid);
        const firestorePromise = setDoc(userRef, {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          createdAt: new Date()
        });

        return from(Promise.all([profilePromise, firestorePromise])).pipe(
          map(() => cred)
        );
      }),
      catchError(err => {
        console.error('Register error details:', err);
        let msg = 'Erro no cadastro.';
        if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está em uso.';
        if (err.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres.';
        if (err.code === 'auth/invalid-email') msg = 'E-mail inválido.';
        return throwError(() => new Error(msg));
      })
    );
  }

  login(credentials: { email: string, password: string }): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, credentials.email, credentials.password)).pipe(
      catchError(err => {
        console.error('Login error details:', err);
        let msg = 'E-mail ou senha inválidos.';
        if (err.code === 'auth/user-not-found') msg = 'Usuário não encontrado.';
        if (err.code === 'auth/wrong-password') msg = 'Senha incorreta.';
        if (err.code === 'auth/invalid-credential') msg = 'Credenciais inválidas.';
        return throwError(() => new Error(msg));
      })
    );
  }

  logout() {
    signOut(this.auth).then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    });
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getRole(): Role | null {
    return this.getUser()?.role || null;
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }
}
