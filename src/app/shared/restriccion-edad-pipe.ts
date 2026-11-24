import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'restriccionEdad' })
export class RestriccionEdadPipe implements PipeTransform {
  transform(edad: number | null): string {
    return edad ? `+${edad}` : 'Apta para todo público';
  }
}