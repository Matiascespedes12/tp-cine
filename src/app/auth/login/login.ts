import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  password = '';
  error: string | null = null;
  cargando = false;

  constructor(
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async iniciarSesion() {
    this.error = null;

    if (!this.email || !this.password) {
      this.error = 'Completá el email y la contraseña.';
      return;
    }

    this.cargando = true;
    const resultado = await this.auth.iniciarSesion(this.email, this.password);
    this.cargando = false;

    if (resultado.exito) {
      this.router.navigate(['/']);
    } else {
      this.error = resultado.error || 'No se pudo iniciar sesión.';
      this.cdr.detectChanges();
    }
  }
}