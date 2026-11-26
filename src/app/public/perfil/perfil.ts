import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';
import { Espera, EsperaActiva } from '../espera';
import { MiEntrada, MisEntradas } from '../mis-entradas';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class Perfil implements OnInit {
  cargando = true;
  sinSesion = false;
  usuarioId: string | null = null;
  credito = 0;
  entradas: MiEntrada[] = [];
  esperas: EsperaActiva[] = [];
  error: string | null = null;
  mensaje: string | null = null;

  constructor(
    private auth: Auth,
    private servicio: MisEntradas,
    private espera: Espera,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const usuario = await this.auth.obtenerUsuarioActual();

    if (!usuario) {
      this.sinSesion = true;
    } else {
      this.usuarioId = usuario.id;
      await this.recargar();
    }

    this.cargando = false;
    this.cdr.detectChanges();
  }

  private async recargar() {
    if (!this.usuarioId) return;

    const perfil = await this.auth.obtenerPerfil();
    this.credito = Number(perfil?.credito) || 0;
    this.entradas = await this.servicio.obtener(this.usuarioId);
    this.esperas = await this.espera.misEsperas();
  }

  // Solo se puede cancelar una entrada activa, hasta 2 horas antes de la función
  puedeCancelar(e: MiEntrada): boolean {
    const inicio = new Date(e.funciones.fecha_hora_inicio).getTime();
    return e.estado === 'activa' && !e.funciones.cancelada && inicio - 2 * 60 * 60 * 1000 > Date.now();
  }

  estadoTexto(e: MiEntrada): string {
    if (e.estado === 'validada') return 'Usada';
    if (e.estado === 'cancelada') return 'Cancelada';
    return 'Activa';
  }

  async cancelar(e: MiEntrada) {
    const pregunta =
      `¿Cancelar la entrada de "${e.funciones.peliculas.nombre}" (butaca ${e.butacas.fila}${e.butacas.numero})? ` +
      'No se devuelve dinero: el importe pasa a tu crédito.';
    if (!confirm(pregunta)) return;

    this.error = null;
    this.mensaje = null;

    const r = await this.servicio.cancelar(e.id);

    if (r.exito) {
      this.mensaje = `Entrada cancelada. Se acreditaron $${r.credito} a tu crédito.` +
        (r.ofrecida ? ' La butaca se le ofreció a la primera persona de la lista de espera.' : '');
      await this.recargar();
    } else {
      this.error = r.error || 'No se pudo cancelar la entrada.';
    }
    this.cdr.detectChanges();
  }
}


