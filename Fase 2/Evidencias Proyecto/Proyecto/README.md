# ServiHogar – Guía de Desarrollo

Este proyecto usa Django (4.2 LTS) y PostgreSQL. Está preparado para desarrollo local con entorno virtual de Python y una base de datos PostgreSQL levantada con Docker (recomendado). También funciona con SQLite por defecto si no defines `DATABASE_URL`.

## Requisitos
- Windows con PowerShell
- Python 3.9+
- Git
- Docker Desktop (opcional pero recomendado para PostgreSQL)

## Puesta en marcha (Windows)
1. Clonar el repo y entrar a la carpeta del proyecto:
   ```powershell
   git clone <URL_DEL_REPOSITORIO>
   cd ServiHogar\Proyecto
   ```
2. Crear entorno virtual e instalar dependencias:
   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -U pip
   python -m pip install -r requirements.txt
   ```
3. Crear un archivo `.env` a partir de `.env.example`:
   - Si usarás PostgreSQL con Docker, define:
     ```
     DATABASE_URL=postgres://postgres:postgres@localhost:5432/servihogar
     ```
   - Si no defines `DATABASE_URL`, se usará SQLite (`db.sqlite3`).
4. (Opcional) Levantar PostgreSQL con Docker:
   ```powershell
   docker compose up -d
   ```
5. Migraciones y servidor:
   ```powershell
   python manage.py migrate
   python manage.py runserver
   ```
6. (Opcional) Crear superusuario:
   ```powershell
   python manage.py createsuperuser
   ```

## Flujo de trabajo con Git (recomendado)
- Rama base: acuerden cuál es (por ejemplo `main` o `Tophercillo`).
- Para cada tarea/feature/bug:
  1. Crear una rama desde la base: `git checkout -b feature/nombre-corto`.
  2. Commits pequeños y claros.
  3. Abrir Pull Request hacia la rama base y pedir revisión.
  4. Hacer squash/merge cuando esté aprobado.
- Actualizar tu rama frecuentemente con `git pull --rebase` para minimizar conflictos.
- No subas archivos locales o secretos (respeta `.gitignore`).

## Base de datos y datos de desarrollo
- En desarrollo, se recomienda Docker (ver `docker-compose.yml`). Usa un volumen **nombrado** `pgdata` para mejor rendimiento en Windows.
- No se suben datos de la base (volúmenes/archivos de datos) al repo.
- Para compartir datos de prueba, usen fixtures JSON:
  ```powershell
  # Exportar desde tu entorno (si usas SQLite o Postgres):
  python manage.py dumpdata --natural-primary --natural-foreign --indent 2 > data.json
  # El otro desarrollador importa en su entorno:
  python manage.py loaddata data.json
  ```

## Migraciones
- Cuando cambies modelos, genera migraciones y súbelas:
  ```powershell
  python manage.py makemigrations
  python manage.py migrate
  git add app\migrations\*  # ajusta la ruta según tu app
  git commit -m "Add migrations for <cambio>"
  ```
- Evita editar migraciones a mano.
- Si hay conflictos de migraciones, coordinen quién rehace `makemigrations` y resuelve el orden.

## Variables de entorno y secretos
- No subas `.env` ni secretos. Usa `.env.example` como plantilla.
- En CI/CD (futuro), usa secretos del sistema (GitHub Actions Secrets, etc.).

## Comandos útiles
```powershell
# Activar entorno
.\.venv\Scripts\Activate.ps1

# Migrar y correr
python manage.py migrate
python manage.py runserver

# Levantar Postgres local
docker compose up -d

# Apagar servicios Docker
docker compose down
```

## Solución de problemas
- "django-admin no se reconoce": activa el entorno o usa `python manage.py`.
- "No se encuentra manage.py": asegúrate de estar en `ServiHogar\Proyecto`.
- Conexión a Postgres falla: verifica `DATABASE_URL`, que `docker compose up -d` esté activo y el puerto 5432 libre.

---
Cualquier mejora (scripts de backup/restore de DB, linters, pre-commit, etc.) se pueden agregar cuando el equipo lo necesite.

## Autenticación (API)
- Registro: POST `/api/auth/register/` => devuelve `{ user, access, refresh }`
- Login: POST `/api/auth/login/` con `{ username: email, password }` => `{ access, refresh }`
- Yo: GET `/api/auth/me/` con `Authorization: Bearer <access>` => datos del usuario + perfil

