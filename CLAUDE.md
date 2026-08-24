# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm install                # instalar dependencias (usar npm ci en CI)
npm test                   # todas las pruebas (jest --runInBand)
npm run test:coverage      # pruebas + informe de cobertura en coverage/
npm run test:watch         # modo watch
npm start                  # servidor en http://localhost:3000
npm run dev                # servidor con recarga (node --watch)

npx jest -t "<nombre de la prueba>"   # ejecutar una sola prueba por nombre
npx jest tests/app.test.js            # ejecutar un solo fichero

docker build -t practica-final-devops .
docker run --rm -p 3000:3000 practica-final-devops
```

## Arquitectura

App web "Hola Mundo" en Express, montada como practica de CI/CD. Tres rutas:
`/` (pagina HTML estatica desde `public/`), `/api/saludo` (JSON, acepta
`?nombre=`) y `/health` (health check).

La separacion clave esta entre `src/app.js` y `src/server.js`:

- `src/app.js` exporta `crearApp()`, que **construye y devuelve** la app Express
  sin llamar a `listen()`. Es lo que consumen las pruebas.
- `src/server.js` es el unico sitio que llama a `listen()` y que instala los
  manejadores de `SIGTERM`/`SIGINT` para el apagado limpio en contenedor.

Por eso las pruebas de `tests/app.test.js` usan `supertest(crearApp())` y no
ocupan ningun puerto: se pueden ejecutar en paralelo y no dejan procesos vivos.
**Al anadir rutas, hacerlo dentro de `crearApp()`**, nunca en `server.js`, o
quedaran fuera del alcance de las pruebas.

El handler `404` es un `app.use()` final: cualquier ruta nueva debe registrarse
antes que el, o nunca se alcanzara.

El puerto se lee de `process.env.PORT` (Render lo inyecta en runtime). No fijarlo.

## Pipeline CI/CD

`.github/workflows/ci-cd.yml` — tres jobs encadenados por `needs`:
`test` → `docker` → `deploy`.

- `docker` se salta en pull request. Construye siempre la imagen; solo hace
  `push` a Docker Hub si existe `DOCKERHUB_TOKEN` (comprobado en el step
  `credenciales`, que expone `outputs.disponibles`).
  Este patron mantiene el CI en verde antes de configurar los secretos: emite
  un `::warning::` en vez de fallar.
- `deploy` solo corre en `main`. Hace `POST` al Deploy Hook de Render y despues
  hace polling de `$APP_URL/health` hasta 5 minutos.

Solo hay dos secretos: `DOCKERHUB_TOKEN` y `RENDER_DEPLOY_HOOK_URL`. El
usuario de Docker Hub (`DOCKERHUB_USER`) y la URL publica (`APP_URL`) no son
confidenciales y viven en el bloque `env:` del workflow; al reutilizar el
repo en otra cuenta hay que cambiarlos ahi.

## Docker

Build multi-etapa sobre `node:22-alpine`. La etapa `deps` corre
`npm ci --omit=dev`, asi que **Jest y Supertest no llegan a la imagen final**.
La imagen corre como usuario `node` (no root) y lleva `HEALTHCHECK` contra
`/health` usando `curl` (instalado con `apk`).

`.dockerignore` excluye `tests/`, `node_modules/` y los `*.md`. Si se anade un
directorio nuevo que deba ir en la imagen, hay que anadir su `COPY` explicito
al Dockerfile: solo se copian `src/`, `public/` y `package.json`.
