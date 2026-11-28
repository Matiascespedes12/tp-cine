# TP Cine: sistema de venta de entradas

Aplicación web para un cine: los clientes ven la cartelera, eligen función y butacas en tiempo real, compran entradas y productos del candy bar, y reciben una entrada con QR. El personal valida las entradas y entrega el candy, y el administrador gestiona películas, funciones, cupones, roles, reportes y candy bar.

Trabajo práctico 1 de Programación IV.

- **App desplegada:** https://tp-cine-topaz.vercel.app
- **Repositorio:** https://github.com/Matiascespedes12/tp-cine
- **Autor:** Matias Cespedes

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (componentes standalone, signals, sin Zone.js) |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| PWA | `@angular/pwa` con service worker (`ngsw`) |
| Despliegue | Vercel (redeploy automático con cada push a `main`) |
| QR | librería `qrcode` |

## Arquitectura

```
src/app/
├── core/          Servicios y guards compartidos (Supabase, Auth, Permisos, Notificaciones, guards)
├── shared/        Barra de navegación y pipe propio
├── public/        Lo que ve el cliente: cartelera, detalle, butacas, checkout, perfil, propuestas
├── auth/          Login y registro (formulario reactivo)
├── admin/         Panel de administración: películas, funciones, propuestas, roles, cupones, reportes, candy bar
└── empleado/      Validación de entradas y entrega del candy
```

**Patrón general:** los componentes muestran datos y capturan eventos. Toda la comunicación con Supabase pasa por servicios inyectables. Un único servicio `Supabase` crea el cliente, así hay una sola conexión en toda la app.

## Decisiones técnicas

**Las reglas de negocio críticas viven en la base de datos, no en el front.** El front se puede manipular desde el navegador; la base no.

- **Asignación automática de sala:** la función `crear_funcion` elige la primera sala sin funciones superpuestas, con 30 minutos de margen. Ignora las funciones canceladas y usa un candado (`pg_advisory_xact_lock`) para que dos administradores no asignen la misma sala a la vez.
- **Una butaca no se vende dos veces:** índice único parcial sobre `(funcion_id, butaca_id)` para entradas no canceladas.
- **QR de un solo uso:** `validar_entrada` cambia el estado con bloqueo de fila (`for update`). Un segundo intento devuelve "ya usada".
- **Butacas en tiempo real:** el mapa se suscribe con Supabase Realtime a los cambios de `entradas` de esa función. Si otra persona compra o alguien cancela, el mapa se actualiza sin recargar.
- **Restricción de edad:** `edad_permitida` se aplica en la política de `entradas` y también dentro de las funciones de compra. La compra anónima se rechaza en películas con restricción.
- **Cupón de primera compra:** `descuento_primera_compra` lee el porcentaje configurado y lo calcula desde la sesión, según el historial de entradas no canceladas. El admin lo cambia desde una pantalla (con un `check` de 0 a 100 en la base).
- **Reseñas:** una por usuario y película (índice único), con estrellas y un comentario de hasta 280 caracteres. Cada usuario solo crea y edita la suya; el nombre del autor sale por una función que no abre la tabla de usuarios.
- **Más vendidas:** `peliculas_mas_vendidas` agrupa las entradas no canceladas por película y excluye las ocultas. El home reordena y marca el puesto.
- **Ocultar películas:** un campo `visible`. Ocultar no borra nada: se conservan entradas, reseñas y funciones, y se revierte con un click.

**Candy bar**

- **Productos y categorías:** los carga quien tiene el permiso `candy`. Los productos no se borran, se desactivan, porque pueden tener ventas asociadas; el público solo ve los activos y esto lo impone una política RLS.
- **Compra con candy:** `comprar_con_productos` recibe únicamente qué productos y cuántos (nunca precios), recalcula entradas y candy en la base y crea todo en **una sola transacción**: si algo falla (butaca ocupada, producto desactivado), no se crea nada. La tabla `detalle_candy` no tiene acceso directo: solo se toca a través de funciones.
- **Un solo QR para todo:** el candy queda asociado a la primera entrada de la compra y se retira con ese código. El retiro tiene un **estado propio** (`candy_retirado`), independiente del estado de la entrada: se puede entrar a la función sin retirar la comida, o al revés, y cada cosa se puede hacer una sola vez. `consultar_candy` muestra qué entregar y `entregar_candy` lo confirma con bloqueo de fila; ambas exigen ser personal.

**Puntos del último pedido del cliente**

- **Cancelación de una función por el cine:** `cancelar_funcion` corre en **una sola transacción**: acredita a cada usuario el total de sus entradas **y del candy que todavía no se retiró**, deja un movimiento de crédito, crea una notificación, libera las butacas y marca la función como cancelada. Si cualquier paso falla, no se acredita a nadie. El crédito se puede gastar en otra función de la misma película (`comprar_con_credito` y `comprar_con_productos`, que recalculan los precios en la base).
- **Notificaciones:** tabla `notificaciones` con Realtime. La campanita de la barra muestra los avisos sin recargar.
- **Propuestas de películas:** cada cliente puede tener una propuesta pendiente a la vez (índice único parcial). El admin acepta o rechaza; al aceptar se abre el formulario de películas con los datos cargados, y la propuesta se marca aceptada recién cuando la película se crea.
- **Roles configurables:** modelo usuario ↔ rol ↔ permiso. El admin crea roles con permisos (`peliculas`, `funciones`, `propuestas`, `validacion`, `reportes`, `candy`) y los asigna por email. `tiene_permiso()` se usa en las políticas RLS y en las funciones; en Angular, un guard por permiso y una barra que muestra solo lo permitido. Gestionar roles es exclusivo del admin, para que nadie pueda darse permisos a sí mismo.
- **Lista de espera:** cuando una función se agota, los usuarios registrados se anotan y ven su posición. Si alguien cancela su compra (hasta 2 horas antes, con crédito), `cancelar_entrada` ofrece la butaca al primero de la lista con **15 minutos** para comprarla. La reserva se impone con un trigger en `entradas`, también para la compra con crédito. Al vencer el plazo, pasa al siguiente. El admin ve cuánta gente espera por función.
- **Reporte de facturación:** `reporte_facturacion` agrupa por día (hora de Argentina) las entradas vendidas y lo facturado, sin contar las canceladas. Exige el permiso `reportes`, así que se puede crear un rol que acceda solo a esa sección.

