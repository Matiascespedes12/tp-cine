import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './core/supabase';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'tp-cine';

  constructor(private supabase: Supabase) {}

  async ngOnInit() {
    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select('*');

    if (error) {
      console.error('Error al conectar con Supabase:', error);
    } else {
      console.log('Conexión exitosa. Películas encontradas:', data);
    }
  }
}