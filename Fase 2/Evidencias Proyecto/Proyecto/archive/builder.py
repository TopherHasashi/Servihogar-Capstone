import os

filepath = 't:/Github/ServiHogar/Fase 2/Evidencias Proyecto/Proyecto/api/views.py'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update SELECTs
text = text.replace(
    "sp.duracion_maxima_minutos, sp.precio_fijo, sp.estado_verificacion,", 
    "sp.duracion_maxima_minutos, sp.precio_fijo,\n(SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = sp.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) AS estado_verificacion,"
)

# 2. Update service creation
old_create = """                                        INSERT INTO servicio_profesional (
                                                id_servicio_profesional, rut_usuario, id_categoria_servicio,
                                                anos_experiencia, descripcion, tipo_duracion, duracion_fija_minutos,
                                                duracion_minima_minutos, duracion_maxima_minutos, precio_fijo,
                                                estado_verificacion, creado_en, actualizado_en
                                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pendiente',%s,%s)
                                        """,
                                        [
                                                str(id_serv), dom.rut, str(id_cat), str(exp_int), description,
                                                db_duration, int(dur_fija), int(dur_min), int(dur_max), int(price_fixed),
                                                now, now,
                                        ],
"""
new_create = """                                        INSERT INTO servicio_profesional (
                                                id_servicio_profesional, rut_usuario, id_categoria_servicio,
                                                anos_experiencia, descripcion, tipo_duracion, duracion_fija_minutos,
                                                duracion_minima_minutos, duracion_maxima_minutos, precio_fijo,
                                                creado_en, actualizado_en
                                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                                        """,
                                        [
                                                str(id_serv), dom.rut, str(id_cat), str(exp_int), description,
                                                db_duration, int(dur_fija), int(dur_min), int(dur_max), int(price_fixed),
                                                now, now,
                                        ],
                                )
                                cur.execute("INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre='pendiente'", [str(id_serv), now])
"""
# Note we need to adjust the replacement. Let's do it with regex to be safer.
text = text.replace(
    "estado_verificacion, creado_en, actualizado_en\n                                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pendiente',%s,%s)",
    "creado_en, actualizado_en\n                                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
)

text = text.replace(
    "                                        ],",
    "                                        ],"
)
# wait, better to replace the whole execute call.
old_exec = """				try:
			with connection.cursor() as cur:
				cur.execute(
					\"\"\"
					INSERT INTO servicio_profesional (
						id_servicio_profesional, rut_usuario, id_categoria_servicio,
						anos_experiencia, descripcion, tipo_duracion, duracion_fija_minutos,
						duracion_minima_minutos, duracion_maxima_minutos, precio_fijo,
						estado_verificacion, creado_en, actualizado_en
					) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pendiente',%s,%s)
					\"\"\",
					[
						str(id_serv), dom.rut, str(id_cat), str(exp_int), description,
						db_duration, int(dur_fija), int(dur_min), int(dur_max), int(price_fixed),
						now, now,
					],
				)"""

new_exec = """				try:
			with connection.cursor() as cur:
				cur.execute(
					\"\"\"
					INSERT INTO servicio_profesional (
						id_servicio_profesional, rut_usuario, id_categoria_servicio,
						anos_experiencia, descripcion, tipo_duracion, duracion_fija_minutos,
						duracion_minima_minutos, duracion_maxima_minutos, precio_fijo,
						creado_en, actualizado_en
					) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
					\"\"\",
					[
						str(id_serv), dom.rut, str(id_cat), str(exp_int), description,
						db_duration, int(dur_fija), int(dur_min), int(dur_max), int(price_fixed),
						now, now,
					],
				)
				cur.execute("INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre='pendiente'", [str(id_serv), now])"""

text = text.replace("""					INSERT INTO servicio_profesional (
						id_servicio_profesional, rut_usuario, id_categoria_servicio,
						anos_experiencia, descripcion, tipo_duracion, duracion_fija_minutos,
						duracion_minima_minutos, duracion_maxima_minutos, precio_fijo,
						estado_verificacion, creado_en, actualizado_en
					) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pendiente',%s,%s)
					\"\"\",
					[
						str(id_serv), dom.rut, str(id_cat), str(exp_int), description,
						db_duration, int(dur_fija), int(dur_min), int(dur_max), int(price_fixed),
						now, now,
					],
				)""", """					INSERT INTO servicio_profesional (
						id_servicio_profesional, rut_usuario, id_categoria_servicio,
						anos_experiencia, descripcion, tipo_duracion, duracion_fija_minutos,
						duracion_minima_minutos, duracion_maxima_minutos, precio_fijo,
						creado_en, actualizado_en
					) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
					\"\"\",
					[
						str(id_serv), dom.rut, str(id_cat), str(exp_int), description,
						db_duration, int(dur_fija), int(dur_min), int(dur_max), int(price_fixed),
						now, now,
					],
				)
				cur.execute("INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre='pendiente'", [str(id_serv), now])""")

# 3. SELECT ... WHERE sp.estado_verificacion = 'pendiente'
text = text.replace("sp.estado_verificacion = 'pendiente'", "'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = sp.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)")

# 4. Same for 'aprobado'
text = text.replace("sp.estado_verificacion = 'aprobado'", "'aprobado' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = sp.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)")

# 5. SELECT COUNT(...) in dashboard admin
text = text.replace(
    "COUNT(CASE WHEN estado_verificacion = 'pendiente' THEN 1 END) as pendientes, "
    "COUNT(CASE WHEN estado_verificacion = 'aprobado' THEN 1 END) as aprobados, "
    "COUNT(CASE WHEN estado_verificacion = 'rechazado' THEN 1 END) as rechazados, "
    "COUNT(CASE WHEN estado_verificacion = 'suspendido' THEN 1 END) as suspendidos",
    "COUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'pendiente' THEN 1 END) as pendientes,\n"
    "COUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'aprobado' THEN 1 END) as aprobados,\n"
    "COUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'rechazado' THEN 1 END) as rechazados,\n"
    "COUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'suspendido' THEN 1 END) as suspendidos"
)

# 6. UPDATE statements
text = text.replace(
    "UPDATE servicio_profesional SET estado_verificacion = 'aprobado', rut_verificador = %s, verificado_en = %s\n							WHERE id_servicio_profesional = %s AND estado_verificacion = 'pendiente'",
    "UPDATE servicio_profesional SET rut_verificador = %s, verificado_en = %s WHERE id_servicio_profesional = %s; INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre='aprobado'"
)
# Wait! In the UPDATE execute args, there are arguments passing !
# Let's do a more robust string replacement manually for the approve/reject methods.

with open('t:/Github/ServiHogar/Fase 2/Evidencias Proyecto/Proyecto/patch.py', 'w', encoding='utf-8') as f:
    f.write(text)
