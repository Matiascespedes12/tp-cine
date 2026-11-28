import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface Categoria {
  id: string;
  nombre: string;
}

export interface ProductoAdmin {
  id: string;
  categoria_id: string;
  nombre: string;
  precio: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CandyAdmin {
  constructor(private supabase: Supabase) {}

  async obtenerCategorias(): Promise<Categoria[]> {
    const { data, error } = await this.supabase.client
      .from('categorias_productos')
      .select('id, nombre')
      .order('nombre');

    if (error) {
      console.error('Error al obtener las categorías:', error);
      return [];
    }
    return data as Categoria[];
  }

  async obtenerProductos(): Promise<ProductoAdmin[]> {
    const { data, error } = await this.supabase.client
      .from('productos')
      .select('id, categoria_id, nombre, precio, activo')
      .order('nombre');

    if (error) {
      console.error('Error al obtener los productos:', error);
      return [];
    }
    return (data as any[]).map(p => ({ ...p, precio: Number(p.precio) }));
  }

  async crearCategoria(nombre: string): Promise<{ exito: boolean; error?: string }> {
    const { error } = await this.supabase.client
      .from('categorias_productos')
      .insert({ nombre: nombre.trim() });

    return this.resultado(error, 'Ya existe una categoría con ese nombre.');
  }

  async crearProducto(nombre: string, precio: number, categoriaId: string): Promise<{ exito: boolean; error?: string }> {
    const { error } = await this.supabase.client
      .from('productos')
      .insert({ nombre: nombre.trim(), precio, categoria_id: categoriaId });

    return this.resultado(error, 'No se pudo crear el producto.');
  }

  async actualizarProducto(id: string, precio: number, activo: boolean): Promise<{ exito: boolean; error?: string }> {
    const { data, error } = await this.supabase.client
      .from('productos')
      .update({ precio, activo })
      .eq('id', id)
      .select('id');

    if (error) {
      return this.resultado(error, 'No se pudo guardar el producto.');
    }
    // Si la política de seguridad no deja actualizar, no hay error pero tampoco filas
    if (!data || data.length === 0) {
      return { exito: false, error: 'No tenés permiso para modificar el candy bar.' };
    }
    return { exito: true };
  }

  private resultado(error: any, mensajeDuplicado: string): { exito: boolean; error?: string } {
    if (!error) return { exito: true };
    if (error.code === '23505') return { exito: false, error: mensajeDuplicado };
    if (error.code === '42501') return { exito: false, error: 'No tenés permiso para gestionar el candy bar.' };
    return { exito: false, error: error.message };
  }
}




