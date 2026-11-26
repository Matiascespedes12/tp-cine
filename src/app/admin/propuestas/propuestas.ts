import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PropuestaPendiente, PropuestasAdmin } from '../propuestas-admin';

@Component({
  selector: 'app-propuestas',
  imports: [CommonModule],
  templateUrl: './propuestas.html',
  styleUrl: './propuestas.scss'
})
export class Propuestas implements OnInit {
  pendientes: PropuestaPendiente[] = [];
  cargando = true;
  error: string | null = null;
  mensaje: string | null = null;

  constructor(
    private servicio: PropuestasAdmin,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.pendientes = await this.servicio.obtenerPendientes();
    this.cargando = false;
    this.cdr.detectChanges();
  }

  // Aceptar: abre el formulario de películas con los datos de la propuesta
  aceptar(p: PropuestaPendiente) {
    this.router.navigate(['/admin/peliculas'], {
      state: { propuestaId: p.id, titulo: p.titulo, descripcion: p.descripcion }
    });
  }

  async rechazar(p: PropuestaPendiente) {
    if (!confirm(`¿Rechazar la propuesta "${p.titulo}"? Se le avisa al cliente.`)) return;

    this.error = null;
    this.mensaje = null;

    const r = await this.servicio.resolver(p.id, 'rechazada');
    if (r.exito) {
      this.mensaje = `Propuesta "${p.titulo}" rechazada.`;
      this.pendientes = await this.servicio.obtenerPendientes();
    } else {
      this.error = r.error || 'No se pudo rechazar la propuesta.';
    }
    this.cdr.detectChanges();
  }
}

