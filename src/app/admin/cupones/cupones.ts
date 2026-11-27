import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CuponAdmin, CuponesAdmin } from '../cupones-admin';

@Component({
  selector: 'app-cupones',
  imports: [CommonModule, FormsModule],
  templateUrl: './cupones.html',
  styleUrl: './cupones.scss'
})
export class Cupones implements OnInit {
  cupones: CuponAdmin[] = [];
  cargando = true;
  error: string | null = null;
  mensaje: string | null = null;

  constructor(
    private servicio: CuponesAdmin,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.cupones = await this.servicio.obtener();
    this.cargando = false;
    this.cdr.detectChanges();
  }

  tipoTexto(tipo: string): string {
    return tipo === 'primera_compra' ? 'Primera compra' : 'Segmentado';
  }

  async guardar(c: CuponAdmin) {
    this.error = null;
    this.mensaje = null;

    const porcentaje = Number(c.porcentaje);
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      this.error = 'El porcentaje tiene que ser un número entre 0 y 100.';
      return;
    }

    const r = await this.servicio.actualizar(c.id, porcentaje, c.activo);
    if (r.exito) {
      this.mensaje = `Cupón ${c.codigo} actualizado: ${porcentaje}%${c.activo ? '' : ' (desactivado)'}.`;
    } else {
      this.error = r.error || 'No se pudo guardar el cupón.';
    }
    this.cdr.detectChanges();
  }
}



