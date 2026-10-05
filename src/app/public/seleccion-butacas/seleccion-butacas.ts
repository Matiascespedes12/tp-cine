import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Butacas, Butaca, Funcion } from '../butacas';

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
  private canal: RealtimeChannel | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private butacasService: Butacas,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const funcionId = this.route.snapshot.paramMap.get('id');
    if (!funcionId) return;

    this.funcion = await this.butacasService.obtenerFuncion(funcionId);
    if (!this.funcion) return;

    const todasLasButacas = await this.butacasService.obtenerButacasDeSala(this.funcion.sala_id);
    const idsOcupadas = await this.butacasService.obtenerButacasOcupadas(funcionId);

    const butacasConEstado: ButacaConEstado[] = todasLasButacas.map(b => ({
      ...b,
      ocupada: idsOcupadas.includes(b.id),
      seleccionada: false
    }));

    this.agruparPorFila(butacasConEstado);
    this.cargando = false;
    this.cdr.detectChanges();

    this.canal = this.butacasService.suscribirseAOcupacion(
      funcionId,
      (butacaId) => this.marcarOcupada(butacaId)
    );
  }

  ngOnDestroy() {
    if (this.canal) {
      this.butacasService.cancelarSuscripcion(this.canal);
    }
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

  // Se ejecuta cuando OTRA persona compra una butaca de esta función
  private marcarOcupada(butacaId: string) {
    for (const fila of this.filas) {
      const butaca = this.butacasPorFila[fila].find(b => b.id === butacaId);
      if (butaca) {
        butaca.ocupada = true;
        if (butaca.seleccionada) {
          butaca.seleccionada = false;
          this.butacasSeleccionadas = this.butacasSeleccionadas.filter(b => b.id !== butaca.id);
          this.aviso = `La butaca ${butaca.fila}${butaca.numero} acaba de ser comprada por otra persona.`;
        }
        break;
      }
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
    this.router.navigate(['/checkout'], {
      state: {
        funcionId: this.funcion?.id,
        butacas: this.butacasSeleccionadas
      }
    });
  }
}