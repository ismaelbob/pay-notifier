# Pay Notifier

App móvil para llevar registro de **cobros recibidos** en Bolivia: monto en bolivianos (Bs), quién paga, banco o billetera y hora.

Hecha con Expo SDK 58 (React Native 0.88) en JavaScript, con Expo Router y tema claro/oscuro. Incluye un módulo nativo de Android que detecta notificaciones de bancos y billeteras bolivianas.

## Arrancar

```bash
npm install
npm start
```

Escanea el QR con **Expo Go** en tu teléfono (Android/iOS). También puedes previsualizar en el navegador:

```bash
npm run web
```

> En esta máquina no hay JDK ni Android SDK instalados, así que no se puede compilar un APK local.
> Para builds nativos usa `eas build` o instala Android Studio.

## Estructura

```
src/
  app/                 # rutas (Expo Router)
    _layout.js         # providers raíz + SQLite + Stack
    (tabs)/
      _layout.js       # barra de pestañas
      index.js         # Inicio: resumen y últimos cobros
      history.js       # Historial agrupado por día
      settings.js      # Apariencia, avisos y acerca de
  components/          # UI reutilizable (Screen, PaymentRow, Chip…)
  context/             # estado de cobros (carga/inserta en SQLite)
  data/                # cobros de ejemplo + bancos
  db/                  # esquema, migraciones y consultas SQLite
  theme/               # paletas y ThemeProvider (modo claro/oscuro)
  utils/               # dinero, fechas, agrupaciones y parser de notificaciones
  config.js            # locale, moneda y decimales
modules/
  notification-listener/  # módulo nativo Expo (Kotlin + Swift)
metro.config.js        # soporte .wasm y headers para SQLite en web
```

## Datos

Los cobros se guardan en el dispositivo con **expo-sqlite** (`pay-notifier.db`):

- Tabla `payments` (`id`, `sender`, `bank`, `amount_minor`, `received_at`, `reference`, `source_key`, `created_at`).
- Los importes se guardan como **enteros en unidades menores** (sin decimales flotantes).
  BOB usa 2 decimales; si cambias de moneda, ajusta `CURRENCY_DECIMALS` en `src/config.js`.
- Los datos de ejemplo se siembran **solo la primera vez** (controlado con `PRAGMA user_version`).
- La migración a la versión 2 convierte los importes guardados en COP a BOB (×100) y
  reemplaza los datos de ejemplo colombianos por bolivianos.
- La migración a la versión 3 añade `source_key` con un índice `UNIQUE` para deduplicar
  notificaciones.
- Los cobros añadidos con **“Simular cobro recibido”** sobreviven al reinicio de la app.
- Para inspeccionar la base de datos en desarrollo: Shift + M en la terminal de Expo → *Open expo-sqlite*.

## Ajustes rápidos

- **Moneda / formato**: `src/config.js` (`LOCALE`, `CURRENCY` y `CURRENCY_DECIMALS`). Por defecto `es-BO` / `BOB`.
- **Bancos y billeteras**: `modules/notification-listener/android/.../BankNotificationListenerService.kt` (`BANK_PACKAGES`).
- **Colores por banco**: `src/data/payments.js` (`BANK_COLORS`).
- **Datos de ejemplo**: `src/data/payments.js` (`SEED_PAYMENTS`).
- **Parseo de notificaciones**: `src/utils/notificationParser.js`.
- **Anuncio por voz**: `modules/notification-listener/android/.../PaymentAnnouncer.kt` y `SpeechAmountParser.kt`.

El tema elegido (Sistema / Claro / Oscuro) se guarda con AsyncStorage.

### SQLite en web

`metro.config.js` ya empaqueta `.wasm` y añade los headers `COEP`/`COOP` para el servidor de
desarrollo. Si publicas la versión web, tu hosting debe enviar esos mismos headers.

## Estado actual

- UI completa, cobros persistidos en SQLite y totales calculados desde la base de datos.
- Botón **“Simular cobro recibido”** en Inicio para probar la inserción y persistencia.
- Módulo nativo de Android enlazado por autolinking (`modules/notification-listener`).
- Detección de cobros desde notificaciones, con la app abierta o cerrada.
- Anuncio por voz del monto (“20 bolivianos recibidos”), también con la app cerrada.
- Deduplicación por `source_key` para que un mismo cobro no se registre dos veces.
- Sin backend ni sincronización entre dispositivos.

## Detección de notificaciones

El módulo `NotificationListenerService` de Android escucha las notificaciones de estas apps:

| Bancos | Billeteras |
| --- | --- |
| BNB, BMSC, Banco Unión, Banco Bisa, BCP Bolivia, Banco Económico, BancoSol | Yape, Yasta, Altoke, ZAS, Tigo Money, YOLO |

`src/utils/notificationParser.js` extrae el monto (formatos `Bs. 1.500,00`, `BOB 1500.50`, etc.),
el remitente y la referencia, y descarta pagos enviados o compras.

### Captura en segundo plano

El servicio de Android guarda cada notificación detectada en `SharedPreferences`
(`pay_notifier_pending`) antes de intentar entregarla a JS. Así no se pierde si la app está cerrada
o el runtime de JavaScript no está activo:

1. Al abrir la app, JS lee las notificaciones pendientes con `getPendingNotifications()`.
2. Cada una se parsea e inserta en SQLite.
3. Tras procesarla se confirma con `removePendingNotifications(ids)`; si falla, se reintenta en el
   siguiente arranque.
4. Las notificaciones en vivo se entregan por el evento `onBankNotification` y se confirman igual.

Se conservan como máximo 200 notificaciones y se descartan las de más de 7 días.

### Deduplicación

Cada fila de `payments` tiene una `source_key` única:

- Si la notificación trae referencia de operación, se usa esa (`ref:ABC123`).
- Si no, se genera un hash del contenido + monto + remitente agrupado en ventanas de 2 minutos.
- `INSERT OR IGNORE` + índice único evitan filas repetidas cuando la misma notificación se procesa
  dos veces (evento en vivo y pendiente, reintentos, etc.).

Requisitos:

1. Generar un **development build**: `npx expo run:android` o `eas build --profile development`.
2. Activar **Acceso a notificaciones** para Pay Notifier en los ajustes del sistema (Ajustes → Acceso a notificaciones).

No funciona en Expo Go ni en iOS (el sistema no permite a las apps leer notificaciones de otras apps).

### Anuncio por voz

Cuando llega un cobro, el servicio nativo lo anuncia en voz alta (“20 bolivianos recibidos”) sin
necesidad de abrir la app. El audio lo genera `PaymentAnnouncer.kt` con `TextToSpeech` en español
(`es-BO` → `es-ES` → idioma del sistema).

- Se activa o desactiva en **Ajustes → Anunciar cobros por voz** (activado por defecto).
- Usa el stream multimedia (`USAGE_MEDIA`), así que suena incluso en modo silencio mientras el
  volumen multimedia esté alto. En “No molestar / silencio total” Android puede bloquearlo.
- Solo se anuncia una vez por notificación: los reenvíos se ignoran.
- `SpeechAmountParser.kt` es un port reducido de `src/utils/notificationParser.js` que solo decide
  si hay cobro y cuánto decir. El guardado del cobro sigue en JavaScript, así que un fallo del
  anuncio nunca afecta a los datos. Si agregas un banco o formato nuevo, actualiza ambos archivos.
- La frase usa enteros, nunca decimales, para que el motor de voz no lea mal el separador:
  `1 boliviano recibido`, `20 bolivianos recibidos`, `20 bolivianos con 50 centavos recibidos`.
