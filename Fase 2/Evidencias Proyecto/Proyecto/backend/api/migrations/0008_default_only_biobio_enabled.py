from django.db import migrations, connection


def _get_biobio_region_ids(cur):
    try:
        cur.execute(
            """
            SELECT id_region FROM region
            WHERE unaccent(lower(nombre)) LIKE '%%biobio%%'
               OR lower(nombre) LIKE '%%biobio%%'
               OR codigo IN ('VIII', '08', '8')
            """
        )
        return [row[0] for row in cur.fetchall()]
    except Exception:
        cur.execute(
            """
            SELECT id_region FROM region
            WHERE lower(nombre) LIKE '%%biob%%'
               OR codigo IN ('VIII', '08', '8')
            """
        )
        return [row[0] for row in cur.fetchall()]


def enable_only_biobio(apps, schema_editor):
    with connection.cursor() as cur:
        biobio_ids = _get_biobio_region_ids(cur)

        # Por defecto ninguna región/comuna está disponible, salvo Biobío,
        # que se habilita de fábrica. El resto se va agregando de a una desde
        # el panel de administración (Centro de Operaciones).
        cur.execute("UPDATE region SET disponible = FALSE")
        cur.execute("UPDATE comuna SET disponible = FALSE")

        if biobio_ids:
            cur.execute(
                "UPDATE region SET disponible = TRUE WHERE id_region = ANY(%s)",
                [biobio_ids],
            )
            cur.execute(
                "UPDATE comuna SET disponible = TRUE WHERE id_region = ANY(%s)",
                [biobio_ids],
            )

        # Los nuevos registros futuros deben nacer deshabilitados por defecto;
        # se habilitan explícitamente al "agregar" la región desde el panel.
        try:
            cur.execute("ALTER TABLE region ALTER COLUMN disponible SET DEFAULT FALSE")
            cur.execute("ALTER TABLE comuna ALTER COLUMN disponible SET DEFAULT FALSE")
        except Exception:
            pass


def enable_all_regions(apps, schema_editor):
    with connection.cursor() as cur:
        cur.execute("UPDATE region SET disponible = TRUE")
        cur.execute("UPDATE comuna SET disponible = TRUE")
        try:
            cur.execute("ALTER TABLE region ALTER COLUMN disponible SET DEFAULT TRUE")
            cur.execute("ALTER TABLE comuna ALTER COLUMN disponible SET DEFAULT TRUE")
        except Exception:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_region_comuna_disponible'),
    ]

    operations = [
        migrations.RunPython(enable_only_biobio, enable_all_regions),
    ]
