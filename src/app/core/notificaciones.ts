import { Injectable, computed, effect, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Supabase } from './supabase';
import { Auth } from './auth';

export interface Notificacion {
  id: string;
  usuario_id: string;
  mensaje: string;
  funcion_id: string | null;
  leida: boolean;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class Notificaciones {
  // Lista de notificaciones del usuario logueado (más nuevas primero)
  lista = signal<Notificacion[]>([]);

  // Cantidad de no leídas: se recalcula sola cuando cambia la lista
  noLeidas = computed(() => this.lista().filter(n => !n.leida).length);

  // Solo el id del usuario: así el effect no se dispara cuando el perfil se
  // recarga con el mismo usuario, únicamente cuando alguien entra o sale
  private usuarioId = computed<string | null>(() => this.auth.perfil()?.id ?? null);

  private canal: RealtimeChannel | null = null;

  constructor(
    private supabase: Supabase,
    private auth: Auth
  ) {
    effect(() => {
      this.iniciar(this.usuarioId());
    });
  }

  private async iniciar(usuarioId: string | null) {
    this.cerrarCanal();
    this.lista.set([]);

    if (!usuarioId) return;

    await this.cargar(usuarioId);

    // Si mientras cargaba cambió la sesión, no abrimos el canal
    if (this.usuarioId() !== usuarioId) return;

    this.canal = this.supabase.client
      .channel('notificaciones-' + usuarioId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${usuarioId}` },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            this.lista.update(l => [payload.new as Notificacion, ...l]);
          } else if (payload.eventType === 'UPDATE') {
            this.lista.update(l => l.map(n => (n.id === payload.new.id ? (payload.new as Notificacion) : n)));
          }
        }
      )
      .subscribe();
  }

  private async cargar(usuarioId: string) {
    const { data, error } = await this.supabase.client
      .from('notificaciones')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('fecha', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error al cargar notificaciones:', error);
      return;
    }

    this.lista.set(data as Notificacion[]);
  }

  async marcarTodasLeidas() {
    const id = this.usuarioId();
    if (!id || this.noLeidas() === 0) return;

    // Primero se actualiza la pantalla y después la base
    this.lista.update(l => l.map(n => ({ ...n, leida: true })));

    const { error } = await this.supabase.client
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', id)
      .eq('leida', false);

    if (error) {
      console.error('Error al marcar como leídas:', error);
    }
  }

  private cerrarCanal() {
    if (this.canal) {
      this.supabase.client.removeChannel(this.canal);
      this.canal = null;
    }
  }
}


