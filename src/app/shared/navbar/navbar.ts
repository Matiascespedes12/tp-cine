import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Auth } from '../../core/auth';
import { Notificaciones } from '../../core/notificaciones';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, DatePipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  // Si el desplegable de notificaciones está abierto
  panelAbierto = signal(false);

  constructor(
    public auth: Auth,
    public notificaciones: Notificaciones,
    private router: Router
  ) {}

  alternarPanel() {
    const abriendo = !this.panelAbierto();
    this.panelAbierto.set(abriendo);

    // Al abrir el panel se marcan todas como leídas
    if (abriendo) {
      this.notificaciones.marcarTodasLeidas();
    }
  }

  async cerrarSesion() {
    this.panelAbierto.set(false);
    await this.auth.cerrarSesion();
    this.router.navigate(['/']);
  }
}