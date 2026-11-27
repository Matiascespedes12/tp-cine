import { Injectable } from '@angular/core';
import { Supabase } from '../core/supabase';

// Los permisos son un conjunto fijo: coinciden con las secciones del admin que existen
export const PERMISOS = [
  { clave: 'peliculas', etiqueta: 'Películas' },
  { clave: 'funciones', etiqueta: 'Funciones' },
  { clave: 'propuestas', etiqueta: 'Propuestas de películas' },
  { clave: 'validacion', etiqueta: 'Validación de entradas' },
  { clave: 'reportes', etiqueta: 'Reportes' }
];

export interface Rol {
  id: string;
  nombre: string;
  permisos: string[];
}

export interface Asignacion {
  rol_id: string;
  usuario_id: string;
  email: string;
  nombre: string;
  apellido: string;
}

@Injectable({
  providedIn: 'root'
})
export class RolesAdmin {
  constructor(private supabase: Supabase) {}

  async obtenerRoles(): Promise<Rol[]> {
    const { data, error } = await this.supabase.client
      .from('roles')
      .select('id, nombre, roles_permisos(permiso)')
      .order('nombre');

    if (error) {
      console.error('Error al obtener los roles:', error);
      return [];
    }

    return (data as any[]).map(r => ({
      id: r.id,
      nombre: r.nombre,
      permisos: r.roles_permisos.map((p: any) => p.permiso)
    }));
  }

  async obtenerAsignaciones(): Promise<Asignacion[]> {
    const { data, error } = await this.supabase.client.rpc('listar_asignaciones');

    if (error) {
      console.error('Error al obtener las asignaciones:', error);
      return [];
    }
    return data as Asignacion[];
  }

  async crearRol(nombre: string, permisos: string[]): Promise<{ exito: boolean; error?: string }> {
    const { data, error } = await this.supabase.client
      .from('roles')
      .insert({ nombre: nombre.trim() })
      .select('id')
      .single();

    if (error || !data) {
      // 23505 = índice único: ya existe un rol con ese nombre
      if (error?.code === '23505') {
        return { exito: false, error: 'Ya existe un rol con ese nombre.' };
      }
      return { exito: false, error: error?.message || 'No se pudo crear el rol.' };
    }

    const { error: errorPermisos } = await this.supabase.client
      .from('roles_permisos')
      .insert(permisos.map(permiso => ({ rol_id: data.id, permiso })));

    if (errorPermisos) {
      // Si fallan los permisos, deshacemos el rol para no dejarlo a medias
      await this.supabase.client.from('roles').delete().eq('id', data.id);
      return { exito: false, error: errorPermisos.message };
    }

    return { exito: true };
  }

  async eliminarRol(id: string): Promise<{ exito: boolean; error?: string }> {
    const { error } = await this.supabase.client.from('roles').delete().eq('id', id);
    return error ? { exito: false, error: error.message } : { exito: true };
  }

  async asignar(email: string, rolId: string): Promise<{ exito: boolean; resultado?: string; error?: string }> {
    const { data, error } = await this.supabase.client
      .rpc('asignar_rol', { p_email: email, p_rol_id: rolId });

    if (error) {
      return { exito: false, error: error.message };
    }
    return { exito: true, resultado: data as string };
  }

  async quitar(usuarioId: string, rolId: string): Promise<{ exito: boolean; error?: string }> {
    const { error } = await this.supabase.client
      .from('usuario_roles')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('rol_id', rolId);

    return error ? { exito: false, error: error.message } : { exito: true };
  }
}