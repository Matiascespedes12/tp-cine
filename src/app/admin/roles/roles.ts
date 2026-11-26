import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asignacion, PERMISOS, Rol, RolesAdmin } from '../roles-admin';

@Component({
  selector: 'app-roles',
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss'
})
export class Roles implements OnInit {
  permisosDisponibles = PERMISOS;
  roles: Rol[] = [];
  asignaciones: Asignacion[] = [];

  nombre = '';
  permisosSeleccionados: string[] = [];
  emailPorRol: { [rolId: string]: string } = {};

  cargando = true;
  guardando = false;
  error: string | null = null;
  mensaje: string | null = null;

  constructor(
    private servicio: RolesAdmin,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.recargar();
    this.cargando = false;
    this.cdr.detectChanges();
  }

  private async recargar() {
    this.roles = await this.servicio.obtenerRoles();
    this.asignaciones = await this.servicio.obtenerAsignaciones();
  }

  etiqueta(clave: string): string {
    return this.permisosDisponibles.find(p => p.clave === clave)?.etiqueta ?? clave;
  }

  asignacionesDe(rolId: string): Asignacion[] {
    return this.asignaciones.filter(a => a.rol_id === rolId);
  }

  togglePermiso(clave: string) {
    if (this.permisosSeleccionados.includes(clave)) {
      this.permisosSeleccionados = this.permisosSeleccionados.filter(p => p !== clave);
    } else {
      this.permisosSeleccionados = [...this.permisosSeleccionados, clave];
    }
  }

  async crear() {
    this.error = null;
    this.mensaje = null;

    if (!this.nombre.trim()) {
      this.error = 'Ponele un nombre al rol.';
      return;
    }
    if (this.permisosSeleccionados.length === 0) {
      this.error = 'Elegí al menos un permiso.';
      return;
    }

    this.guardando = true;
    const r = await this.servicio.crearRol(this.nombre, this.permisosSeleccionados);
    this.guardando = false;

    if (r.exito) {
      this.mensaje = `Rol "${this.nombre.trim()}" creado.`;
      this.nombre = '';
      this.permisosSeleccionados = [];
      await this.recargar();
    } else {
      this.error = r.error || 'No se pudo crear el rol.';
    }
    this.cdr.detectChanges();
  }

  async eliminar(rol: Rol) {
    if (!confirm(`¿Eliminar el rol "${rol.nombre}"? Los usuarios que lo tengan pierden esos permisos.`)) return;

    this.error = null;
    this.mensaje = null;

    const r = await this.servicio.eliminarRol(rol.id);
    if (r.exito) {
      this.mensaje = `Rol "${rol.nombre}" eliminado.`;
      await this.recargar();
    } else {
      this.error = r.error || 'No se pudo eliminar el rol.';
    }
    this.cdr.detectChanges();
  }

  async asignar(rol: Rol) {
    this.error = null;
    this.mensaje = null;

    const email = (this.emailPorRol[rol.id] || '').trim();
    if (!email) {
      this.error = 'Escribí el email del usuario.';
      return;
    }

    const r = await this.servicio.asignar(email, rol.id);

    if (!r.exito) {
      this.error = r.error || 'No se pudo asignar el rol.';
    } else if (r.resultado === 'no_existe') {
      this.error = 'No existe un usuario con ese email.';
    } else if (r.resultado === 'ya_tenia') {
      this.mensaje = 'Ese usuario ya tenía el rol.';
    } else {
      this.mensaje = `Rol "${rol.nombre}" asignado a ${email}.`;
      this.emailPorRol[rol.id] = '';
      await this.recargar();
    }
    this.cdr.detectChanges();
  }

  async quitar(a: Asignacion, rol: Rol) {
    this.error = null;
    this.mensaje = null;

    const r = await this.servicio.quitar(a.usuario_id, rol.id);
    if (r.exito) {
      this.mensaje = `Se quitó el rol "${rol.nombre}" a ${a.email}.`;
      await this.recargar();
    } else {
      this.error = r.error || 'No se pudo quitar el rol.';
    }
    this.cdr.detectChanges();
  }
}