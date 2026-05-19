# Poder Verde HRM

Sistema de gestión de recursos humanos para administrar empleados, tareas, asistencia, permisos, nómina, documentos y reportes KPI.

Tecnologías principales:

- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: MySQL 8
- Contenedores: Docker Compose

## Requisitos

### Opción recomendada: con Docker

Instala Docker según tu sistema operativo:

- Windows: Docker Desktop con WSL 2 habilitado.
- macOS: Docker Desktop.
- Linux/Fedora: Docker Engine + Docker Compose Plugin.

En Fedora normalmente basta con tener Docker activo y tu usuario con permisos para usarlo:

```bash
sudo systemctl enable --now docker
docker compose version
```

Si `docker compose version` responde correctamente, puedes iniciar el proyecto.

### Opción sin Docker

Necesitas instalar manualmente:

- Node.js 20 o superior.
- MySQL 8.
- npm.

## Inicio rápido con Docker

Desde la carpeta raíz del proyecto:

```bash
docker compose up --build
```

Cuando termine de levantar:

- Frontend: http://localhost:5173
- Backend/API: http://localhost:4000
- Health check: http://localhost:4000/health
- MySQL local: puerto `3306`

La base de datos se crea automáticamente la primera vez usando `poder_verde_hrm.sql`.

Si ya tenías una base anterior y quieres reiniciar todo desde cero:

```bash
docker compose down -v
docker compose up --build
```

Si el puerto `3306` ya está ocupado en tu máquina, cambia solo el lado izquierdo del puerto en `docker-compose.yml`, por ejemplo:

```yaml
ports:
  - "3307:3306"
```

El backend dentro de Docker debe seguir usando `DB_PORT=3306`.

## Credenciales de prueba

Administrador:

- Correo: `david@poderverde.com`
- Contraseña: `12345`

Empleados de prueba:

- Correo: `elena@poderverde.com`
- Contraseña: `12345`

También existen otros usuarios semilla en el SQL, todos con contraseña `12345`.

## Inicio sin Docker

1. Crea una base de datos MySQL importando el archivo:

```bash
mysql -u root -p < poder_verde_hrm.sql
```

2. Configura el backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Para entorno local sin Docker, revisa que `backend/.env` apunte a tu MySQL. Un ejemplo común:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=poder_verde_hrm
JWT_SECRET=poder-verde-dev-secret
```

3. En otra terminal, inicia el frontend:

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173.

## Comandos útiles

Levantar en segundo plano:

```bash
docker compose up --build -d
```

Ver logs:

```bash
docker compose logs -f
```

Detener contenedores sin borrar datos:

```bash
docker compose down
```

Detener y borrar la base de datos persistida:

```bash
docker compose down -v
```

Generar build del frontend:

```bash
docker compose run --rm --no-deps frontend npm run build
```

## Estructura del proyecto

- `backend/`: API Express, rutas, servicios, middleware y configuración de base de datos.
- `frontend/`: aplicación React, componentes, vistas, modales, hooks y estilos.
- `poder_verde_hrm.sql`: esquema inicial y datos de prueba.
- `docker-compose.yml`: entorno completo con MySQL, backend y frontend.
- `requerimientos.txt`: descripción de requerimientos del proyecto.

## Notas para el equipo

- Los archivos subidos por usuarios se guardan en `backend/uploads/`, pero no se suben a GitHub.
- La carpeta `backend/uploads/` se mantiene con `.gitkeep` para que exista al clonar el proyecto.
- No suban archivos `.env`, `node_modules/`, `frontend/dist/` ni documentos cargados durante pruebas.
- Para validar desde cero, usen `docker compose down -v` y después `docker compose up --build`.
