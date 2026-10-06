# TP Cine: sistema de venta de entradas

Aplicación web para un cine: los clientes ven la cartelera, eligen función y butacas en tiempo real, compran y reciben una entrada con QR. El personal valida las entradas y el administrador gestiona películas y funciones.

Trabajo práctico 1 de Programación IV.

- **App desplegada:** https://tp-cine-topaz.vercel.app
- **Repositorio:** https://github.com/Matiascespedes12/tp-cine
- **Autor:** Matias Cespedes

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular (componentes standalone, signals, sin Zone.js) |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Despliegue | Vercel (redeploy automático con cada push a `main`) |
| QR | librería `qrcode` |

## Arquitectura

```
src/app/
├── core/          Servicios y guards compartidos (Supabase, Auth, guards de rutas)
├── shared/        Componentes reutilizables (barra de navegación)
├── public/        Lo que ve el cliente: cartelera, detalle, butacas, checkout
├── auth/          Login y registro
├── admin/         Panel de administración: películas y funciones
└── empleado/      Validación de entradas
```

**Patrón general:** los componentes solo muestran datos y capturan eventos. Toda la comunicación con Supabase pasa por servicios inyectables (`Peliculas`, `Butacas`, `Compras`, `Auth`, etc.). Un único servicio `Supabase` crea el cliente, así hay una sola conexión en toda la app.

**Base de datos (15 tablas):** usuarios, películas, géneros (relación N a N con películas), salas, butacas, funciones, entradas, reseñas, productos, categorías, combos, cupones, movimientos de puntos, recompensas, alertas y log de actividad.

## Decisiones técnicas

**Las reglas de negocio críticas viven en la base de datos, no en el front.** El front puede ser manipulado desde el navegador, la base no.

- **Asignación automática de sala:** la función `crear_funcion` (PostgreSQL) elige la primera sala sin funciones superpuestas, con 30 minutos de margen entre función y función. Usa un candado (`pg_advisory_xact_lock`) para que dos administradores no puedan asignar la misma sala a la vez.
- **Una butaca no se vende dos veces:** índice único parcial sobre `(funcion_id, butaca_id)` para entradas no canceladas. Si dos personas confirman la misma butaca, solo la primera gana.
- **QR de un solo uso:** la función `validar_entrada` cambia el estado a `validada` con bloqueo de fila (`for update`). Un segundo intento devuelve "ya usada". Solo la puede ejecutar personal (empleado o admin).
- **Butacas en tiempo real:** el mapa se suscribe con Supabase Realtime a los `INSERT` de `entradas` de esa función. Si otra persona compra, la butaca pasa a ocupada sin recargar, y si estaba seleccionada se deselecciona con un aviso.

**Seguridad (Row Level Security):**

- Las tablas de catálogo tienen lectura pública. Las de administración exigen `es_admin()`.
- Cada usuario solo ve y edita su propio perfil.
- Al registrarse solo se puede crear el rol `cliente`; los administradores se crean directamente en la base.
- La política de `entradas` impide comprar a nombre de otro usuario (`usuario_id` debe ser el propio o nulo para compra anónima).
- Los guards de Angular (`adminGuard`, `personalGuard`) protegen las pantallas, pero la seguridad real son las políticas de la base.

**Angular:**

- Componentes standalone y sintaxis moderna (`@if`, signals) donde corresponde.
- El proyecto no usa Zone.js, por eso tras operaciones `async` se llama a `ChangeDetectorRef.detectChanges()` y la sesión se guarda en un `signal`.
- Husos horarios: las funciones se guardan con `timestamptz` y el horario de Argentina (UTC-3) se indica de forma explícita al crearlas.

**Imágenes:** los pósters se suben a Supabase Storage (bucket `posters`). Solo un admin puede subir o borrar; cualquiera puede verlos.

## Qué está implementado

- Cartelera con buscador por título y filtro por género (varios géneros por película).
- Detalle de película con funciones, reseñas y promedio.
- Mapa de butacas con butacas accesibles (fila J) y VIP (filas R, S y T) diferenciadas, y aviso de VIP antes de pagar.
- Compra con o sin sesión; la entrada queda a nombre del usuario si está logueado.
- Entrada con código QR y código escrito (para ingreso manual).
- Registro e inicio de sesión con los datos pedidos por el cliente.
- Panel de administración: alta de películas con póster y creación de funciones con asignación automática de sala.
- Validación de entradas por personal.

## Pendiente

Funcionalidades del pedido del cliente que todavía no están:

- Cupón del 20% en la primera compra y cupones por edad.
- Bloqueo de compra por restricción de edad (+13 y +18).
- Candy bar, combos y programa de puntos.
- Generación de PDF de la entrada y escaneo con cámara (hoy el código se ingresa a mano).
- Cancelación con crédito, preventa, "Próximamente" y "Mis películas".
- Reportes, gráficos y log de actividad.
- Funciones repetidas por día de la semana.
- PWA.

## Limitaciones conocidas

- El precio base ($2000) y el recargo VIP (50%) están en el código; a futuro deberían configurarse desde el admin.
- La lectura de `entradas` es pública para poder mostrar butacas ocupadas. A futuro conviene reemplazarla por una vista que solo exponga qué butacas están tomadas, sin los códigos QR.
- La butaca se bloquea al confirmar la compra, no al seleccionarla.

## Ejecutar en local

```bash
npm install
ng serve
```

Luego abrir `http://localhost:4200`. La URL y la clave pública de Supabase están en `src/environments/environment.ts`.