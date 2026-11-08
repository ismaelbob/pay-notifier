# Changelog

Todos los cambios notables de Pay Notifier se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [1.1.0] - 2026-11-08

### Agregado

- Anuncio por voz del monto recibido (“20 bolivianos recibidos”) mediante
  `TextToSpeech` nativo, con la app abierta o cerrada.
- Ajuste **Anunciar cobros por voz** en Ajustes, activado por defecto, y botón
  **Probar voz**.
- Aviso en Ajustes cuando falta un motor de voz o una voz en español.
- La versión mostrada en Ajustes ahora se lee de `app.json` en lugar de estar
  escrita a mano.

### Cambiado

- El anuncio espera ~0.5 s desde que el banco publica la notificación para no
  pisar su sonido. El retardo se compensa con `postedTime`, así que no se suman
  esperas si el sistema entrega la notificación tarde.

### Corregido

- Las filas de Ajustes usaban `colors.card`, que no existe en la paleta; ahora
  usan `colors.surface` y respetan el tema claro/oscuro.

## [1.0.0] - 2026-11-06

### Agregado

- Detección automática de cobros desde notificaciones de bancos y billeteras
  bolivianas, con la app abierta o cerrada.
- Soporte para BNB, BMSC, Banco Unión, Banco Bisa, BCP Bolivia, Banco Económico,
  BancoSol, Yape, Yasta, Altoke, ZAS, Tigo Money y YOLO.
- Registro de monto en bolivianos, quién paga, banco o billetera y hora.
- Inicio con resumen y últimos cobros, e historial agrupado por día.
- Deduplicación por `source_key` para que un mismo cobro no se registre dos veces.
- Tema claro/oscuro y datos locales sin backend.

### Corregido

- Detección de cobros de Yasta cuando el monto aparece antes de “Bs”.
- Crash cuando el módulo nativo de notificaciones no está incluido en el build.
- Ajustes de compilación para EAS.

[1.1.0]: https://github.com/ismaelbob/pay-notifier/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ismaelbob/pay-notifier/releases/tag/v1.0.0
