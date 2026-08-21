# Practica Final DevOps — CI/CD con GitHub Actions

Aplicacion web **Hola Mundo** en Node.js + Express con pipeline completo de
integracion y despliegue continuo: pruebas unitarias, imagen Docker publicada
en Docker Hub y despliegue automatico en Render.

**Autora:** Triana Garcia

---

## Enlaces

| Recurso | URL |
| --- | --- |
| Repositorio | https://github.com/garciadejesustrianaolivadia165-a11y/Practica_Final_DevOps_Triana_Garcia |
| Aplicacion en produccion | _(pendiente: se rellena al crear el servicio en Render)_ |
| Imagen en Docker Hub | _(pendiente: `<usuario>/practica-final-devops`)_ |

---

## Que hace la aplicacion

| Ruta | Metodo | Descripcion |
| --- | --- | --- |
| `/` | GET | Pagina web "Hola Mundo" |
| `/api/saludo` | GET | Devuelve el saludo en JSON. Acepta `?nombre=` |
| `/health` | GET | Health check usado por Render y por el `HEALTHCHECK` de Docker |

```bash
curl https://<tu-app>.onrender.com/api/saludo?nombre=Triana
# {"mensaje":"Hola Triana!","app":"Practica Final DevOps","autor":"Triana Garcia","version":"1.0.0"}
```

---

## Estructura del proyecto

```
.
├── .github/workflows/ci-cd.yml   Pipeline de GitHub Actions (test -> docker -> deploy)
├── src/
│   ├── app.js                    Construye la app Express (sin arrancar el servidor)
│   └── server.js                 Arranca el servidor y gestiona SIGTERM/SIGINT
├── public/index.html             Pagina web Hola Mundo
├── tests/app.test.js             Pruebas unitarias (Jest + Supertest)
├── Dockerfile                    Imagen multi-etapa basada en node:22-alpine
├── render.yaml                   Blueprint para crear el servicio en Render
└── package.json
```

`src/app.js` exporta `crearApp()` en lugar de una app ya escuchando. Asi las
pruebas montan la aplicacion en memoria con Supertest, sin ocupar un puerto.

---

## Ejecutar en local

```bash
npm install     # instalar dependencias
npm test        # ejecutar las pruebas unitarias
npm start       # arrancar en http://localhost:3000
```

Ejecutar una sola prueba:

```bash
npx jest -t "saluda al nombre recibido por query string"
```

---

## Ejecutar con Docker

```bash
docker build -t practica-final-devops .
docker run --rm -p 3000:3000 practica-final-devops
```

O directamente desde Docker Hub:

```bash
docker run --rm -p 3000:3000 <usuario>/practica-final-devops:latest
```

---

## El pipeline de CI/CD

El workflow `.github/workflows/ci-cd.yml` se dispara en cada `push` a `main`,
en los pull request y manualmente (`workflow_dispatch`). Tiene tres jobs
encadenados: si uno falla, los siguientes no se ejecutan.

```
push a main
    │
    ├─ 1. test    npm ci  ->  npm test  ->  cobertura como artefacto
    │
    ├─ 2. docker  build de la imagen  ->  push a Docker Hub (:latest y :<sha>)
    │
    └─ 3. deploy  POST al Deploy Hook de Render  ->  espera a que /health de 200
```

Detalles:

- **test** — instala con `npm ci` (respeta el lockfile), ejecuta Jest y sube el
  informe de cobertura como artefacto descargable.
- **docker** — no se ejecuta en pull request. Construye siempre la imagen (asi
  valida el Dockerfile) y solo la sube si existen los secretos de Docker Hub.
  Usa cache de GitHub Actions (`type=gha`) para acelerar builds sucesivos.
- **deploy** — solo en `main`. Llama al Deploy Hook de Render y despues hace
  polling de `/health` hasta 5 minutos para confirmar que la app quedo viva.

---

## Configuracion necesaria

### 1. Secretos de GitHub

En el repositorio: **Settings → Secrets and variables → Actions → New repository secret**

| Secreto | Valor |
| --- | --- |
| `DOCKERHUB_USERNAME` | Tu usuario de Docker Hub |
| `DOCKERHUB_TOKEN` | Access Token de Docker Hub (Account Settings → Personal access tokens, permiso *Read & Write*) |
| `RENDER_DEPLOY_HOOK_URL` | Deploy Hook del servicio en Render (Settings → Deploy Hook) |

### 2. Variable de GitHub

En la pestaña **Variables** de la misma pantalla:

| Variable | Valor |
| --- | --- |
| `RENDER_APP_URL` | URL publica de la app, p. ej. `https://practica-final-devops.onrender.com` (sin barra final) |

Se usa para verificar el despliegue y para mostrar el enlace en la pestana
*Environments* del repositorio.

### 3. Servicio en Render

1. En https://dashboard.render.com → **New → Web Service**.
2. Conectar este repositorio de GitHub.
3. Elegir **Docker** como runtime (Render detecta el `Dockerfile`).
4. Plan **Free**, Health Check Path `/health`.
5. Crear el servicio y copiar su **Deploy Hook** y su **URL** a los secretos y
   variables del paso anterior.

Alternativa: **New → Blueprint**, que lee el `render.yaml` incluido y crea el
servicio con toda la configuracion ya puesta.

> El Dockerfile no fija el puerto: lee `process.env.PORT`, que es lo que Render
> inyecta en tiempo de ejecucion.

---

## Notas del Dockerfile

- Build multi-etapa: las dependencias se instalan en una etapa aparte y solo se
  copia `node_modules` a la imagen final.
- `npm ci --omit=dev` deja fuera Jest y Supertest de la imagen de produccion.
- Corre como el usuario `node`, sin privilegios de root.
- `HEALTHCHECK` contra `/health` cada 30 segundos.

---

## Licencia

MIT
