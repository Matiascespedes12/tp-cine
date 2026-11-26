import { Injectable, effect, signal } from '@angular/core';
import { Auth } from './auth';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class Permisos {
  // Permisos del usuario logueado, por ejemplo ['funciones', 'peliculas']
  lista = signal<string[]>([]);

  constructor(
    private auth: Auth,
    private supabase: Supabase
  ) {
    // Cada vez que cambia la sesión, se vuelven a pedir los permisos a la base
    effect(() => {
      if (this.auth.perfil()) {
        this.cargar();
      } else {
        this.lista.set([]);
      }
    });
  }

  private async cargar() {
    const { data, error } = await this.supabase.client.rpc('mis_permisos');
    this.lista.set(!error && Array.isArray(data) ? data : []);
  }

  tiene(permiso: string): boolean {
    return this.lista().includes(permiso);
  }
}


