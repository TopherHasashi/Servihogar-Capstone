import re

path = "t:/Github/ServiHogar/Fase 2/Evidencias Proyecto/Proyecto/api/views.py"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. SELECTs
code = code.replace("sp.duracion_maxima_minutos, sp.precio_fijo, sp.estado_verificacion,\n",
                    "sp.duracion_maxima_minutos, sp.precio_fijo,\n(SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = sp.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) AS estado_verificacion,\n")

code = code.replace("SELECT estado_verificacion, lower(coalesce(tipo_duracion,'')) AS tipo,",
                    "SELECT (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) AS estado_verificacion, lower(coalesce(tipo_duracion,'')) AS tipo,")

code = code.replace("SELECT estado_verificacion FROM servicio_profesional",
                    "SELECT (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) FROM servicio_profesional")

code = code.replace("sp.id_servicio_profesional, sp.estado_verificacion, cs.nombre",
                    "sp.id_servicio_profesional, (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = sp.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) AS estado_verificacion, cs.nombre")

# 2. WHEREs
code = code.replace("sp.estado_verificacion = 'pendiente'",
                    "'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = sp.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)")

code = code.replace("sp.estado_verificacion = 'aprobado'",
                    "'aprobado' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = sp.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)")

code = code.replace("estado_verificacion = 'pendiente'",
                    "'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)")

# Special fix for COUNTs
code = code.replace("COUNT(CASE WHEN 'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) THEN 1 END) as pendientes,\n\t\t\t\t\t\tCOUNT(CASE WHEN estado_verificacion = 'aprobado' THEN 1 END) as aprobados,\n\t\t\t\t\t\tCOUNT(CASE WHEN estado_verificacion = 'rechazado' THEN 1 END) as rechazados,\n\t\t\t\t\t\tCOUNT(CASE WHEN estado_verificacion = 'suspendido' THEN 1 END) as suspendidos",
                    "COUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'pendiente' THEN 1 END) as pendientes,\n\t\t\t\t\t\tCOUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'aprobado' THEN 1 END) as aprobados,\n\t\t\t\t\t\tCOUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'rechazado' THEN 1 END) as rechazados,\n\t\t\t\t\t\tCOUNT(CASE WHEN (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) = 'suspendido' THEN 1 END) as suspendidos")

# 3. INSERT
code = code.replace("""						duracion_minima_minutos, duracion_maxima_minutos, precio_fijo,
						estado_verificacion, creado_en, actualizado_en
					) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pendiente',%s,%s)
					\"\"\",
					[
						str(id_serv), dom.rut, str(id_cat), str(exp_int), description,
						db_duration, int(dur_fija), int(dur_min), int(dur_max), int(price_fixed),
						now, now,
					],
				)""", """						duracion_minima_minutos, duracion_maxima_minutos, precio_fijo,
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

# 4. UPDATES (verify_service and toggle route)
code = code.replace("""					UPDATE servicio_profesional
					SET estado_verificacion = 'aprobado', rut_verificador = %s, verificado_en = %s
					WHERE id_servicio_profesional = %s AND 'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)
					\"\"\",
					[rut_ver, now, servicio_id]""", """					UPDATE servicio_profesional
					SET rut_verificador = %s, verificado_en = %s
					WHERE id_servicio_profesional = %s AND 'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)
					\"\"\",
					[rut_ver, now, servicio_id]
				)
				cur.execute("INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre='aprobado'", [servicio_id, now])""")

code = code.replace("""					UPDATE servicio_profesional
					SET estado_verificacion = 'rechazado', rut_verificador = %s, verificado_en = %s, razon_rechazo = %s
					WHERE id_servicio_profesional = %s AND 'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)
					\"\"\",
					[rut_ver, now, reason, servicio_id]""", """					UPDATE servicio_profesional
					SET rut_verificador = %s, verificado_en = %s, razon_rechazo = %s
					WHERE id_servicio_profesional = %s AND 'pendiente' = (SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = servicio_profesional.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1)
					\"\"\",
					[rut_ver, now, reason, servicio_id]
				)
				cur.execute("INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre='rechazado'", [servicio_id, now])""")

code = code.replace("""				cur.execute(
					"UPDATE servicio_profesional SET estado_verificacion=%s, actualizado_en=%s WHERE id_servicio_profesional=%s",
					[target_status, now, service_id_str]
				)""", """				cur.execute(
					"UPDATE servicio_profesional SET actualizado_en=%s WHERE id_servicio_profesional=%s",
					[now, service_id_str]
				)
				cur.execute("INSERT INTO historial_estado_verificacion_servicio (id_servicio_profesional, id_estado_verificacion_servicio, cambiado_en) SELECT %s, id_estado_verificacion_servicio, %s FROM estado_verificacion_servicio WHERE nombre=%s", [service_id_str, now, target_status])""")


with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print("Replacement complete.")
