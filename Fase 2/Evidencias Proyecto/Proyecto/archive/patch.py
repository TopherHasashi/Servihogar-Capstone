import re

filepath = 't:/Github/ServiHogar/Fase 2/Evidencias Proyecto/Proyecto/api/views.py'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. SELECT sp.estado_verificacion -> subquery
select_repl = "(SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = sp.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) AS estado_verificacion"
text = re.sub(r'sp\.estado_verificacion(?!\s*=)', select_repl, text)

# Also fix the solo "estado_verificacion" in select
select_solo = "(SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)"
# Care must be taken not to override "estado_verificacion" in SET or WHERE or other places
# Let's inspect where it appears:

# Line 1575-1578
# COUNT(CASE WHEN estado_verificacion = 'pendiente' THEN 1 END) as pendientes,
count_repl = r"COUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = foo) = '\1' THEN 1 END)"
# We need to replace it carefully

# It's safer if I just write manual patches for the exact lines
