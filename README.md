# PAC-MAN Neon

Juego en vivo: https://juegopac-man-948774944187.europe-west1.run.app/

## Descripcion

PAC-MAN Neon moderniza el clasico laberinto arcade con estilo cyber neon, overlays de estado y soporte total de controles para escritorio y movil.

## Estandar aplicado

Este proyecto fue ajustado para mantener el mismo lenguaje visual y documental de JuegoSerpiente.

- Tipografia y paleta compartida para toda la franquicia.
- Composicion de pantalla y paneles coherente con el resto de juegos.
- Reglas globales de interaccion tactil sin scroll durante partida.

## Arquitectura comun

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + motion/react
- Gameplay sobre canvas con estado sincronizado por componentes
- Ranking remoto (Apps Script) + fallback localStorage
- Dockerfile multistage + cloudbuild.yaml

## Controles

- Escritorio: flechas o WASD para mover, P para pausar.
- Movil: swipe y controles direccionales en pantalla.

## Desarrollo local

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar entorno local:

```bash
npm run dev
```

3. Validar tipado:

```bash
npm run lint
```

## Build y despliegue

- Build: npm run build
- Runtime: puerto 8080
- Despliegue automatizable con cloudbuild.yaml

## Creditos

Desarrollado por Galindez & IA.
