from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import connection, transaction
from django.utils import timezone

from api.models import Profile

ADMIN_EMAIL = "admin@servihogar.cl"
ADMIN_PASSWORD = "Admin2025!ServiHogar"

VERIF_EMAIL = "verificador@servihogar.cl"
VERIF_PASSWORD = "Verifier2025!ServiHogar"

# Datos por defecto para la tabla dominio.usuario (campos NOT NULL)
DEFAULT_PHONE = "+56900000000"
DEFAULT_ADDRESS = "N/A"
DEFAULT_BIRTH = "1985-01-01 00:00:00"

class Command(BaseCommand):
    help = "Crea cuentas por defecto: admin y verificador, y sus filas en dominio.usuario"

    def add_arguments(self, parser):
        parser.add_argument("--reset-passwords", action="store_true", help="Forzar asignación de contraseñas aun si las cuentas existen")

    def handle(self, *args, **options):
        reset_pw = options.get("reset_passwords", False)

        self.stdout.write(self.style.MIGRATE_HEADING("Seeding cuentas por defecto (admin/verificador)..."))

        # 1) Buscar una comuna válida para cumplir el NOT NULL de usuario.id_comuna
        with connection.cursor() as cur:
            cur.execute("SELECT id_comuna, nombre FROM comuna ORDER BY nombre LIMIT 1")
            row = cur.fetchone()
            if not row:
                self.stderr.write(self.style.ERROR("No hay comunas en la base de datos. Inserta comunas antes de crear cuentas."))
                return
            comuna_id, comuna_nombre = row[0], row[1]

        now = timezone.now()

        # 2) Crear/actualizar Django auth users + perfiles
        # Admin (staff y superuser)
        admin_user, created_admin = User.objects.get_or_create(username=ADMIN_EMAIL, defaults={
            "email": ADMIN_EMAIL,
            "first_name": "Admin",
            "last_name": "ServiHogar",
            "is_staff": True,
            "is_superuser": True,
        })
        if created_admin or reset_pw:
            admin_user.set_password(ADMIN_PASSWORD)
        # Asegurar flags
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.email = ADMIN_EMAIL
        admin_user.save()
        Profile.objects.get_or_create(user=admin_user, defaults={
            "role": "cliente",  # El rol efectivo de admin se toma desde is_staff/superuser en el backend
        })

        # Verificador (usuario normal con rol 'verificador')
        verif_user, created_ver = User.objects.get_or_create(username=VERIF_EMAIL, defaults={
            "email": VERIF_EMAIL,
            "first_name": "Verificador",
            "last_name": "ServiHogar",
            "is_staff": False,
            "is_superuser": False,
        })
        if created_ver or reset_pw:
            verif_user.set_password(VERIF_PASSWORD)
        verif_user.email = VERIF_EMAIL
        verif_user.save()
        prof, _ = Profile.objects.get_or_create(user=verif_user, defaults={
            "role": "verificador",
        })
        if prof.role != "verificador":
            prof.role = "verificador"
            prof.save(update_fields=["role"])

        # 3) Upsert a dominio.usuario para ambos (RUT y datos mínimos)
        def upsert_usuario(rut: str, nombres: str, apellidos: str, email: str):
            with connection.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO usuario (
                        rut, nombres, apellidos, email, telefono,
                        fecha_nacimiento, id_comuna, direccion,
                        creado_en, actualizado_en
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (rut) DO UPDATE SET
                        nombres=EXCLUDED.nombres,
                        apellidos=EXCLUDED.apellidos,
                        email=EXCLUDED.email,
                        telefono=EXCLUDED.telefono,
                        fecha_nacimiento=EXCLUDED.fecha_nacimiento,
                        id_comuna=EXCLUDED.id_comuna,
                        direccion=EXCLUDED.direccion,
                        actualizado_en=EXCLUDED.actualizado_en
                    """,
                    [
                        rut, nombres, apellidos, email, DEFAULT_PHONE,
                        DEFAULT_BIRTH, str(comuna_id), DEFAULT_ADDRESS,
                        now, now,
                    ],
                )

        def upsert_historial_genero(rut: str, genero: str):
            with connection.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO historial_genero_usuario (rut_usuario, id_genero, cambiado_en)
                    SELECT %s, g.id_genero, %s
                    FROM genero g
                    WHERE g.nombre = %s
                    """,
                    [rut, now, genero],
                )

        def upsert_historial_rol(rut: str, rol: str):
            with connection.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO historial_rol_usuario (rut_usuario, id_rol, cambiado_en)
                    SELECT %s, r.id_rol, %s
                    FROM rol r
                    WHERE r.nombre = %s
                    """,
                    [rut, now, rol],
                )

        with transaction.atomic():
            upsert_usuario("11.111.111-1", "Admin", "ServiHogar", ADMIN_EMAIL)
            upsert_usuario("22.222.222-2", "Verificador", "ServiHogar", VERIF_EMAIL)
            upsert_historial_genero("11.111.111-1", "no_binario")
            upsert_historial_genero("22.222.222-2", "no_binario")
            upsert_historial_rol("11.111.111-1", "administrador")
            upsert_historial_rol("22.222.222-2", "verificador")

        self.stdout.write(self.style.SUCCESS("Cuentas creadas/actualizadas correctamente:"))
        self.stdout.write(f"  - Admin: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        self.stdout.write(f"  - Verificador: {VERIF_EMAIL} / {VERIF_PASSWORD}")
