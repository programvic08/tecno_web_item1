import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RolUsuario } from '../../models/reclamo.enums';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private currentUserRoleSubject = new BehaviorSubject<RolUsuario | null>(this.getStoredRole());

  public isLoggedIn$: Observable<boolean> = this.loggedInSubject.asObservable();

  // Al iniciar sesión, generamos y guardamos el token en localStorage
  login(rol: RolUsuario): void {
    // 1. Creamos un token JWT simulado en formato Base64
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ 
      sub: "123456789", 
      nombre: "Usuario Pruebas", 
      rol: rol,
      iat: Math.floor(Date.now() / 1000)
    }));
    const signature = "signature_simulada_sprint1";
    
    const mockJwtToken = `${header}.${payload}.${signature}`;

    // 2. Guardamos el Token y el Rol en el almacenamiento del navegador
    localStorage.setItem('auth_token', mockJwtToken);
    localStorage.setItem('user_role', rol);

    // 3. Actualizamos los BehaviorSubjects en memoria
    this.loggedInSubject.next(true);
    this.currentUserRoleSubject.next(rol);
  }

  // Al cerrar sesión, borramos las claves del navegador
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');

    this.loggedInSubject.next(false);
    this.currentUserRoleSubject.next(null);
  }

  estaAutenticado(): boolean {
    return this.hasToken();
  }

  obtenerRolActual(): RolUsuario | null {
    return this.currentUserRoleSubject.value || this.getStoredRole();
  }

  // Métodos auxiliares para leer el almacenamiento
  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  private getStoredRole(): RolUsuario | null {
    const role = localStorage.getItem('user_role');
    return role ? (role as RolUsuario) : null;
  }
}