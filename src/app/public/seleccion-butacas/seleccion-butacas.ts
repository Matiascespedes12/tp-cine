import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Butacas, Butaca, Funcion } from '../butacas';
import { Espera } from '../espera';
import { Auth } from '../../core/auth';

interface ButacaConEstado extends Butaca {
  ocupada: boolean;
  seleccionada: boolean;
}

@Component({
  selector: 'app-seleccion-butacas',
  imports: [CommonModule, RouterLink],
  templateUrl: './seleccion-butacas.html',
  styleUrl: './seleccion-butacas.scss'
})
export class SeleccionButacas implements OnInit, OnDestroy {
  funcion: Funcion | null = null;
  filas: string[] = [];
  butacasPorFila: { [fila: string]: ButacaConEstado[] } = {};
  butacasSeleccionadas: ButacaConEstado[] = [];
  cargando = true;
  aviso: string | null = null;
  yendoAComprar = false;

  // Lista de espera
  logueado = false;
  estadoEspera: 'esperando' | 'ofrecida' | null = null;
  posicionEspera: number | null = null;
  ofertaHasta: string | null = null;
  anotando = false;

  private canal: RealtimeChannel | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private butacasService: Butacas,
    private espera: Espera,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const funcionId = this.route.snapshot.paramMap.get('id');
    if (!funcionId) return;

    this.funcion = await this.butacasService.obtenerFuncion(funcionId);
    if (!this.funcion) return;

    const usuario = await this.auth.obtenerUsuarioActual();
    this.logueado = !!usuario;

    const todasLasButacas = await this.butacasService.obtenerButacasDeSala(this.funcion.sala_id);
    const ocupadas = await this.butacasService.obtenerButacasOcupadas(funcionId);
    const reservadas = await this.espera.butacasReservadas(funcionId);
    const bloqueadas = new Set([...ocupadas, ...reservadas]);

    const butacasConEstado: ButacaConEstado[] = todasLasButacas.map(b => ({
      ...b,
      ocupada: bloqueadas.has(b.id),
      seleccionada: false
    }));

    this.agruparPorFila(butacasConEstado);
    await this.cargarMiEspera(funcionId);
    this.cargando = false;
    this.cdr.detectChanges();

    this.canal = this.butacasService.suscribirseAOcupacion(
      funcionId,
      () => this.recargarOcupacion()
    );
  }

  ngOnDestroy() {
    if (this.canal) {
      this.butacasService.cancelarSuscripcion(this.canal);
    }
  }

  // La función está agotada si no queda ninguna butaca libre (ocupada o reservada para otro)
  get agotada(): boolean {
    return !this.cargando &&
      this.filas.length > 0 &&
      this.filas.every(f => this.butacasPorFila[f].every(b => b.ocupada));
  }

  // Lo consulta el guard canDeactivate antes de dejar salir de la pantalla
  hayCambiosPendientes(): boolean {
    return this.butacasSeleccionadas.length > 0 && !this.yendoAComprar;
  }

  private agruparPorFila(butacas: ButacaConEstado[]) {
    this.butacasPorFila = {};
    for (const butaca of butacas) {
      if (!this.butacasPorFila[butaca.fila]) {
        this.butacasPorFila[butaca.fila] = [];
      }
      this.butacasPorFila[butaca.fila].push(butaca);
    }
    this.filas = Object.keys(this.butacasPorFila).sort();
  }

  private async cargarMiEspera(funcionId: string) {
    if (!this.logueado) return;

    const esperas = await this.espera.misEsperas();
    const mia = esperas.find(e => e.funcion_id === funcionId);
    this.estadoEspera = mia ? mia.estado : null;
    this.posicionEspera = mia ? mia.posicion : null;
    this.ofertaHasta = mia?.oferta_hasta ?? null;
  }

  // Se ejecuta cuando OTRA persona compra, o cuando una cancelación libera una butaca
  private async recargarOcupacion() {
    if (!this.funcion) return;

    const ocupadas = await this.butacasService.obtenerButacasOcupadas(this.funcion.id);
    const reservadas = await this.espera.butacasReservadas(this.funcion.id);
    const bloqueadas = new Set([...ocupadas, ...reservadas]);

    for (const fila of this.filas) {
      for (const b of this.butacasPorFila[fila]) {
        b.ocupada = bloqueadas.has(b.id);
        if (b.ocupada && b.seleccionada) {
          b.seleccionada = false;
          this.butacasSeleccionadas = this.butacasSeleccionadas.filter(x => x.id !== b.id);
          this.aviso = `La butaca ${b.fila}${b.numero} ya no está disponible.`;
        }
      }
    }

    await this.cargarMiEspera(this.funcion.id);
    this.cdr.detectChanges();
  }

  async anotarse() {
    if (!this.funcion) return;

    this.aviso = null;
    this.anotando = true;
    const r = await this.espera.anotarse(this.funcion.id);
    this.anotando = false;

    if (r.exito) {
      this.estadoEspera = 'esperando';
      this.posicionEspera = r.posicion ?? null;
    } else {
      this.aviso = r.error || 'No se pudo anotar en la lista de espera.';
    }
    this.cdr.detectChanges();
  }

  toggleButaca(butaca: ButacaConEstado) {
    if (butaca.ocupada) return;

    this.aviso = null;
    butaca.seleccionada = !butaca.seleccionada;

    if (butaca.seleccionada) {
      this.butacasSeleccionadas = [...this.butacasSeleccionadas, butaca];
    } else {
      this.butacasSeleccionadas = this.butacasSeleccionadas.filter(b => b.id !== butaca.id);
    }
    this.cdr.detectChanges();
  }

  get totalSeleccionadas(): number {
    return this.butacasSeleccionadas.length;
  }

  irACheckout() {
    this.yendoAComprar = true;
    this.router.navigate(['/checkout'], {
      state: {
        funcionId: this.funcion?.id,
        butacas: this.butacasSeleccionadas
      }
    });
  }
}




