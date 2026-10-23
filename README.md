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
    _layout.js         # providers raíz + Stack
    (tabs)/
      _layout.js       # barra de pestañas
      index.js         # Inicio: resumen y últimos cobros
      history.js       # Historial agrupado por día
      settings.js      # Apariencia, avisos y acerca de
  components/          # UI reutilizable (Screen, PaymentRow, Chip…)
  context/             # estado de cobros (en memoria)
  data/                # cobros de ejemplo + bancos
  theme/               # paletas y ThemeProvider (modo claro/oscuro)
  utils/               # formato de moneda/fechas y agrupaciones
  config.js            # locale y moneda
```

## Ajustes rápidos

- **Moneda / formato**: `src/config.js` (`LOCALE` y `CURRENCY`). Por defecto `es-CO` / `COP`.
- **Colores**: `src/theme/colors.js`.
- **Datos de ejemplo**: `src/data/payments.js`.

El tema elegido (Sistema / Claro / Oscuro) se guarda con AsyncStorage.

## Estado actual

- UI completa con datos de ejemplo en memoria.
- Botón **“Simular cobro recibido”** en Inicio para ver la lista y los totales actualizarse.
- Sin backend ni persistencia de cobros todavía.

## Siguiente paso: detección real de notificaciones

Leer las notificaciones del banco requiere un `NotificationListenerService` nativo en Android
(permiso especial del sistema). Eso implica:

1. Crear un módulo nativo (config plugin + Kotlin).
2. Generar un **development build**: `npx expo run:android` o `eas build --profile development`.
3. Parsear el texto de cada notificación (monto, remitente, banco).

No funciona en Expo Go ni en iOS (el sistema no permite a las apps leer notificaciones de otras apps).
