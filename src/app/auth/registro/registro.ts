import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

// Validador propio: la fecha de nacimiento no puede ser futura
export function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const hoy = new Date().toLocaleDateString('en-CA');
  return control.value > hoy ? { fechaFutura: true } : null;
}

@Component({
  selector: 'app-registro',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.scss'
})
export class Registro {
  tiposSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  coloresOjos = ['Marrones', 'Negros', 'Azules', 'Verdes', 'Celestes', 'Grises', 'Miel'];
  hoy = new Date().toLocaleDateString('en-CA');

  error: string | null = null;
  cargando = false;

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    nombre: new FormControl('', [Validators.required]),
    apellido: new FormControl('', [Validators.required]),
    fechaNac: new FormControl('', [Validators.required, fechaNoFutura]),
    tipoSangre: new FormControl('', [Validators.required]),
    colorOjos: new FormControl('', [Validators.required]),
    diasVacaciones: new FormControl<number | null>(null, [Validators.required, Validators.min(0), Validators.max(365)])
  });

  constructor(
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ¿Hay que mostrar error en este campo? Solo si el usuario ya lo tocó
  invalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  tieneError(campo: string, error: string): boolean {
    return !!this.form.get(campo)?.hasError(error);
  }

  async registrar() {
    this.error = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    this.cargando = true;
    const resultado = await this.auth.registrar({
      email: v.email!,
      password: v.password!,
      nombre: v.nombre!,
      apellido: v.apellido!,
      fechaNac: v.fechaNac!,
      tipoSangre: v.tipoSangre!,
      colorOjos: v.colorOjos!,
      diasVacaciones: v.diasVacaciones!
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