import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  constructor(
    public auth: Auth,
    private router: Router
  ) {}

  async cerrarSesion() {
    await this.auth.cerrarSesion();
    this.router.navigate(['/']);
  }
}