**Seguridad (Row Level Security)**

- Catálogo con lectura pública; escritura solo con el permiso correspondiente.
- Cada usuario ve y edita solo su perfil, y solo puede cambiar sus datos personales (permisos por columna): nunca su rol, crédito o puntos.
- Al registrarse solo se puede crear el rol `cliente`, con crédito y puntos en cero.
- Los administradores se crean directamente en la base.
- Los guards protegen las pantallas, pero la seguridad real son las políticas y funciones de la base.

**Angular**

- Componentes standalone, signals y la sintaxis `@if` / `@for`.
- Sin Zone.js: después de operaciones `async` se llama a `ChangeDetectorRef.detectChanges()`; la sesión, los permisos y las notificaciones son signals.
- **Pipes:** `date` y `currency` (idioma `es-AR` registrado) y un pipe propio, `restriccionEdad`.
- **Formularios reactivos:** registro y propuestas, con `required`, `email`, `minLength`, `maxLength`, `min`/`max` y un validador propio (`fechaNoFutura`).
- **Guards:** `canActivate` (administrador, personal y permisos) y `canDeactivate` (avisa si salís del mapa con butacas elegidas).
- **PWA:** manifest, íconos y service worker; la app se instala y abre en su propia ventana.
- Husos horarios: `timestamptz` y horario de Argentina (UTC-3) indicado de forma explícita al crear funciones.

**Imágenes:** los pósters se suben a Supabase Storage (bucket `posters`). Cualquiera puede verlos; solo quien tiene el permiso de películas puede subir o borrar.

## Qué está implementado

- Cartelera con buscador por título, filtro por género (varios por película) y las 3 películas más vendidas primero.
- Detalle con funciones, reseñas con promedio y formulario para reseñar.
- Mapa de butacas en tiempo real, con accesibles (fila J) y VIP (filas R, S y T) diferenciadas, y aviso de VIP antes de pagar.
- Registro e inicio de sesión; barra con sesión, permisos y notificaciones.
- Compra con o sin sesión, cupón de primera compra, uso del crédito, QR por entrada con el código escrito para ingreso manual.
- Candy bar: el admin carga categorías y productos, el cliente los suma a la compra y el personal los entrega con el mismo QR.
- Mi perfil: crédito, entradas con cancelación hasta 2 horas antes, y listas de espera con posición.
- Panel de administración: películas con póster (crear, ocultar y mostrar), funciones con sala automática y cancelación atómica, propuestas, roles, cupones, reporte de facturación, candy bar y lista de espera por función.
- Validación de entradas y entrega del candy por el personal.
- PWA instalable.

## Pendiente

Funcionalidades del pedido que no están:

- Combos y programa de puntos.
- PDF de la entrada y escaneo del QR con cámara (hoy el código se escribe a mano).
- Preventa, "Próximamente", alertas y "Mis películas".
- Reportes con gráficos y exportación a PDF o Excel, y log de actividad.
- Administración de salas y butacas, y funciones repetidas por día de la semana.
- Editar los datos de una película (hoy se crea y se oculta).
- Cupón por edad (mayores de 50).
- La entrada no aclara "debe ir acompañado de un adulto" (solo lo dice el detalle de la película).
- Notificaciones push reales (hoy los avisos van por la campanita en tiempo real).

## Limitaciones conocidas

- **Los 15 minutos de la lista de espera no corren con un proceso en segundo plano:** se procesan cuando alguien abre el mapa o "Mi perfil". Con `pg_cron` se resolvería.
- Los permisos de roles son un conjunto fijo de seis, que coinciden con las secciones del admin que existen.
- Crear un rol son dos inserts desde el cliente; lo correcto sería una función transaccional, como en la cancelación de funciones.
- En la compra común, el precio con descuento lo calcula el front. En la compra con crédito o con candy, lo calcula la base.
- **Candy bar:** sin combos ni imágenes de producto; el descuento de primera compra se aplica a las entradas y no al candy; todo el candy de una compra queda en una sola entrada.
- **Al cancelar una entrada o una función, el crédito incluye el candy que todavía no se retiró; el candy ya entregado no se devuelve.**
- La lectura de `entradas` es pública para poder mostrar butacas ocupadas; a futuro conviene reemplazarla por una vista sin los códigos QR.
- La butaca se bloquea al confirmar la compra, no al seleccionarla.
- `canDeactivate` solo intercepta la navegación dentro de la app (no cubre cerrar la pestaña).
- Ocultar una película la saca de la cartelera, pero no cancela sus funciones.
- El reporte de facturación cuenta el precio de las entradas, incluso las pagadas con crédito, y no las canceladas.
- El precio base ($2000) y el recargo VIP (×1,5) están en el código; no hay pasarela de pago.
- El admin no ve el nombre de quien envía una propuesta.

## Ejecutar en local

```bash
npm install
ng serve
```

Luego abrir `http://localhost:4200`. La URL y la clave pública de Supabase están en `src/environments/environment.ts`.