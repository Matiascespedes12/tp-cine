import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from '../../core/supabase';

interface EsperaFuncion {
  funcion_id: string;
  pelicula: string;
  fecha_hora_inicio: string;
  en_espera: number;
}

@Component({
  selector: 'app-espera-admin',
  imports: [CommonModule],
  templateUrl: './espera-admin.html',
  styleUrl: './espera-admin.scss'
})
export class EsperaAdmin implements OnInit {
  filas: EsperaFuncion[] = [];

  constructor(
    private supabase: Supabase,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data, error } = await this.supabase.client.rpc('espera_por_funcion');

    if (error) {
      console.error('Error al obtener la lista de espera:', error);
    } else {
      this.filas = (data as any[]).map(f => ({ ...f, en_espera: Number(f.en_espera) }));
    }
    this.cdr.detectChanges();
  }
}

