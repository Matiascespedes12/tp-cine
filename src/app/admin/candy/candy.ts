import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandyAdmin, Categoria, ProductoAdmin } from '../candy-admin';

@Component({
  selector: 'app-candy',
  imports: [CommonModule, FormsModule],
  templateUrl: './candy.html',
  styleUrl: './candy.scss'
})
export class Candy implements OnInit {
  categorias: Categoria[] = [];
  productos: ProductoAdmin[] = [];

  nuevaCategoria = '';
  nuevoNombre = '';
  nuevoPrecio: number | null = null;
  nuevaCategoriaId = '';

  cargando = true;
  error: string | null = null;
  mensaje: string | null = null;

  constructor(
    private servicio: CandyAdmin,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.recargar();
    this.cargando = false;
    this.cdr.detectChanges();
  }

  private async recargar() {
    this.categorias = await this.servicio.obtenerCategorias();
    this.productos = await this.servicio.obtenerProductos();
  }

  productosDe(categoriaId: string): ProductoAdmin[] {
    return this.productos.filter(p => p.categoria_id === categoriaId);
  }

  async crearCategoria() {
    this.error = null;
    this.mensaje = null;

    if (!this.nuevaCategoria.trim()) {
      this.error = 'Escribí el nombre de la categoría.';
      return;
    }

    const r = await this.servicio.crearCategoria(this.nuevaCategoria);
    if (r.exito) {
      this.mensaje = `Categoría "${this.nuevaCategoria.trim()}" creada.`;
      this.nuevaCategoria = '';
      await this.recargar();
    } else {
      this.error = r.error || 'No se pudo crear la categoría.';
    }
    this.cdr.detectChanges();
  }

  async crearProducto() {
    this.error = null;
    this.mensaje = null;

    if (!this.nuevoNombre.trim() || !this.nuevaCategoriaId) {
      this.error = 'Completá el nombre y elegí una categoría.';
      return;
    }
    const precio = Number(this.nuevoPrecio);
    if (this.nuevoPrecio === null || !Number.isFinite(precio) || precio < 0) {
      this.error = 'El precio tiene que ser un número igual o mayor a 0.';
      return;
    }

    const r = await this.servicio.crearProducto(this.nuevoNombre, precio, this.nuevaCategoriaId);
    if (r.exito) {
      this.mensaje = `Producto "${this.nuevoNombre.trim()}" creado.`;
      this.nuevoNombre = '';
      this.nuevoPrecio = null;
      await this.recargar();
    } else {
      this.error = r.error || 'No se pudo crear el producto.';
    }
    this.cdr.detectChanges();
  }

  async guardar(p: ProductoAdmin) {
    this.error = null;
    this.mensaje = null;

    const precio = Number(p.precio);
    if (!Number.isFinite(precio) || precio < 0) {
      this.error = 'El precio tiene que ser un número igual o mayor a 0.';
      return;
    }

    const r = await this.servicio.actualizarProducto(p.id, precio, p.activo);
    if (r.exito) {
      this.mensaje = `"${p.nombre}" actualizado.${p.activo ? '' : ' Ya no se muestra a los clientes.'}`;
    } else {
      this.error = r.error || 'No se pudo guardar el producto.';
    }
    this.cdr.detectChanges();
  }
}