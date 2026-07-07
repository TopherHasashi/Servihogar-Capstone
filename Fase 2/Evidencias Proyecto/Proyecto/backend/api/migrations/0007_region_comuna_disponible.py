from django.db import migrations, connection


def _column_exists(table_name: str, column_name: str) -> bool:
    with connection.cursor() as cur:
        try:
            cur.execute(
                "SELECT 1 FROM information_schema.columns WHERE table_name = %s AND column_name = %s",
                [table_name, column_name],
            )
            return cur.fetchone() is not None
        except Exception:
            pass
        try:
            cur.execute(f"PRAGMA table_info({table_name})")
            return any(row[1] == column_name for row in cur.fetchall())
        except Exception:
            return False


def add_disponible_columns(apps, schema_editor):
    with connection.cursor() as cur:
        if not _column_exists("region", "disponible"):
            cur.execute("ALTER TABLE region ADD COLUMN disponible BOOLEAN NOT NULL DEFAULT TRUE")
        if not _column_exists("comuna", "disponible"):
            cur.execute("ALTER TABLE comuna ADD COLUMN disponible BOOLEAN NOT NULL DEFAULT TRUE")


def remove_disponible_columns(apps, schema_editor):
    with connection.cursor() as cur:
        try:
            cur.execute("ALTER TABLE region DROP COLUMN disponible")
        except Exception:
            pass
        try:
            cur.execute("ALTER TABLE comuna DROP COLUMN disponible")
        except Exception:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_notification'),
    ]

    operations = [
        migrations.RunPython(add_disponible_columns, remove_disponible_columns),
    ]
