import { Injectable, signal } from '@angular/core';
import { Supabase } from './supabase';

export interface DatosRegistro {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  fechaNac: string;
  tipoSangre: string;
  colorOjos: string;
  diasVacaciones: number;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  // Perfil del usuario logueado (null si no hay sesión)
  perfil = signal<any | null>(null);

  constructor(private supabase: Supabase) {
    this.cargarPerfil();

    this.supabase.client.auth.onAuthStateChange((_evento, sesion) => {
      if (sesion) {
        setTimeout(() => this.cargarPerfil(), 0);
      } else {
        this.perfil.set(null);
      }
    });
  }

  async registrar(datos: DatosRegistro): Promise<{ exito: boolean; error?: string }> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email: datos.email,
      password: datos.password
    });

    if (error || !data.user) {
      return { exito: false, error: error?.message || 'No se pudo crear la cuenta.' };
    }

    const { error: errorPerfil } = await this.supabase.client
      .from('usuarios')
      .insert({
        id: data.user.id,
        email: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        fecha_nac: datos.fechaNac,
        tipo_sangre: datos.tipoSangre,
        color_ojos: datos.colorOjos,
        dias_vacaciones: datos.diasVacaciones,
        rol: 'cliente'
      });

    if (errorPerfil) {
      return { exito: false, error: errorPerfil.message };
    }

    await this.cargarPerfil();
    return { exito: true };
  }

  async iniciarSesion(email: string, password: string): Promise<{ exito: boolean; error?: string }> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });

    if (error) {
      return { exito: false, error: 'Email o contraseña incorrectos.' };
    }

    await this.cargarPerfil();
    return { exito: true };
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.perfil.set(null);
  }

  async obtenerUsuarioActual() {
    const { data } = await this.supabase.client.auth.getUser();
    return data.user;
  }

  async obtenerPerfil() {
    const usuario = await this.obtenerUsuarioActual();
    if (!usuario) return null;

    const { data, error } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('id', usuario.id)
      .single();

    if (error) return null;
    return data;
  }

  private async cargarPerfil() {
    this.perfil.set(await this.obtenerPerfil());
  }
}