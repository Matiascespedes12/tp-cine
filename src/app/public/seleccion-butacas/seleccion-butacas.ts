import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
export class SeleccionButacas implements OnInit {
  funcion: Funcion | null = null;
  filas: string[] = [];
  butacasPorFila: { [fila: string]: ButacaConEstado[] } = {};
  butacasSeleccionadas: ButacaConEstado[] = [];
  cargando = true;

  constructor(
    private route: ActivatedRoute,
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

  toggleButaca(butaca: ButacaConEstado) {
    if (butaca.ocupada) return;

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
}