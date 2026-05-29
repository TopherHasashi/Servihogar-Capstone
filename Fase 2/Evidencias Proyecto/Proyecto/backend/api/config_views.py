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
