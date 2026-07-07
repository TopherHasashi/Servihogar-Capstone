"""
Endpoints para gestión de configuración del sistema.
Solo accesible por administradores.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import connection
from django.utils import timezone
import logging
from .permission_utils import get_user_role_by_email

logger = logging.getLogger(__name__)


def _table_exists(cur, table_name: str) -> bool:
	try:
		cur.execute(
			"SELECT 1 FROM information_schema.tables WHERE table_name = %s",
			[table_name],
		)
		return cur.fetchone() is not None
	except Exception:
		try:
			cur.execute(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name = %s",
				[table_name],
			)
			return cur.fetchone() is not None
		except Exception:
			return False


def _default_config_payload():
	return {
		"comision_plataforma": {
			"valor": 5,
			"tipo_dato": "number",
			"descripcion": "Comision de plataforma por servicio"
		},
		"precio_minimo_servicio": {
			"valor": 10000,
			"tipo_dato": "number",
			"descripcion": "Precio minimo permitido"
		},
		"precio_maximo_servicio": {
			"valor": 500000,
			"tipo_dato": "number",
			"descripcion": "Precio maximo permitido"
		},
		"auto_aprobar_verificados": {
			"valor": False,
			"tipo_dato": "boolean",
			"descripcion": "Aprobacion automatica de verificados"
		},
		"requerir_documentos": {
			"valor": True,
			"tipo_dato": "boolean",
			"descripcion": "Documentacion obligatoria"
		},
		"modo_mantenimiento": {
			"valor": False,
			"tipo_dato": "boolean",
			"descripcion": "Modo mantenimiento"
		},
		"__meta": {
			"readOnly": True,
			"message": "Configuracion no disponible en este esquema"
		}
	}


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_system_config(request):
	"""
	Obtiene toda la configuración del sistema.
	Solo accesible por administradores.
	"""
	try:
		# Verificar que el usuario es administrador
		with connection.cursor() as cur:
			role = get_user_role_by_email(cur, request.user.email)
			if role != 'administrador':
				return Response(
					{"message": "No tienes permisos para acceder a este recurso"},
					status=status.HTTP_403_FORBIDDEN
				)
			
			if not _table_exists(cur, "configuracion_sistema"):
				return Response(_default_config_payload())
			
			# Obtener toda la configuración
			cur.execute(
				"""
				SELECT clave, valor, tipo_dato, descripcion, actualizado_en, actualizado_por
				FROM configuracion_sistema
				ORDER BY clave
				"""
			)
			
			config = {}
			for row in cur.fetchall():
				clave = row[0]
				valor = row[1]
				tipo_dato = row[2]
				
				# Convertir el valor según el tipo de dato
				if tipo_dato == 'number':
					valor = float(valor) if '.' in valor else int(valor)
				elif tipo_dato == 'boolean':
					valor = valor.lower() in ('true', '1', 'yes')
				
				config[clave] = {
					'valor': valor,
					'tipo_dato': tipo_dato,
					'descripcion': row[3],
					'actualizado_en': row[4].isoformat() if row[4] else None,
					'actualizado_por': row[5]
				}
			
			return Response(config)
			
	except Exception as e:
		logger.exception("Error obteniendo configuración del sistema")
		return Response(
			{"message": "Error obteniendo configuración", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_system_config(request):
	"""
	Actualiza la configuración del sistema.
	Solo accesible por administradores.
	"""
	try:
		# Verificar que el usuario es administrador
		with connection.cursor() as cur:
			role = get_user_role_by_email(cur, request.user.email)
			if role != 'administrador':
				return Response(
					{"message": "No tienes permisos para acceder a este recurso"},
					status=status.HTTP_403_FORBIDDEN
				)
			
			if not _table_exists(cur, "configuracion_sistema"):
				return Response(
					{"message": "Configuracion no disponible en este esquema"},
					status=status.HTTP_503_SERVICE_UNAVAILABLE
				)
			
			data = request.data
			updated_count = 0
			
			for clave, nuevo_valor in data.items():
				# Verificar que la clave existe
				cur.execute(
					"SELECT tipo_dato FROM configuracion_sistema WHERE clave = %s",
					[clave]
				)
				config_row = cur.fetchone()
				
				if not config_row:
					continue  # Ignorar claves que no existen
				
				tipo_dato = config_row[0]
				
				# Convertir el valor al formato string para almacenar
				if tipo_dato == 'boolean':
					valor_str = 'true' if nuevo_valor else 'false'
				else:
					valor_str = str(nuevo_valor)
				
				# Actualizar configuración
				cur.execute(
					"""
					UPDATE configuracion_sistema
					SET valor = %s, actualizado_en = %s, actualizado_por = %s
					WHERE clave = %s
					""",
					[valor_str, timezone.now(), request.user.email, clave]
				)
				updated_count += 1
			
			return Response({
				"message": f"Configuración actualizada exitosamente. {updated_count} valores modificados.",
				"updated_count": updated_count
			})
			
	except Exception as e:
		logger.exception("Error actualizando configuración del sistema")
		return Response(
			{"message": "Error actualizando configuración", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_config_value(request, clave):
	"""
	Obtiene un valor específico de configuración.
	Solo accesible por administradores.
	"""
	try:
		# Verificar que el usuario es administrador
		with connection.cursor() as cur:
			role = get_user_role_by_email(cur, request.user.email)
			if role != 'administrador':
				return Response(
					{"message": "No tienes permisos para acceder a este recurso"},
					status=status.HTTP_403_FORBIDDEN
				)
			
			if not _table_exists(cur, "configuracion_sistema"):
				return Response(
					{"message": "Configuracion no disponible en este esquema"},
					status=status.HTTP_503_SERVICE_UNAVAILABLE
				)
			
			# Obtener el valor
			cur.execute(
				"SELECT valor, tipo_dato FROM configuracion_sistema WHERE clave = %s",
				[clave]
			)
			row = cur.fetchone()
			
			if not row:
				return Response(
					{"message": "Clave de configuración no encontrada"},
					status=status.HTTP_404_NOT_FOUND
				)
			
			valor = row[0]
			tipo_dato = row[1]
			
			# Convertir según tipo
			if tipo_dato == 'number':
				valor = float(valor) if '.' in valor else int(valor)
			elif tipo_dato == 'boolean':
				valor = valor.lower() in ('true', '1', 'yes')
			
			return Response({
				'clave': clave,
				'valor': valor,
				'tipo_dato': tipo_dato
			})
			
	except Exception as e:
		logger.exception(f"Error obteniendo configuración {clave}")
		return Response(
			{"message": "Error obteniendo valor de configuración", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


def _require_admin(cur, request):
	"""Verifica que el usuario autenticado sea administrador.
	Retorna None si es administrador, o una Response de error en caso contrario."""
	role = get_user_role_by_email(cur, request.user.email)
	if role != 'administrador':
		return Response(
			{"message": "No tienes permisos para acceder a este recurso"},
			status=status.HTTP_403_FORBIDDEN
		)
	return None


# ═══════════════════════════════════════════════════════════════════════════
# GESTIÓN DE COBERTURA GEOGRÁFICA (regiones y comunas disponibles)
# Afecta el registro de usuarios y el filtro de búsqueda de servicios.
# ═══════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_list_regions(request):
	"""Lista todas las regiones (habilitadas o no) con el conteo de comunas."""
	try:
		with connection.cursor() as cur:
			denied = _require_admin(cur, request)
			if denied:
				return denied

			cur.execute(
				"""
				SELECT r.id_region, r.nombre, r.codigo, COALESCE(r.disponible, TRUE) as disponible,
				       COUNT(c.id_comuna) as total_comunas,
				       COUNT(c.id_comuna) FILTER (WHERE COALESCE(c.disponible, TRUE) = TRUE) as comunas_disponibles
				FROM region r
				LEFT JOIN comuna c ON c.id_region = r.id_region
				GROUP BY r.id_region, r.nombre, r.codigo, r.disponible
				ORDER BY r.nombre
				"""
			)
			regions = [
				{
					'id': str(row[0]),
					'nombre': row[1],
					'codigo': row[2],
					'disponible': bool(row[3]),
					'total_comunas': row[4] or 0,
					'comunas_disponibles': row[5] or 0,
				}
				for row in cur.fetchall()
			]
			return Response(regions)
	except Exception as e:
		logger.exception("Error listando regiones")
		return Response(
			{"message": "Error listando regiones", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_enable_region(request, region_id):
	"""Agrega (habilita) una región completa junto con todas sus comunas.

	Esta es la única forma de incorporar una nueva región a la cobertura de
	ServiHogar: se agregan de a una. No existe una acción equivalente para
	deshabilitar una región completa; una vez agregada, solo sus comunas
	individuales pueden deshabilitarse (con la advertencia correspondiente)."""
	try:
		with connection.cursor() as cur:
			denied = _require_admin(cur, request)
			if denied:
				return denied

			cur.execute("SELECT id_region FROM region WHERE id_region = %s", [region_id])
			if not cur.fetchone():
				return Response({"message": "Región no encontrada"}, status=status.HTTP_404_NOT_FOUND)

			cur.execute("UPDATE region SET disponible = TRUE WHERE id_region = %s", [region_id])
			cur.execute("UPDATE comuna SET disponible = TRUE WHERE id_region = %s", [region_id])

			return Response({
				"message": "Región agregada exitosamente junto con todas sus comunas",
				"disponible": True
			})
	except Exception as e:
		logger.exception("Error actualizando región")
		return Response(
			{"message": "Error actualizando región", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_list_comunas(request, region_id):
	"""Lista todas las comunas de una región (habilitadas o no)."""
	try:
		with connection.cursor() as cur:
			denied = _require_admin(cur, request)
			if denied:
				return denied

			cur.execute(
				"""
				SELECT id_comuna, nombre, codigo, COALESCE(disponible, TRUE)
				FROM comuna
				WHERE id_region = %s
				ORDER BY nombre
				""",
				[region_id]
			)
			comunas = [
				{'id': str(row[0]), 'nombre': row[1], 'codigo': row[2], 'disponible': bool(row[3])}
				for row in cur.fetchall()
			]
			return Response(comunas)
	except Exception as e:
		logger.exception("Error listando comunas")
		return Response(
			{"message": "Error listando comunas", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def admin_toggle_comuna(request, comuna_id):
	"""Habilita/deshabilita una comuna puntualmente."""
	try:
		with connection.cursor() as cur:
			denied = _require_admin(cur, request)
			if denied:
				return denied

			cur.execute("SELECT id_comuna FROM comuna WHERE id_comuna = %s", [comuna_id])
			if not cur.fetchone():
				return Response({"message": "Comuna no encontrada"}, status=status.HTTP_404_NOT_FOUND)

			nuevo_estado = request.data.get('disponible')
			if nuevo_estado is None:
				cur.execute("SELECT COALESCE(disponible, TRUE) FROM comuna WHERE id_comuna = %s", [comuna_id])
				actual = cur.fetchone()[0]
				nuevo_estado = not bool(actual)
			elif isinstance(nuevo_estado, str):
				# Evita que strings como "false"/"0" se evalúen como verdaderos (bool("false") == True)
				nuevo_estado = nuevo_estado.strip().lower() in ('1', 'true', 'yes', 'si', 'sí')
			else:
				nuevo_estado = bool(nuevo_estado)

			cur.execute("UPDATE comuna SET disponible = %s WHERE id_comuna = %s", [bool(nuevo_estado), comuna_id])

			return Response({
				"message": f"Comuna {'habilitada' if nuevo_estado else 'deshabilitada'} exitosamente",
				"disponible": bool(nuevo_estado)
			})
	except Exception as e:
		logger.exception("Error actualizando comuna")
		return Response(
			{"message": "Error actualizando comuna", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


# ═══════════════════════════════════════════════════════════════════════════
# GESTIÓN DE CATEGORÍAS DE SERVICIO (crear y renombrar)
# ═══════════════════════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_list_categories(request):
	"""Lista todas las categorías de servicio con su detalle completo (para edición)."""
	try:
		with connection.cursor() as cur:
			denied = _require_admin(cur, request)
			if denied:
				return denied

			cur.execute(
				"""
				SELECT id_categoria_servicio, nombre, descripcion, descripcion_corta, creado_en
				FROM categoria_servicio
				ORDER BY nombre
				"""
			)
			categories = [
				{
					'id': str(row[0]),
					'nombre': row[1],
					'descripcion': row[2],
					'descripcion_corta': row[3],
					'creado_en': row[4].isoformat() if row[4] else None,
				}
				for row in cur.fetchall()
			]
			return Response(categories)
	except Exception as e:
		logger.exception("Error listando categorías")
		return Response(
			{"message": "Error listando categorías", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_create_category(request):
	"""Crea una nueva categoría de servicio."""
	try:
		with connection.cursor() as cur:
			denied = _require_admin(cur, request)
			if denied:
				return denied

			nombre = (request.data.get('nombre') or '').strip()
			descripcion = request.data.get('descripcion') or None
			descripcion_corta = request.data.get('descripcion_corta') or None

			if not nombre:
				return Response({"message": "El nombre de la categoría es obligatorio"}, status=status.HTTP_400_BAD_REQUEST)

			if len(nombre) > 50:
				return Response({"message": "El nombre de la categoría no puede superar los 50 caracteres"}, status=status.HTTP_400_BAD_REQUEST)

			cur.execute("SELECT 1 FROM categoria_servicio WHERE lower(nombre) = lower(%s)", [nombre])
			if cur.fetchone():
				return Response({"message": "Ya existe una categoría con ese nombre"}, status=status.HTTP_409_CONFLICT)

			cur.execute(
				"""
				INSERT INTO categoria_servicio (nombre, descripcion, descripcion_corta)
				VALUES (%s, %s, %s)
				RETURNING id_categoria_servicio, creado_en
				""",
				[nombre, descripcion, descripcion_corta]
			)
			new_id, creado_en = cur.fetchone()

			return Response({
				"message": "Categoría creada exitosamente",
				"category": {
					'id': str(new_id),
					'nombre': nombre,
					'descripcion': descripcion,
					'descripcion_corta': descripcion_corta,
					'creado_en': creado_en.isoformat() if creado_en else None,
				}
			}, status=status.HTTP_201_CREATED)
	except Exception as e:
		logger.exception("Error creando categoría")
		return Response(
			{"message": "Error creando categoría", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def admin_update_category(request, category_id):
	"""Actualiza el nombre (y opcionalmente la descripción) de una categoría existente."""
	try:
		with connection.cursor() as cur:
			denied = _require_admin(cur, request)
			if denied:
				return denied

			cur.execute("SELECT nombre FROM categoria_servicio WHERE id_categoria_servicio = %s", [category_id])
			existing = cur.fetchone()
			if not existing:
				return Response({"message": "Categoría no encontrada"}, status=status.HTTP_404_NOT_FOUND)

			nombre = request.data.get('nombre')
			descripcion = request.data.get('descripcion', None)
			descripcion_corta = request.data.get('descripcion_corta', None)

			updates = []
			params = []

			if nombre is not None:
				nombre = nombre.strip()
				if not nombre:
					return Response({"message": "El nombre de la categoría no puede estar vacío"}, status=status.HTTP_400_BAD_REQUEST)
				if len(nombre) > 50:
					return Response({"message": "El nombre de la categoría no puede superar los 50 caracteres"}, status=status.HTTP_400_BAD_REQUEST)
				cur.execute(
					"SELECT 1 FROM categoria_servicio WHERE lower(nombre) = lower(%s) AND id_categoria_servicio <> %s",
					[nombre, category_id]
				)
				if cur.fetchone():
					return Response({"message": "Ya existe otra categoría con ese nombre"}, status=status.HTTP_409_CONFLICT)
				updates.append("nombre = %s")
				params.append(nombre)

			if 'descripcion' in request.data:
				updates.append("descripcion = %s")
				params.append(descripcion)

			if 'descripcion_corta' in request.data:
				updates.append("descripcion_corta = %s")
				params.append(descripcion_corta)

			if not updates:
				return Response({"message": "No hay cambios para aplicar"}, status=status.HTTP_400_BAD_REQUEST)

			updates.append("actualizado_en = %s")
			params.append(timezone.now())
			params.append(category_id)

			cur.execute(
				f"UPDATE categoria_servicio SET {', '.join(updates)} WHERE id_categoria_servicio = %s",
				params
			)

			return Response({"message": "Categoría actualizada exitosamente"})
	except Exception as e:
		logger.exception("Error actualizando categoría")
		return Response(
			{"message": "Error actualizando categoría", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
