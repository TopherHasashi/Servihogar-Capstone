import re

path = "t:/Github/ServiHogar/Fase 2/Evidencias Proyecto/Proyecto/api/views.py"
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("sp.precio_fijo,\n\t\t\t\t\tsp.estado_verificacion,\n\t\t\t\t\tsp.habilitado,\n\t\t\t\t\tsp.disponible",
                    "sp.precio_fijo,\n\t\t\t\t\t(SELECT evs.nombre FROM historial_estado_verificacion_servicio h JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio WHERE h.id_servicio_profesional = sp.id_servicio_profesional ORDER BY h.cambiado_en DESC LIMIT 1) AS estado_verificacion,\n\t\t\t\t\tsp.habilitado,\n\t\t\t\t\tsp.disponible")

with open(path, "w", encoding="utf-8") as f:
    f.write(code)

print("Done")