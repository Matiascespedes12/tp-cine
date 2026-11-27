import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilaFacturacion, ReportesAdmin } from '../reportes-admin';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss'
})
export class Reportes implements OnInit {
  filas: FilaFacturacion[] = [];
  dias = 30;
  cargando = true;
  error: string | null = null;

  constructor(
    private servicio: ReportesAdmin,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando = true;
    this.error = null;

    const r = await this.servicio.facturacion(Number(this.dias));
    this.filas = r.filas;
    this.error = r.error ?? null;

    this.cargando = false;
    this.cdr.detectChanges();
  }

  get totalEntradas(): number {
    return this.filas.reduce((acc, f) => acc + f.entradas, 0);
  }

  get totalFacturado(): number {
    return this.filas.reduce((acc, f) => acc + f.facturado, 0);
  }
}



