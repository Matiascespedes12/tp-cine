import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import QRCode from 'qrcode';
import { Compras, DetalleCompra, LineaCandy, ProductoCandy } from '../compras';
import { Butacas } from '../butacas';
import { Auth } from '../../core/auth';

interface ButacaCheckout {
  id: string;
  fila: string;
  numero: number;
  tipo: string;
}

interface EntradaConQr {
  etiqueta: string;
  codigo: string;
  imagenQr: string;
}

interface GrupoCandy {
  categoria: string;
  productos: ProductoCandy[];
}

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout implements OnInit {
  funcionId: string | null = null;
  butacas: ButacaCheckout[] = [];
  precioBase = 0;
  porcentajeDescuento = 0;
  comprando = false;
  compraExitosa = false;
  error: string | null = null;
  entradasConQr: EntradaConQr[] = [];

  // Crédito del usuario y si decidió usarlo
  credito = 0;
  usarCredito = false;

  // Candy bar: productos disponibles y cantidades elegidas
  gruposCandy: GrupoCandy[] = [];
  cantidades: { [productoId: string]: number } = {};

  // Lo que realmente se descontó y lo que queda por pagar (para la pantalla final)
  creditoUsadoFinal = 0;
  aPagarFinal = 0;
  candyFinal: LineaCandy[] = [];
  totalCandyFinal = 0;

  constructor(
    private router: Router,
    private comprasService: Compras,
    private butacasService: Butacas,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state || (history.state as any);

    if (!state || !state.funcionId || !state.butacas || state.butacas.length === 0) {
      this.router.navigate(['/']);
      return;
    }

    this.funcionId = state.funcionId;
    this.butacas = state.butacas;

    const funcion = await this.butacasService.obtenerFuncion(this.funcionId!);
    this.precioBase = (funcion as any)?.precio_base || 2000;
    this.porcentajeDescuento = await this.comprasService.obtenerDescuentoPrimeraCompra();

    // Solo si hay sesión se consulta el crédito
    const usuario = await this.auth.obtenerUsuarioActual();
    if (usuario) {
      this.credito = await this.comprasService.obtenerCredito(usuario.id);
    }

    await this.cargarCandy();
    this.cdr.detectChanges();
  }

  private async cargarCandy() {
    const productos = await this.comprasService.obtenerCandy();
    const grupos: { [categoria: string]: ProductoCandy[] } = {};

    for (const p of productos) {
      if (!grupos[p.categoria]) grupos[p.categoria] = [];
      grupos[p.categoria].push(p);
    }

    this.gruposCandy = Object.keys(grupos).sort().map(categoria => ({
      categoria,
      productos: grupos[categoria]
    }));
  }

  precioButaca(butaca: ButacaCheckout): number {
    if (butaca.tipo === 'vip') return this.precioBase * 1.5;
    return this.precioBase;
  }

  cantidadDe(p: ProductoCandy): number {
    return this.cantidades[p.id] ?? 0;
  }

  sumar(p: ProductoCandy) {
    const actual = this.cantidadDe(p);
    if (actual < 20) this.cantidades[p.id] = actual + 1;
  }

  restar(p: ProductoCandy) {
    const actual = this.cantidadDe(p);
    if (actual > 0) this.cantidades[p.id] = actual - 1;
  }

  // Productos con cantidad mayor a cero (lo que se manda a la base: id y cantidad, nunca precios)
  get productosElegidos(): { producto_id: string; cantidad: number }[] {
    return Object.keys(this.cantidades)
      .filter(id => this.cantidades[id] > 0)
      .map(id => ({ producto_id: id, cantidad: this.cantidades[id] }));
  }

  get hayCandy(): boolean {
    return this.productosElegidos.length > 0;
  }

  get totalCandy(): number {
    let total = 0;
    for (const g of this.gruposCandy) {
      for (const p of g.productos) {
        total += p.precio * this.cantidadDe(p);
      }
    }
    return total;
  }

  get subtotal(): number {
    return this.butacas.reduce((acc, b) => acc + this.precioButaca(b), 0);
  }

  get descuento(): number {
    return Math.round(this.subtotal * this.porcentajeDescuento / 100);
  }

  // Entradas con descuento
  get totalEntradas(): number {
    return this.subtotal - this.descuento;
  }

  // Entradas con descuento más candy
  get total(): number {
    return this.totalEntradas + this.totalCandy;
  }

  // Cuánto crédito se aplicaría: nunca más que el total ni más que el saldo
  get creditoAplicado(): number {
    return this.usarCredito ? Math.min(this.credito, this.total) : 0;
  }

  get aPagar(): number {
    return this.total - this.creditoAplicado;
  }

  get hayVip(): boolean {
    return this.butacas.some(b => b.tipo === 'vip');
  }

  alternarCredito() {
    this.usarCredito = !this.usarCredito;
  }

  async confirmarCompra() {
    if (!this.funcionId) return;

    this.comprando = true;
    this.error = null;
    this.cdr.detectChanges();

    let entradas: { qr_code: string; butaca_id: string }[] | undefined;
    let errorCompra: string | undefined;
    let qrCandy: string | null = null;

    this.candyFinal = [];
    this.totalCandyFinal = 0;

    if (this.hayCandy) {
      // Con candy: la base calcula todos los precios y hace todo en una transacción
      const r = await this.comprasService.comprarConProductos(
        this.funcionId,
        this.butacas.map(b => b.id),
        this.productosElegidos,
        this.usarCredito && this.credito > 0
      );
      if (r.exito) {
        entradas = r.entradas;
        this.candyFinal = r.candy ?? [];
        this.totalCandyFinal = r.totalCandy ?? 0;
        qrCandy = r.qrCandy ?? null;
        this.creditoUsadoFinal = r.creditoUsado ?? 0;
        this.aPagarFinal = r.aPagar ?? 0;
        this.credito -= this.creditoUsadoFinal;
      } else {
        errorCompra = r.error;
      }
    } else if (this.usarCredito && this.credito > 0) {
      // Camino con crédito: la base calcula precios y descuenta todo en una transacción
      const r = await this.comprasService.confirmarCompraConCredito(
        this.funcionId,
        this.butacas.map(b => b.id)
      );
      if (r.exito) {
        entradas = r.entradas;
        this.creditoUsadoFinal = r.creditoUsado ?? 0;
        this.aPagarFinal = r.aPagar ?? 0;
        this.credito -= this.creditoUsadoFinal;
      } else {
        errorCompra = r.error;
      }
    } else {
      // Camino de siempre (con o sin sesión, sin crédito ni candy)
      const factor = 1 - this.porcentajeDescuento / 100;
      const detalles: DetalleCompra[] = this.butacas.map(b => ({
        butacaId: b.id,
        precio: Math.round(this.precioButaca(b) * factor)
      }));

      const usuario = await this.auth.obtenerUsuarioActual();
      const usuarioId = usuario ? usuario.id : null;

      const r = await this.comprasService.confirmarCompra(this.funcionId, detalles, usuarioId);
      if (r.exito) {
        entradas = r.entradas;
        this.creditoUsadoFinal = 0;
        this.aPagarFinal = this.total;
      } else {
        errorCompra = r.error;
      }
    }

    if (entradas) {
      this.entradasConQr = [];
      for (const entrada of entradas) {
        const butaca = this.butacas.find(b => b.id === entrada.butaca_id);
        const lleva = qrCandy !== null && entrada.qr_code === qrCandy;
        this.entradasConQr.push({
          etiqueta: (butaca ? `Butaca ${butaca.fila}${butaca.numero}` : 'Entrada') + (lleva ? ' · con candy' : ''),
          codigo: entrada.qr_code,
          imagenQr: await QRCode.toDataURL(entrada.qr_code, { width: 220, margin: 1 })
        });
      }
      this.compraExitosa = true;
    } else {
      this.error = errorCompra || 'Ocurrió un error al procesar la compra.';
    }

    this.comprando = false;
    this.cdr.detectChanges();
  }
}




