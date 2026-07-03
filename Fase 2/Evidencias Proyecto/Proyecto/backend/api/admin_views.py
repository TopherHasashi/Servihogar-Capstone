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
			
			# 3. PROFESIONALES ACTIVOS (profesionales con solicitudes confirmadas/completadas en 30 días)
			# Usa columnas de timestamp directas (historial_estado_solicitud no es poblado por la app)
			active_professionals = 0
			if has_solicitud:
				cur.execute(
					"""
					SELECT COUNT(DISTINCT rut_profesional) as active_professionals
					FROM solicitud_servicio
					WHERE rut_profesional IS NOT NULL
					  AND (
					    (confirmado_en IS NOT NULL AND confirmado_en >= %s) OR
					    (completado_en IS NOT NULL AND completado_en >= %s)
					  )
					""",
					[thirty_days_ago, thirty_days_ago]
				)
				active_professionals = cur.fetchone()[0] or 0
			
			# Profesionales activos del periodo anterior (30-60 días atrás)
			last_period_professionals = 0
			if has_solicitud:
				cur.execute(
					"""
					SELECT COUNT(DISTINCT rut_profesional) as active_professionals
					FROM solicitud_servicio
					WHERE rut_profesional IS NOT NULL
					  AND (
					    (confirmado_en IS NOT NULL AND confirmado_en >= %s AND confirmado_en < %s) OR
					    (completado_en IS NOT NULL AND completado_en >= %s AND completado_en < %s)
					  )
					""",
					[sixty_days_ago, thirty_days_ago, sixty_days_ago, thirty_days_ago]
				)
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
			# Usa columnas de timestamp directas (historial_estado_solicitud no es poblado por la app)
			if has_solicitud:
				cur.execute(
					"""
					SELECT 
						COUNT(CASE WHEN completado_en IS NOT NULL THEN 1 END) as completed,
						COUNT(*) as total
					FROM solicitud_servicio
					WHERE creado_en >= %s
					  AND cancelado_en IS NULL
					""",
					[thirty_days_ago]
				)
				completion_row = cur.fetchone()
				completed_count = completion_row[0] or 0
				total_count = completion_row[1] or 0
				completion_rate = round((completed_count / total_count * 100), 1) if total_count > 0 else 0
			else:
				completion_rate = 0
			
			# 6. TIEMPO PROMEDIO DE RESPUESTA (desde creado_en hasta confirmado_en)
			# Usa confirmado_en directamente — columna mantenida por la app
			if has_solicitud:
				cur.execute(
					"""
					SELECT AVG(EXTRACT(EPOCH FROM (confirmado_en - creado_en)) / 3600) as avg_hours
					FROM solicitud_servicio
					WHERE confirmado_en IS NOT NULL
					  AND creado_en >= %s
					""",
					[thirty_days_ago]
				)
				avg_response_time = round(float(cur.fetchone()[0] or 0), 1)
			else:
				avg_response_time = 0
			
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
			# Fuente de verdad: servicio_profesional con estado aprobado en historial
			# (historial_rol_usuario no se actualiza cuando se aprueba un profesional)
			has_hev_check = _table_exists(cur, "historial_estado_verificacion_servicio")
			if has_servicio_profesional and has_hev_check:
				cur.execute(
					"""
					SELECT COUNT(DISTINCT sp.rut_usuario) as total_professionals
					FROM servicio_profesional sp
					WHERE 'aprobado' = (
						SELECT evs.nombre
						FROM historial_estado_verificacion_servicio h
						JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio
						WHERE h.id_servicio_profesional = sp.id_servicio_profesional
						ORDER BY h.cambiado_en DESC LIMIT 1
					)
					"""
				)
				total_professionals = cur.fetchone()[0] or 0
			elif has_usuario:
				cur.execute("SELECT COUNT(*) FROM usuario WHERE rol = 'profesional'")
				total_professionals = cur.fetchone()[0] or 0
			else:
				total_professionals = 0
			
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
			# Usa columnas de timestamp directas
			if has_solicitud:
				cur.execute(
					"""
					WITH professional_counts AS (
						SELECT rut_profesional, COUNT(*) as service_count
						FROM solicitud_servicio
						WHERE creado_en >= %s
						  AND rut_profesional IS NOT NULL
						  AND (confirmado_en IS NOT NULL OR completado_en IS NOT NULL)
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

			# 11. CONTEOS TOTALES DE SOLICITUDES POR ESTADO (histórico completo)
			# Deriva el estado desde columnas de timestamp (fuente de verdad de la app)
			completed_services_total = 0
			cancelled_services_total = 0
			pending_services = 0
			confirmed_services = 0
			in_progress_services = 0

			if has_solicitud:
				cur.execute(
					"""
					SELECT
						COUNT(CASE WHEN cancelado_en IS NOT NULL THEN 1 END) AS cancelado,
						COUNT(CASE WHEN completado_en IS NOT NULL THEN 1 END) AS completado,
						COUNT(CASE WHEN confirmado_en IS NOT NULL AND completado_en IS NULL AND cancelado_en IS NULL THEN 1 END) AS confirmado,
						COUNT(CASE WHEN confirmado_en IS NULL AND cancelado_en IS NULL THEN 1 END) AS pendiente
					FROM solicitud_servicio
					"""
				)
				row = cur.fetchone()
				cancelled_services_total = int(row[0] or 0)
				completed_services_total = int(row[1] or 0)
				confirmed_services       = int(row[2] or 0)
				pending_services         = int(row[3] or 0)
				in_progress_services     = 0  # iniciado_en nunca se establece en la app actual

			# 12. USUARIOS: total histórico + nuevos este mes
			total_users_all_time = 0
			new_users_this_month = 0
			if has_usuario and has_historial_rol:
				cur.execute(
					"""
					WITH latest_roles AS (
						SELECT h.rut_usuario, r.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.rut_usuario ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_rol_usuario h
						JOIN rol r ON r.id_rol = h.id_rol
					)
					SELECT
						COUNT(DISTINCT u.rut) AS total,
						SUM(CASE WHEN u.creado_en >= %s THEN 1 ELSE 0 END) AS nuevos_mes
					FROM usuario u
					JOIN latest_roles lr ON lr.rut_usuario = u.rut AND lr.rn = 1
					WHERE lr.nombre IN ('cliente', 'profesional')
					""",
					[first_day_current_month]
				)
			elif has_usuario:
				cur.execute(
					"""
					SELECT
						COUNT(*) AS total,
						SUM(CASE WHEN creado_en >= %s THEN 1 ELSE 0 END) AS nuevos_mes
					FROM usuario
					WHERE rol IN ('cliente', 'profesional')
					""",
					[first_day_current_month]
				)
			if has_usuario:
				row = cur.fetchone()
				total_users_all_time = int(row[0] or 0)
				new_users_this_month = int(row[1] or 0)

			# 13. SOLICITUDES NUEVAS ESTE MES
			new_requests_this_month = 0
			if has_solicitud:
				cur.execute(
					"SELECT COUNT(*) FROM solicitud_servicio WHERE creado_en >= %s",
					[first_day_current_month]
				)
				new_requests_this_month = int(cur.fetchone()[0] or 0)

			# 14. VERIFICACIONES PENDIENTES (documentos y servicios)
			pending_doc_verifications = 0
			pending_service_verifications = 0

			has_doc = _table_exists(cur, "documento_profesional")
			has_hev = _table_exists(cur, "historial_estado_verificacion_servicio")

			if has_doc and has_hev:
				# Solo contar documentos cuyo servicio asociado siga en estado 'pendiente'.
				# Los documentos de servicios ya aprobados/rechazados no necesitan revisión.
				cur.execute(
					"""
					SELECT COUNT(*)
					FROM documento_profesional dp
					WHERE dp.estado_verificacion = 'pendiente'
					  AND (
					    dp.id_servicio_profesional IS NULL
					    OR 'pendiente' = COALESCE(
					        (SELECT evs.nombre
					         FROM historial_estado_verificacion_servicio h
					         JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio
					         WHERE h.id_servicio_profesional = dp.id_servicio_profesional
					         ORDER BY h.cambiado_en DESC LIMIT 1),
					        'pendiente'
					    )
					  )
					"""
				)
				pending_doc_verifications = int(cur.fetchone()[0] or 0)
			elif has_doc:
				cur.execute(
					"SELECT COUNT(*) FROM documento_profesional WHERE estado_verificacion = 'pendiente'"
				)
				pending_doc_verifications = int(cur.fetchone()[0] or 0)

			if has_servicio_profesional and has_hev:
				cur.execute(
					"""
					WITH latest_ver AS (
						SELECT h.id_servicio_profesional, ev.nombre,
							ROW_NUMBER() OVER (PARTITION BY h.id_servicio_profesional ORDER BY h.cambiado_en DESC) AS rn
						FROM historial_estado_verificacion_servicio h
						JOIN estado_verificacion_servicio ev ON ev.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio
					)
					SELECT COUNT(*) FROM latest_ver WHERE rn = 1 AND nombre = 'pendiente'
					"""
				)
				pending_service_verifications = int(cur.fetchone()[0] or 0)
			elif has_servicio_profesional:
				cur.execute(
					"SELECT COUNT(*) FROM servicio_profesional WHERE estado_verificacion = 'pendiente'"
				)
				pending_service_verifications = int(cur.fetchone()[0] or 0)

			# 15. DESGLOSE DE CALIFICACIONES POR DIMENSIÓN
			avg_quality = 0.0
			avg_punctuality = 0.0
			avg_communication = 0.0
			if has_resena:
				cur.execute(
					"""
					SELECT
						AVG(calificacion_calidad)       AS calidad,
						AVG(calificacion_puntualidad)   AS puntualidad,
						AVG(calificacion_comunicacion)  AS comunicacion
					FROM resena
					"""
				)
				row = cur.fetchone()
				avg_quality       = round(float(row[0] or 0), 2)
				avg_punctuality   = round(float(row[1] or 0), 2)
				avg_communication = round(float(row[2] or 0), 2)

			# 16. SOLICITUDES POR DÍA (últimos 7 días) para mini-tendencia
			requests_last_7_days = []
			if has_solicitud:
				seven_days_ago = now - timedelta(days=7)
				cur.execute(
					"""
					SELECT DATE(creado_en) AS dia, COUNT(*) AS total
					FROM solicitud_servicio
					WHERE creado_en >= %s
					GROUP BY DATE(creado_en)
					ORDER BY dia ASC
					""",
					[seven_days_ago]
				)
				for row in cur.fetchall():
					requests_last_7_days.append({
						"date": str(row[0]),
						"count": int(row[1])
					})

			# 17. TOP 5 PROFESIONALES POR CALIFICACIÓN
			top_professionals = []
			if has_resena and has_usuario:
				cur.execute(
					"""
					SELECT
						u.nombres || ' ' || u.apellidos AS nombre,
						COUNT(r.id_resena) AS total_resenas,
						ROUND(AVG((r.calificacion_calidad + r.calificacion_puntualidad + r.calificacion_comunicacion) / 3.0)::numeric, 2) AS avg_rating
					FROM resena r
					JOIN usuario u ON u.rut = r.rut_evaluado
					GROUP BY u.rut, u.nombres, u.apellidos
					HAVING COUNT(r.id_resena) >= 1
					ORDER BY avg_rating DESC, total_resenas DESC
					LIMIT 5
					"""
				)
				for row in cur.fetchall():
					top_professionals.append({
						"name": row[0],
						"reviews": int(row[1]),
						"rating": float(row[2])
					})

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
			"periodStart": thirty_days_ago.isoformat(),
				"periodEnd": now.isoformat(),
				"totalReviews": total_reviews
			},
			"stats": {
				"completedServices": completed_services_total,
				"cancelledServices": cancelled_services_total,
				"pendingServices": pending_services,
				"confirmedServices": confirmed_services,
				"inProgressServices": in_progress_services,
				"newRequestsThisMonth": new_requests_this_month,
				"totalUsersAllTime": total_users_all_time,
				"newUsersThisMonth": new_users_this_month,
				"pendingDocVerifications": pending_doc_verifications,
				"pendingServiceVerifications": pending_service_verifications,
				"avgRatingQuality": avg_quality,
				"avgRatingPunctuality": avg_punctuality,
				"avgRatingCommunication": avg_communication,
			},
			"requestsTrend": requests_last_7_days,
			"topProfessionals": top_professionals,
		}

		return Response(data)
		
	except Exception as e:
		logger.exception("Error obteniendo resumen ejecutivo")
		return Response(
			{"message": "Error obteniendo datos del dashboard", "error": str(e)},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


