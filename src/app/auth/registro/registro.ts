import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class Registro {
  email = '';
  password = '';
  nombre = '';
  apellido = '';
  fechaNac = '';
  tipoSangre = '';
  colorOjos = '';
  diasVacaciones: number | null = null;

  tiposSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  coloresOjos = ['Marrones', 'Negros', 'Azules', 'Verdes', 'Celestes', 'Grises', 'Miel'];

  error: string | null = null;
  cargando = false;
  hoy = new Date().toISOString().split('T')[0];

  constructor(
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async registrar() {
    this.error = null;

    if (!this.email || !this.password || !this.nombre || !this.apellido ||
        !this.fechaNac || !this.tipoSangre || !this.colorOjos || this.diasVacaciones === null) {
      this.error = 'Completá todos los campos.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (this.fechaNac > this.hoy) {
      this.error = 'La fecha de nacimiento no puede ser futura.';
      return;
    }

    this.cargando = true;
    const resultado = await this.auth.registrar({
      email: this.email,
      password: this.password,
      nombre: this.nombre,
      apellido: this.apellido,
      fechaNac: this.fechaNac,
      tipoSangre: this.tipoSangre,
      colorOjos: this.colorOjos,
      diasVacaciones: this.diasVacaciones
    });
    this.cargando = false;

    if (resultado.exito) {
      this.router.navigate(['/']);
    } else {
      this.error = resultado.error || 'No se pudo crear la cuenta.';
      this.cdr.detectChanges();
    }
  }
}