import re

path = "t:/Github/ServiHogar/Fase 2/Evidencias Proyecto/Proyecto/api/views.py"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# Fix approve
code = re.sub(
    r"UPDATE servicio_profesional\s+SET estado_verificacion = 'aprobado', rut_verificador = %s, verificado_en = %s\s+WHERE id_servicio_profesional = %s AND 'pendiente' = \(SELECT evs\.nombre",
    r"UPDATE servicio_profesional\n                                SET rut_verificador = %s, verificado_en = %s\n                                WHERE id_servicio_profesional = %s AND 'pendiente' = (SELECT evs.nombre",
    code
)
# And then add the INSERT
# Actually it's easier to find the execute call and replace it.
import textwrap

code = re.sub(
    r"(\s*)cur\.execute\(\s*\"\"\"\s*UPDATE servicio_profesional\s*SET rut_verificador = %s, verificado_en = %s\s*WHERE id_servicio_profesional = %s AND 'pendiente' = \(SELECT evs\.nombre[^\"]*\"\"\",\s*\[rut_ver, now, servicio_id\],\s*\)",
    r"""\1cur.execute(
\1	\"\"\"
\1	UPDATE servicio_profesional
\1	SET rut_verificador = %s, verificado_en = %s
\1	WHERE id_servicio_profesional = %s AND 'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)
\1	\"\"\",
\1	[rut_ver, now, servicio_id],
\1)
\1cur.execute("INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre='aprobado'", [servicio_id, now])""",
    code
)

# Reject
code = re.sub(
    r"UPDATE servicio_profesional\s+SET estado_verificacion = 'rechazado', rut_verificador = %s, verificado_en = %s, razon_rechazo = %s\s+WHERE id_servicio_profesional = %s AND 'pendiente'",
    r"UPDATE servicio_profesional\n                                SET rut_verificador = %s, verificado_en = %s, razon_rechazo = %s\n                                WHERE id_servicio_profesional = %s AND 'pendiente'",
    code
)
code = re.sub(
    r"(\s*)cur\.execute\(\s*\"\"\"\s*UPDATE servicio_profesional\s*SET rut_verificador = %s, verificado_en = %s, razon_rechazo = %s\s*WHERE id_servicio_profesional = %s AND 'pendiente' = \(SELECT evs\.nombre[^\"]*\"\"\",\s*\[rut_ver, now, reason, servicio_id\],\s*\)",
    r"""\1cur.execute(
\1	\"\"\"
\1	UPDATE servicio_profesional
\1	SET rut_verificador = %s, verificado_en = %s, razon_rechazo = %s
\1	WHERE id_servicio_profesional = %s AND 'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)
\1	\"\"\",
\1	[rut_ver, now, reason, servicio_id],
\1)
\1cur.execute("INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre='rechazado'", [servicio_id, now])""",
    code
)


# Statistics
code = re.sub(
    r"COUNT\(CASE WHEN estado_verificacion = 'aprobado' THEN 1 END\) as aprobados",
    r"COUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'aprobado' THEN 1 END) as aprobados",
    code
)

code = re.sub(
    r"COUNT\(CASE WHEN estado_verificacion = 'rechazado' THEN 1 END\) as rechazados",
    r"COUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'rechazado' THEN 1 END) as rechazados",
    code
)

code = re.sub(
    r"COUNT\(CASE WHEN estado_verificacion = 'suspendido' THEN 1 END\) as suspendidos",
    r"COUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'suspendido' THEN 1 END) as suspendidos",
    code
)

# And now check toggle_service_status
code = re.sub(
    r"cur\.execute\(\s*\"UPDATE servicio_profesional SET estado_verificacion=%s, actualizado_en=%s WHERE id_servicio_profesional=%s\",\s*\[target_status, now, service_id_str\]\s*\)",
    r"""cur.execute(
					"UPDATE servicio_profesional SET actualizado_en=%s WHERE id_servicio_profesional=%s",
					[now, service_id_str]
				)
				cur.execute("INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre=%s", [service_id_str, now, target_status])""",
    code
)


with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print("Done")