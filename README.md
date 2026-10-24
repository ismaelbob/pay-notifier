# Pay Notifier

App móvil para llevar registro de **cobros recibidos**: monto, quién paga, banco y hora.

Hecha con Expo SDK 58 (React Native 0.88) en JavaScript, con Expo Router y tema claro/oscuro.

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
  utils/               # dinero, fechas y agrupaciones
  config.js            # locale, moneda y decimales
metro.config.js        # soporte .wasm y headers para SQLite en web
```

## Datos

Los cobros se guardan en el dispositivo con **expo-sqlite** (`pay-notifier.db`):

- Tabla `payments` (`id`, `sender`, `bank`, `amount_minor`, `received_at`, `reference`, `created_at`).
- Los importes se guardan como **enteros en unidades menores** (sin decimales flotantes).
  COP usa 0 decimales; si cambias a una moneda con centavos, ajusta `CURRENCY_DECIMALS` en `src/config.js`.
- Los datos de ejemplo se siembran **solo la primera vez** (controlado con `PRAGMA user_version`).
- Los cobros añadidos con **“Simular cobro recibido”** sobreviven al reinicio de la app.
- Para inspeccionar la base de datos en desarrollo: Shift + M en la terminal de Expo → *Open expo-sqlite*.

## Ajustes rápidos

- **Moneda / formato**: `src/config.js` (`LOCALE`, `CURRENCY` y `CURRENCY_DECIMALS`). Por defecto `es-CO` / `COP`.
- **Colores**: `src/theme/colors.js`.
- **Datos de ejemplo**: `src/data/payments.js`.

El tema elegido (Sistema / Claro / Oscuro) se guarda con AsyncStorage.

### SQLite en web

`metro.config.js` ya empaqueta `.wasm` y añade los headers `COEP`/`COOP` para el servidor de
desarrollo. Si publicas la versión web, tu hosting debe enviar esos mismos headers.

## Estado actual

- UI completa, cobros persistidos en SQLite y totales calculados desde la base de datos.
- Botón **“Simular cobro recibido”** en Inicio para probar la inserción y persistencia.
- Sin backend ni sincronización entre dispositivos.

## Siguiente paso: detección real de notificaciones

Leer las notificaciones del banco requiere un `NotificationListenerService` nativo en Android
(permiso especial del sistema). Eso implica:

1. Crear un módulo nativo (config plugin + Kotlin).
2. Generar un **development build**: `npx expo run:android` o `eas build --profile development`.
3. Parsear el texto de cada notificación (monto, remitente, banco).

No funciona en Expo Go ni en iOS (el sistema no permite a las apps leer notificaciones de otras apps).
