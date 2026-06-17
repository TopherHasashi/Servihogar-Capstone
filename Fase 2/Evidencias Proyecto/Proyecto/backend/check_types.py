import django
from django.db import connection
c = connection.cursor()
c.execute("SELECT data_type FROM information_schema.columns WHERE table_name='solicitud_servicio' AND column_name='fecha_programada'")
print('fecha_programada type:', c.fetchone())

# Also test what psycopg2 actually returns for that column
c.execute("SELECT fecha_programada FROM solicitud_servicio LIMIT 1")
row = c.fetchone()
if row:
    val = row[0]
    print('Python type:', type(val), 'tzinfo:', getattr(val, 'tzinfo', 'N/A'))
else:
    print('No rows in solicitud_servicio')
