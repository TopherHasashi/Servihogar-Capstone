"""
Endpoints administrativos para el panel de administrador.
Business Intelligence y métricas de la plataforma.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import connection
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import logging
import uuid
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


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def admin_dashboard_summary(request):
	"""
	Resumen ejecutivo del panel de administrador.
	Retorna KPIs principales de la plataforma.
	"""
	# Verificar que el usuario sea administrador
	try:
		with connection.cursor() as cur:
			role = get_user_role_by_email(cur, request.user.email)
			if role != 'administrador':
				return Response(
					{"message": "Acceso denegado. Solo administradores."},
					status=status.HTTP_403_FORBIDDEN
				)
	except Exception as e:
		logger.error(f"Error verificando rol de administrador: {e}")
		return Response(
			{"message": "Error verificando permisos"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
	
	try:
		# Fechas para comparación
		now = timezone.now()
		first_day_current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
		first_day_last_month = (first_day_current_month - timedelta(days=1)).replace(day=1)
		
		with connection.cursor() as cur:
			has_usuario = _table_exists(cur, "usuario")
			has_solicitud = _table_exists(cur, "solicitud_servicio")
			has_resena = _table_exists(cur, "resena")
			has_servicio_profesional = _table_exists(cur, "servicio_profesional")
			has_categoria = _table_exists(cur, "categoria_servicio")
			has_rol_catalogo = _table_exists(cur, "rol")
			has_estado_catalogo = _table_exists(cur, "estado_solicitud")
			has_historial_rol = _table_exists(cur, "historial_rol_usuario") and has_rol_catalogo
			has_historial_estado = _table_exists(cur, "historial_estado_solicitud") and has_estado_catalogo
			# 1. INGRESOS DEL MES - no aplica (pagos presenciales)
			total_revenue = 0
			monthly_growth = 0
			
			# 2. USUARIOS ACTIVOS (usuarios que han iniciado sesión en los últimos 30 días)
			thirty_days_ago = now - timedelta(days=30)
			active_users = 0
			if has_usuario and has_historial_rol:
				cur.execute(
					"""
					WITH latest_roles AS (
						SELECT h.rut_usuario, r.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.rut_usuario ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_rol_usuario h
						JOIN rol r ON r.id_rol = h.id_rol
					)
					SELECT COUNT(DISTINCT u.rut) as active_users
					FROM usuario u
					JOIN latest_roles lr ON lr.rut_usuario = u.rut AND lr.rn = 1
					WHERE u.ultima_actividad >= %s
					  AND lr.nombre IN ('cliente', 'profesional')
					""",
					[thirty_days_ago]
				)
			elif has_usuario:
				cur.execute(
					"""
					SELECT COUNT(DISTINCT rut) as active_users
					FROM usuario
					WHERE ultima_actividad >= %s
					  AND rol IN ('cliente', 'profesional')
					""",
					[thirty_days_ago]
				)
			if has_usuario:
				active_users = cur.fetchone()[0] or 0
			
			# Usuarios activos hace 30-60 días para calcular crecimiento
			sixty_days_ago = now - timedelta(days=60)
			last_period_users = 0
			if has_usuario and has_historial_rol:
				cur.execute(
					"""
					WITH latest_roles AS (
						SELECT h.rut_usuario, r.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.rut_usuario ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_rol_usuario h
						JOIN rol r ON r.id_rol = h.id_rol
					)
					SELECT COUNT(DISTINCT u.rut) as active_users
					FROM usuario u
					JOIN latest_roles lr ON lr.rut_usuario = u.rut AND lr.rn = 1
					WHERE u.ultima_actividad >= %s
					  AND u.ultima_actividad < %s
					  AND lr.nombre IN ('cliente', 'profesional')
					""",
					[sixty_days_ago, thirty_days_ago]
				)
			elif has_usuario:
				cur.execute(
					"""
					SELECT COUNT(DISTINCT rut) as active_users
					FROM usuario
					WHERE ultima_actividad >= %s
					  AND ultima_actividad < %s
					  AND rol IN ('cliente', 'profesional')
					""",
					[sixty_days_ago, thirty_days_ago]
				)
			if has_usuario:
				last_period_users = cur.fetchone()[0] or 0
			
			user_growth = 0
			if last_period_users > 0:
				user_growth = round(((active_users - last_period_users) / last_period_users) * 100, 1)
			
			# 3. PROFESIONALES ACTIVOS (profesionales que han confirmado al menos 1 solicitud en 30 días)
			active_professionals = 0
			if has_solicitud and has_historial_estado:
				cur.execute(
					"""
					WITH latest_estado AS (
						SELECT h.id_solicitud_servicio, es.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.id_solicitud_servicio ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_estado_solicitud h
						JOIN estado_solicitud es ON es.id_estado_solicitud = h.id_estado_solicitud
					)
					SELECT COUNT(DISTINCT s.rut_profesional) as active_professionals
					FROM solicitud_servicio s
					JOIN latest_estado le ON le.id_solicitud_servicio = s.id_solicitud_servicio AND le.rn = 1
					WHERE le.nombre IN ('confirmado', 'completado')
					  AND s.actualizado_en >= %s
					""",
					[thirty_days_ago]
				)
			elif has_solicitud:
				cur.execute(
					"""
					SELECT COUNT(DISTINCT rut_profesional) as active_professionals
					FROM solicitud_servicio
					WHERE estado IN ('confirmado', 'completado')
					  AND actualizado_en >= %s
					""",
					[thirty_days_ago]
				)
			if has_solicitud:
				active_professionals = cur.fetchone()[0] or 0
			
			# Profesionales activos del periodo anterior
			last_period_professionals = 0
			if has_solicitud and has_historial_estado:
				cur.execute(
					"""
					WITH latest_estado AS (
						SELECT h.id_solicitud_servicio, es.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.id_solicitud_servicio ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_estado_solicitud h
						JOIN estado_solicitud es ON es.id_estado_solicitud = h.id_estado_solicitud
					)
					SELECT COUNT(DISTINCT s.rut_profesional) as active_professionals
					FROM solicitud_servicio s
					JOIN latest_estado le ON le.id_solicitud_servicio = s.id_solicitud_servicio AND le.rn = 1
					WHERE le.nombre IN ('confirmado', 'completado')
					  AND s.actualizado_en >= %s
					  AND s.actualizado_en < %s
					""",
					[sixty_days_ago, thirty_days_ago]
				)
			elif has_solicitud:
				cur.execute(
					"""
					SELECT COUNT(DISTINCT rut_profesional) as active_professionals
					FROM solicitud_servicio
					WHERE estado IN ('confirmado', 'completado')
					  AND actualizado_en >= %s
					  AND actualizado_en < %s
					""",
					[sixty_days_ago, thirty_days_ago]
				)
			if has_solicitud:
				last_period_professionals = cur.fetchone()[0] or 0
			
			professional_growth = 0
			if last_period_professionals > 0:
				professional_growth = round(((active_professionals - last_period_professionals) / last_period_professionals) * 100, 1)
			
			# 4. CALIFICACIÓN PROMEDIO (de todas las reseñas)
			if has_resena:
				cur.execute(
					"""
					SELECT 
						AVG((calificacion_calidad + calificacion_puntualidad + calificacion_comunicacion) / 3.0) as avg_rating,
						COUNT(*) as total_reviews
					FROM resena
					WHERE creado_en >= %s
					""",
					[thirty_days_ago]
				)
				rating_row = cur.fetchone()
				avg_rating = round(float(rating_row[0] or 0), 2)
				total_reviews = rating_row[1] or 0
				
				# Calificación del periodo anterior
				cur.execute(
					"""
					SELECT AVG((calificacion_calidad + calificacion_puntualidad + calificacion_comunicacion) / 3.0) as avg_rating
					FROM resena
					WHERE creado_en >= %s
					  AND creado_en < %s
					""",
					[sixty_days_ago, thirty_days_ago]
				)
				last_period_rating = float(cur.fetchone()[0] or 0)
				rating_change = round(avg_rating - last_period_rating, 2) if last_period_rating > 0 else 0
			else:
				avg_rating = 0
				total_reviews = 0
				rating_change = 0
			
			# 5. TASA DE COMPLETACIÓN (% de solicitudes que se completan exitosamente)
			if has_solicitud and has_historial_estado:
				cur.execute(
					"""
					WITH latest_estado AS (
						SELECT h.id_solicitud_servicio, es.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.id_solicitud_servicio ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_estado_solicitud h
						JOIN estado_solicitud es ON es.id_estado_solicitud = h.id_estado_solicitud
					)
					SELECT 
						SUM(CASE WHEN le.nombre = 'completado' THEN 1 ELSE 0 END) as completed,
						COUNT(*) as total
					FROM solicitud_servicio s
					JOIN latest_estado le ON le.id_solicitud_servicio = s.id_solicitud_servicio AND le.rn = 1
					WHERE s.creado_en >= %s
					  AND le.nombre NOT IN ('cancelado')
					""",
					[thirty_days_ago]
				)
			elif has_solicitud:
				cur.execute(
					"""
					SELECT 
						SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completed,
						COUNT(*) as total
					FROM solicitud_servicio
					WHERE creado_en >= %s
					  AND estado NOT IN ('cancelado')
					""",
					[thirty_days_ago]
				)
			if has_solicitud:
				completion_row = cur.fetchone()
				completed_count = completion_row[0] or 0
				total_count = completion_row[1] or 0
				completion_rate = round((completed_count / total_count * 100), 1) if total_count > 0 else 0
			else:
				completion_rate = 0
			
			# 6. TIEMPO PROMEDIO DE RESPUESTA (tiempo desde pendiente hasta confirmado)
			if has_solicitud and has_historial_estado:
				cur.execute(
					"""
					WITH latest_estado AS (
						SELECT h.id_solicitud_servicio, es.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.id_solicitud_servicio ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_estado_solicitud h
						JOIN estado_solicitud es ON es.id_estado_solicitud = h.id_estado_solicitud
					)
					SELECT AVG(EXTRACT(EPOCH FROM (s.actualizado_en - s.creado_en)) / 3600) as avg_hours
					FROM solicitud_servicio s
					JOIN latest_estado le ON le.id_solicitud_servicio = s.id_solicitud_servicio AND le.rn = 1
					WHERE le.nombre IN ('confirmado', 'completado')
					  AND s.creado_en >= %s
					  AND s.actualizado_en IS NOT NULL
					""",
					[thirty_days_ago]
				)
			elif has_solicitud:
				cur.execute(
					"""
					SELECT AVG(EXTRACT(EPOCH FROM (actualizado_en - creado_en)) / 3600) as avg_hours
					FROM solicitud_servicio
					WHERE estado IN ('confirmado', 'completado')
					  AND creado_en >= %s
					  AND actualizado_en IS NOT NULL
					""",
					[thirty_days_ago]
				)
			avg_response_time = round(float(cur.fetchone()[0] or 0), 1) if has_solicitud else 0
			
			# 7. DISTRIBUCIÓN DE SERVICIOS
			service_distribution = []
			if has_solicitud and has_servicio_profesional and has_categoria:
				cur.execute(
					"""
					SELECT 
						c.nombre as categoria,
						COUNT(s.id_solicitud_servicio) as total_servicios,
						0 as total_revenue,
						0 as avg_price
					FROM solicitud_servicio s
					INNER JOIN servicio_profesional sp ON s.id_servicio_profesional = sp.id_servicio_profesional
					INNER JOIN categoria_servicio c ON sp.id_categoria_servicio = c.id_categoria_servicio
					WHERE s.creado_en >= %s
					GROUP BY c.nombre
					ORDER BY total_servicios DESC
					LIMIT 10
					""",
					[thirty_days_ago]
				)
				for row in cur.fetchall():
					service_distribution.append({
						"name": row[0],
						"value": row[1],
						"revenue": float(row[2]),
						"avgPrice": float(row[3])
					})
			
			# 8. TOTAL DE PROFESIONALES
			if has_usuario and has_historial_rol:
				cur.execute(
					"""
					WITH latest_roles AS (
						SELECT h.rut_usuario, r.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.rut_usuario ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_rol_usuario h
						JOIN rol r ON r.id_rol = h.id_rol
					)
					SELECT COUNT(*) as total_professionals
					FROM latest_roles
					WHERE rn = 1 AND nombre = 'profesional'
					"""
				)
			elif has_usuario:
				cur.execute(
					"""
					SELECT COUNT(*) as total_professionals
					FROM usuario
					WHERE rol = 'profesional'
					"""
				)
			total_professionals = cur.fetchone()[0] or 0 if has_usuario else 0
			
			# 9. TOP PERFORMERS (profesionales con calificación >= 4.8)
			if has_resena:
				cur.execute(
					"""
					SELECT COUNT(DISTINCT r.rut_evaluado) as top_performers
					FROM resena r
					WHERE (r.calificacion_calidad + r.calificacion_puntualidad + r.calificacion_comunicacion) / 3.0 >= 4.8
					  AND r.creado_en >= %s
					""",
					[thirty_days_ago]
				)
				top_performers = cur.fetchone()[0] or 0
			else:
				top_performers = 0
			
			# 10. SERVICIOS PROMEDIO POR PROFESIONAL
			if has_solicitud and has_historial_estado:
				cur.execute(
					"""
					WITH latest_estado AS (
						SELECT h.id_solicitud_servicio, es.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.id_solicitud_servicio ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_estado_solicitud h
						JOIN estado_solicitud es ON es.id_estado_solicitud = h.id_estado_solicitud
					), professional_counts AS (
						SELECT s.rut_profesional, COUNT(*) as service_count
						FROM solicitud_servicio s
						JOIN latest_estado le ON le.id_solicitud_servicio = s.id_solicitud_servicio AND le.rn = 1
						WHERE s.creado_en >= %s
						  AND le.nombre IN ('confirmado', 'completado')
						GROUP BY s.rut_profesional
					)
					SELECT AVG(service_count) as avg_services
					FROM professional_counts
					""",
					[thirty_days_ago]
				)
				avg_services_per_professional = round(float(cur.fetchone()[0] or 0), 1)
			elif has_solicitud:
				cur.execute(
					"""
					WITH professional_counts AS (
						SELECT 
							rut_profesional,
							COUNT(*) as service_count
						FROM solicitud_servicio
						WHERE creado_en >= %s
						  AND estado IN ('confirmado', 'completado')
						GROUP BY rut_profesional
					)
					SELECT AVG(service_count) as avg_services
					FROM professional_counts
					""",
					[thirty_days_ago]
				)
				avg_services_per_professional = round(float(cur.fetchone()[0] or 0), 1)
			else:
				avg_services_per_professional = 0
			
		# Construir respuesta
		data = {
			"kpis": {
				"totalRevenue": total_revenue,
				"monthlyGrowth": monthly_growth,
				"activeUsers": active_users,
				"userGrowth": user_growth,
				"activeProfessionals": active_professionals,
				"professionalGrowth": professional_growth,
				"avgRating": avg_rating,
				"ratingChange": rating_change,
				"completionRate": completion_rate,
				"avgResponseTime": avg_response_time
			},
			"professionalMetrics": {
				"total": total_professionals,
				"active": active_professionals,
				"topPerformers": top_performers,
				"avgServicesPerMonth": avg_services_per_professional
			},
			"serviceDistribution": service_distribution,
			"metadata": {
				"periodStart": first_day_current_month.isoformat(),
				"periodEnd": now.isoformat(),
				"totalReviews": total_reviews
			}
		}
		
		return Response(data)
		
	except Exception as e:
		logger.exception("Error obteniendo resumen ejecutivo")
		return Response(
			{"message": "Error obteniendo datos del dashboard", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


