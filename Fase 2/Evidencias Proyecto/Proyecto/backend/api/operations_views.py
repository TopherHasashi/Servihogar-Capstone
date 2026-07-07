"""
Vista para el Centro de Operaciones del panel de administración.
Gestiona solicitudes problemáticas, disputas, cancelaciones y métricas operacionales.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db import connection
from django.utils import timezone
from datetime import timedelta
import logging
import uuid
from .permission_utils import get_user_role_by_email
from .views import _create_notification, _get_user_by_rut

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


def _column_exists(cur, table_name: str, column_name: str) -> bool:
    try:
        cur.execute(
            "SELECT 1 FROM information_schema.columns WHERE table_name = %s AND column_name = %s",
            [table_name, column_name],
        )
        return cur.fetchone() is not None
    except Exception:
        pass
    try:
        cur.execute(f"PRAGMA table_info({table_name})")
        return any(row[1] == column_name for row in cur.fetchall())
    except Exception:
        return False


def _format_rut(rut, digito_verificador) -> str:
    """Formatea un RUT chileno como '11.111.111-1'."""
    try:
        rut_str = str(int(rut))
    except (TypeError, ValueError):
        return str(rut)

    partes = []
    while len(rut_str) > 3:
        partes.insert(0, rut_str[-3:])
        rut_str = rut_str[:-3]
    partes.insert(0, rut_str)
    rut_con_puntos = '.'.join(partes)

    dv = str(digito_verificador).strip().upper() if digito_verificador is not None else ''
    return f"{rut_con_puntos}-{dv}" if dv else rut_con_puntos


def _cancel_active_requests_for_disabled_user(cursor, rut, nombre_completo: str) -> int:
    """Cancela todas las solicitudes de servicio pendientes/confirmadas donde el usuario
    (deshabilitado) participa como cliente o profesional, y notifica a la contraparte.

    Retorna la cantidad de solicitudes canceladas.
    """
    now = timezone.now()
    motivo = f"Servicio cancelado, razón: la cuenta de {nombre_completo} fue deshabilitada"

    cursor.execute(
        """
        SELECT id_solicitud_servicio, rut_cliente, rut_profesional
        FROM solicitud_servicio
        WHERE (rut_cliente = %s OR rut_profesional = %s)
          AND cancelado_en IS NULL
          AND completado_en IS NULL
        """,
        [rut, rut],
    )
    active_requests = cursor.fetchall()

    if not active_requests:
        return 0

    has_pago = _table_exists(cursor, "pago")

    for id_solicitud, rut_cliente, rut_profesional in active_requests:
        cursor.execute(
            """
            UPDATE solicitud_servicio
            SET cancelado_en = %s, razon_cancelacion = %s, actualizado_en = %s
            WHERE id_solicitud_servicio = %s
            """,
            [now, motivo, now, id_solicitud],
        )

        # Si hay un pago aprobado y no liberado, marcarlo en revisión (igual que booking_cancel)
        if has_pago:
            try:
                cursor.execute(
                    """
                    UPDATE pago
                    SET estado = 'en_revision', actualizado_en = %s
                    WHERE id_solicitud_servicio = %s
                      AND estado = 'aprobado'
                      AND liberado_al_profesional_en IS NULL
                    """,
                    [now, id_solicitud],
                )
            except Exception as e:
                logger.warning(f"No se pudo actualizar pago para solicitud {id_solicitud}: {e}")

        # Notificar a la contraparte (quien no fue deshabilitado)
        try:
            rut_contraparte = rut_profesional if str(rut_cliente) == str(rut) else rut_cliente
            if rut_contraparte:
                notify_user = _get_user_by_rut(rut_contraparte)
                if notify_user:
                    _create_notification(
                        notify_user,
                        tipo='booking_cancelled',
                        titulo='Solicitud cancelada',
                        mensaje=motivo,
                        extra={'request_id': str(id_solicitud), 'reason': motivo},
                    )
        except Exception as e:
            logger.warning(f"Error enviando notificación de cuenta deshabilitada: {e}")

    return len(active_requests)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_problematic_requests(request):
    """
    Obtiene todas las solicitudes con problemas:
    - Canceladas después de aceptadas
    - Disputas activas
    - Servicios incompletos o con reclamos
    - Pagos pendientes por más de 7 días
    
    Query params:
    - page: número de página (default: 1)
    - page_size: tamaño de página (default: 20, max: 100)
    """
    try:
        # Verificar que el usuario sea administrador
        with connection.cursor() as cursor:
            role = get_user_role_by_email(cursor, request.user.email)
            if role != 'administrador':
                return Response(
                    {'error': 'No tiene permisos de administrador'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Paginación
            page = int(request.GET.get('page', 1))
            page_size = min(int(request.GET.get('page_size', 20)), 100)
            offset = (page - 1) * page_size

            # Primero obtener el total de registros (sin paginación)
            cursor.execute("""
                SELECT COUNT(DISTINCT s.id_solicitud)
                FROM solicitud_servicio s
                LEFT JOIN pago p ON s.id_solicitud = p.id_solicitud
                WHERE 
                    (s.estado = 'cancelada' AND s.comentarios_cancelacion IS NOT NULL)
                    OR s.estado = 'en_disputa'
                    OR (p.estado = 'pendiente' AND p.fecha_pago < NOW() - INTERVAL '7 days')
                    OR (s.estado = 'completada' AND s.comentarios_cancelacion IS NOT NULL)
            """)
            total_count = cursor.fetchone()[0]

            # Obtener solicitudes problemáticas con paginación
            cursor.execute("""
                SELECT 
                    s.id_solicitud,
                    s.estado,
                    s.fecha_solicitud,
                    s.fecha_servicio,
                    s.precio_acordado,
                    s.descripcion,
                    s.direccion,
                    s.comentarios_cancelacion,
                    
                    -- Datos del cliente
                    uc.nombres || ' ' || uc.apellidos as nombre_cliente,
                    uc.email as email_cliente,
                    uc.telefono as telefono_cliente,
                    
                    -- Datos del profesional
                    up.nombres || ' ' || up.apellidos as nombre_profesional,
                    up.email as email_profesional,
                    up.telefono as telefono_profesional,
                    
                    -- Datos del servicio
                    sp.nombre_servicio,
                    c.nombre_categoria,
                    
                    -- Datos del pago
                    p.id_pago,
                    p.estado as estado_pago,
                    p.monto,
                    p.fecha_pago,
                    
                    -- Tipo de problema
                    CASE 
                        WHEN s.estado = 'cancelada' AND s.comentarios_cancelacion IS NOT NULL 
                            THEN 'cancelacion_tardia'
                        WHEN p.estado = 'pendiente' AND p.fecha_pago < NOW() - INTERVAL '7 days'
                            THEN 'pago_pendiente'
                        WHEN s.estado = 'en_disputa'
                            THEN 'disputa_activa'
                        WHEN s.estado = 'completada' AND s.comentarios_cancelacion IS NOT NULL
                            THEN 'servicio_incompleto'
                        ELSE 'otro'
                    END as tipo_problema,
                    
                    -- Severidad del problema
                    CASE 
                        WHEN s.estado = 'en_disputa' THEN 'high'
                        WHEN p.estado = 'pendiente' AND p.fecha_pago < NOW() - INTERVAL '7 days' THEN 'high'
                        WHEN s.estado = 'cancelada' THEN 'medium'
                        ELSE 'low'
                    END as severidad
                    
                FROM solicitud_servicio s
                INNER JOIN usuario uc ON s.rut_cliente = uc.rut
                LEFT JOIN servicio_profesional sp ON s.id_servicio_profesional = sp.id_servicio_profesional
                LEFT JOIN usuario up ON sp.rut_profesional = up.rut
                LEFT JOIN categoria_servicio c ON sp.id_categoria_servicio = c.id_categoria_servicio
                LEFT JOIN pago p ON s.id_solicitud = p.id_solicitud
                
                WHERE 
                    (s.estado = 'cancelada' AND s.comentarios_cancelacion IS NOT NULL)
                    OR s.estado = 'en_disputa'
                    OR (p.estado = 'pendiente' AND p.fecha_pago < NOW() - INTERVAL '7 days')
                    OR (s.estado = 'completada' AND s.comentarios_cancelacion IS NOT NULL)
                
                ORDER BY 
                    CASE 
                        WHEN s.estado = 'en_disputa' THEN 1
                        WHEN p.estado = 'pendiente' AND p.fecha_pago < NOW() - INTERVAL '7 days' THEN 1
                        WHEN s.estado = 'cancelada' THEN 2
                        ELSE 3
                    END,
                    s.fecha_solicitud DESC
                
                LIMIT %s OFFSET %s
            """, [page_size, offset])
            
            columns = [col[0] for col in cursor.description]
            problematic_requests = []
            
            for row in cursor.fetchall():
                request_dict = dict(zip(columns, row))
                problematic_requests.append(request_dict)
            
            total_pages = (total_count + page_size - 1) // page_size
            
            return Response({
                'problematic_requests': problematic_requests,
                'pagination': {
                    'total': total_count,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': total_pages,
                    'has_next': page < total_pages,
                    'has_previous': page > 1
                }
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error obteniendo solicitudes problemáticas: {str(e)}")
        return Response(
            {'error': f'Error al obtener solicitudes problemáticas: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_operations_stats(request):
    """
    Obtiene estadísticas operacionales:
    - Solicitudes activas en tiempo real
    - Tiempo promedio de respuesta
    - Tasa de éxito
    - Problemas por resolver
    """
    try:
        # Verificar que el usuario sea administrador
        with connection.cursor() as cursor:
            role = get_user_role_by_email(cursor, request.user.email)
            if role != 'administrador':
                return Response(
                    {'error': 'No tiene permisos de administrador'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Solicitudes activas (pendiente, aceptada, en_progreso)
            cursor.execute("""
                SELECT COUNT(*) 
                FROM solicitud_servicio 
                WHERE estado IN ('pendiente', 'aceptada', 'en_progreso')
            """)
            active_requests = cursor.fetchone()[0]

            # Problemas por resolver
            cursor.execute("""
                SELECT COUNT(*) 
                FROM solicitud_servicio s
                LEFT JOIN pago p ON s.id_solicitud = p.id_solicitud
                WHERE 
                    s.estado = 'en_disputa'
                    OR (s.estado = 'cancelada' AND s.comentarios_cancelacion IS NOT NULL)
                    OR (p.estado = 'pendiente' AND p.fecha_pago < NOW() - INTERVAL '7 days')
            """)
            pending_issues = cursor.fetchone()[0]

            # Tiempo promedio de respuesta (desde solicitud hasta aceptación)
            cursor.execute("""
                SELECT 
                    AVG(EXTRACT(EPOCH FROM (
                        -- Asumimos que la aceptación es cuando cambia a 'aceptada'
                        -- Por ahora usamos fecha_servicio - fecha_solicitud como aproximación
                        fecha_servicio - fecha_solicitud
                    ))) / 3600 as avg_response_hours
                FROM solicitud_servicio
                WHERE estado IN ('aceptada', 'en_progreso', 'completada')
                AND fecha_solicitud >= NOW() - INTERVAL '30 days'
            """)
            avg_response_result = cursor.fetchone()
            avg_response_time = round(avg_response_result[0], 2) if avg_response_result[0] else 0

            # Tasa de éxito (completadas vs total)
            cursor.execute("""
                SELECT 
                    COUNT(CASE WHEN estado = 'completada' THEN 1 END)::float / 
                    NULLIF(COUNT(*), 0) * 100 as success_rate
                FROM solicitud_servicio
                WHERE fecha_solicitud >= NOW() - INTERVAL '30 days'
                AND estado IN ('completada', 'cancelada', 'en_disputa')
            """)
            success_rate_result = cursor.fetchone()
            success_rate = round(success_rate_result[0], 2) if success_rate_result[0] else 0

            # Distribución de problemas por tipo
            cursor.execute("""
                SELECT 
                    CASE 
                        WHEN s.estado = 'cancelada' THEN 'Cancelaciones'
                        WHEN s.estado = 'en_disputa' THEN 'Disputas'
                        WHEN p.estado = 'pendiente' THEN 'Pagos Pendientes'
                        ELSE 'Otros'
                    END as tipo,
                    COUNT(*) as cantidad
                FROM solicitud_servicio s
                LEFT JOIN pago p ON s.id_solicitud = p.id_solicitud
                WHERE 
                    s.estado IN ('cancelada', 'en_disputa')
                    OR (p.estado = 'pendiente' AND p.fecha_pago < NOW() - INTERVAL '7 days')
                GROUP BY tipo
            """)
            
            issue_distribution = []
            for row in cursor.fetchall():
                issue_distribution.append({
                    'tipo': row[0],
                    'cantidad': row[1]
                })

            return Response({
                'active_requests': active_requests,
                'pending_issues': pending_issues,
                'avg_response_time': avg_response_time,
                'success_rate': success_rate,
                'issue_distribution': issue_distribution
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas operacionales: {str(e)}")
        return Response(
            {'error': f'Error al obtener estadísticas: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def resolve_request_issue(request, request_id):
    """
    Marca un problema como resuelto y actualiza el estado de la solicitud.
    """
    try:
        # Verificar que el usuario sea administrador
        with connection.cursor() as cursor:
            role = get_user_role_by_email(cursor, request.user.email)
            if role != 'administrador':
                return Response(
                    {'error': 'No tiene permisos de administrador'},
                    status=status.HTTP_403_FORBIDDEN
                )

            admin_email = request.user.email
            resolution_action = request.data.get('action', 'resolved')
            notes = request.data.get('notes', '')

            # Actualizar estado según la acción
            if resolution_action == 'resolved':
                new_state = 'completada'
            elif resolution_action == 'cancelled':
                new_state = 'cancelada'
            else:
                new_state = resolution_action

            # Actualizar la solicitud
            cursor.execute("""
                UPDATE solicitud_servicio
                SET 
                    estado = %s,
                    comentarios_cancelacion = COALESCE(comentarios_cancelacion, '') || 
                        E'\n[RESUELTO POR ADMIN ' || %s || ' - ' || NOW() || ']: ' || %s
                WHERE id_solicitud = %s
            """, [new_state, admin_email, notes, request_id])

            if cursor.rowcount == 0:
                return Response(
                    {'error': 'Solicitud no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response({
                'message': 'Problema resuelto exitosamente',
                'request_id': request_id,
                'new_state': new_state
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Error resolviendo problema: {str(e)}")
        return Response(
            {'error': f'Error al resolver problema: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_users_list(request):
    """
    Obtiene la lista de usuarios del sistema con filtros opcionales.
    
    Query params:
    - page: número de página (default: 1)
    - page_size: tamaño de página (default: 20, max: 100)
    - role: filtrar por rol (cliente, profesional, verificador, administrador)
    - search: buscar por nombre, email o RUT
    - status: filtrar por estado (activo, inactivo)
    """
    try:
        # Verificar que el usuario sea administrador
        with connection.cursor() as cursor:
            role = get_user_role_by_email(cursor, request.user.email)
            if role != 'administrador':
                return Response(
                    {'error': 'No tiene permisos de administrador'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Paginación (con límites seguros para evitar OFFSET negativo / división por cero)
            try:
                page = max(1, int(request.GET.get('page', 1)))
            except (TypeError, ValueError):
                page = 1
            try:
                page_size = min(max(1, int(request.GET.get('page_size', 20))), 100)
            except (TypeError, ValueError):
                page_size = 20
            offset = (page - 1) * page_size

            has_historial_rol = _table_exists(cursor, "historial_rol_usuario") and _table_exists(cursor, "rol")
            has_usuario_rol_column = _column_exists(cursor, "usuario", "rol")
            has_digito_verificador = _column_exists(cursor, "usuario", "digito_verificador")
            has_servicio_profesional = _table_exists(cursor, "servicio_profesional")
            has_categoria_servicio = _table_exists(cursor, "categoria_servicio")
            has_hev = _table_exists(cursor, "historial_estado_verificacion_servicio")
            role_cte_sql = ""
            role_join_sql = ""

            # NOTA IMPORTANTE: ni usuario.rol (no existe en el esquema real de producción)
            # ni historial_rol_usuario (solo se registra una vez al momento del registro y
            # NUNCA se actualiza cuando un verificador aprueba un servicio profesional) son
            # confiables para saber si un usuario es actualmente "profesional". La única
            # fuente de verdad real es la existencia de al menos un registro en
            # servicio_profesional cuyo estado de verificación más reciente (via
            # historial_estado_verificacion_servicio) sea 'aprobado'. Por eso el rol base
            # (historial/columna, usado para detectar administrador/verificador) se
            # sobreescribe a 'profesional' cuando corresponde.
            if has_historial_rol:
                base_role_sql = "COALESCE(lr.nombre, 'cliente')"
                role_cte_sql = """
                WITH latest_roles AS (
                    SELECT h.rut_usuario, r.nombre,
                        ROW_NUMBER() OVER (PARTITION BY h.rut_usuario ORDER BY h.cambiado_en DESC) AS rn
                    FROM historial_rol_usuario h
                    JOIN rol r ON r.id_rol = h.id_rol
                )
                """
                role_join_sql = "JOIN latest_roles lr ON lr.rut_usuario = u.rut AND lr.rn = 1"
            elif has_usuario_rol_column:
                base_role_sql = "u.rol"
            else:
                base_role_sql = "'cliente'"

            if has_servicio_profesional and has_categoria_servicio and has_hev:
                is_professional_sql = f"""
                    EXISTS (
                        SELECT 1 FROM servicio_profesional sp_rol
                        WHERE sp_rol.rut_usuario = u.rut
                          AND 'aprobado' = COALESCE(
                              (SELECT evs_rol.nombre
                               FROM historial_estado_verificacion_servicio h_rol
                               JOIN estado_verificacion_servicio evs_rol ON evs_rol.id_estado_verificacion_servicio = h_rol.id_estado_verificacion_servicio
                               WHERE h_rol.id_servicio_profesional = sp_rol.id_servicio_profesional
                               ORDER BY h_rol.cambiado_en DESC LIMIT 1),
                              'pendiente'
                          )
                    )
                """
            elif has_servicio_profesional:
                is_professional_sql = "EXISTS (SELECT 1 FROM servicio_profesional sp_rol WHERE sp_rol.rut_usuario = u.rut)"
            else:
                is_professional_sql = "FALSE"

            role_select_sql = f"CASE WHEN {is_professional_sql} THEN 'profesional' ELSE {base_role_sql} END"
            role_filter_sql = f"({role_select_sql}) = %s"

            auth_join_sql = "LEFT JOIN auth_user au ON au.email = u.email"

            # Filtros
            role_filter = request.GET.get('role', '').strip()
            search_filter = request.GET.get('search', '').strip()
            status_filter = request.GET.get('status', '').strip()
            region_filter = request.GET.get('region_id', '').strip()
            comuna_filter = request.GET.get('comuna_id', '').strip()

            # Validar formato UUID antes de usarlos en la consulta (evita errores 500
            # de Postgres por "invalid input syntax for type uuid").
            if region_filter:
                try:
                    uuid.UUID(region_filter)
                except (ValueError, AttributeError, TypeError):
                    return Response(
                        {'error': 'region_id inválido: debe ser un UUID'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            if comuna_filter:
                try:
                    uuid.UUID(comuna_filter)
                except (ValueError, AttributeError, TypeError):
                    return Response(
                        {'error': 'comuna_id inválido: debe ser un UUID'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            has_comuna = _table_exists(cursor, "comuna")
            has_region = _table_exists(cursor, "region")
            has_id_comuna_column = _column_exists(cursor, "usuario", "id_comuna")
            geo_join_sql = ""
            if has_comuna and has_id_comuna_column:
                geo_join_sql += " LEFT JOIN comuna geo_c ON geo_c.id_comuna = u.id_comuna"
                if has_region:
                    geo_join_sql += " LEFT JOIN region geo_r ON geo_r.id_region = geo_c.id_region"

            # Construcción de la consulta base
            where_clauses = []
            params = []

            # Excluir siempre cuentas de administrador y verificador:
            # 1) Por columna rol en usuario (si existe)
            if has_usuario_rol_column:
                where_clauses.append("u.rol NOT IN ('administrador', 'verificador')")
            # 2) Por historial de rol (solo si realmente se está usando el JOIN a latest_roles,
            #    ya que u.rol tiene prioridad como fuente de verdad cuando existe)
            if role_join_sql:
                where_clauses.append("COALESCE(lr.nombre, 'cliente') NOT IN ('administrador', 'verificador')")
            # 3) Por flags de Django auth (siempre aplica como red de seguridad)
            where_clauses.append("COALESCE(au.is_superuser, FALSE) = FALSE")
            where_clauses.append("COALESCE(au.is_staff, FALSE) = FALSE")

            if role_filter and role_filter_sql:
                where_clauses.append(role_filter_sql)
                params.append(role_filter)

            if search_filter:
                where_clauses.append("""
                    (u.nombres ILIKE %s 
                     OR u.apellidos ILIKE %s 
                     OR u.email ILIKE %s 
                     OR u.rut::TEXT ILIKE %s)
                """)
                search_pattern = f'%{search_filter}%'
                params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

            if status_filter == 'activo':
                where_clauses.append("COALESCE(au.is_active, TRUE) = TRUE")
            elif status_filter == 'inactivo':
                where_clauses.append("COALESCE(au.is_active, TRUE) = FALSE")

            if region_filter and has_comuna and has_id_comuna_column:
                where_clauses.append("geo_c.id_region = %s")
                params.append(region_filter)

            if comuna_filter and has_id_comuna_column:
                where_clauses.append("u.id_comuna = %s")
                params.append(comuna_filter)

            where_sql = ' AND '.join(where_clauses) if where_clauses else '1=1'

            # Contar total de registros
            count_query = f"""
                {role_cte_sql}
                SELECT COUNT(*) 
                FROM usuario u
                {role_join_sql}
                {auth_join_sql}
                {geo_join_sql}
                WHERE {where_sql}
            """
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

            # RUT con dígito verificador (si la columna existe)
            digito_select_sql = "u.digito_verificador" if has_digito_verificador else "NULL"

            # Servicios activos (aprobados) que ofrece el profesional, resumidos por nombre de categoría
            if has_servicio_profesional and has_categoria_servicio and has_hev:
                servicios_activos_sql = """
                    (SELECT STRING_AGG(cs.nombre, ', ' ORDER BY cs.nombre)
                     FROM servicio_profesional sp
                     JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
                     WHERE sp.rut_usuario = u.rut
                       AND 'aprobado' = COALESCE(
                           (SELECT evs.nombre
                            FROM historial_estado_verificacion_servicio h
                            JOIN estado_verificacion_servicio evs ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio
                            WHERE h.id_servicio_profesional = sp.id_servicio_profesional
                            ORDER BY h.cambiado_en DESC LIMIT 1),
                           'pendiente'
                       )
                    ) as servicios_activos
                """
            elif has_servicio_profesional and has_categoria_servicio:
                servicios_activos_sql = """
                    (SELECT STRING_AGG(cs.nombre, ', ' ORDER BY cs.nombre)
                     FROM servicio_profesional sp
                     JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
                     WHERE sp.rut_usuario = u.rut
                    ) as servicios_activos
                """
            else:
                servicios_activos_sql = "NULL as servicios_activos"

            # Comuna/región del usuario (para mostrar y filtrar)
            if has_comuna and has_id_comuna_column:
                comuna_nombre_sql = "geo_c.nombre"
                region_nombre_sql = "geo_r.nombre" if has_region else "NULL"
                comuna_id_sql = "geo_c.id_comuna"
                region_id_sql = "geo_r.id_region" if has_region else "NULL"
            else:
                comuna_nombre_sql = "NULL"
                region_nombre_sql = "NULL"
                comuna_id_sql = "NULL"
                region_id_sql = "NULL"

            # Calificación promedio como profesional (para detectar posibles motivos de deshabilitación)
            has_resena = _table_exists(cursor, "resena")
            has_solicitud = _table_exists(cursor, "solicitud_servicio")
            if has_resena and has_solicitud:
                calificacion_promedio_sql = """
                    (SELECT ROUND(AVG(
                        (COALESCE(r.calificacion_calidad,0) + COALESCE(r.calificacion_puntualidad,0) + COALESCE(r.calificacion_comunicacion,0)) / 3.0
                     ), 1)
                     FROM resena r
                     JOIN solicitud_servicio sr ON sr.id_solicitud_servicio = r.id_solicitud_servicio
                     WHERE sr.rut_profesional = u.rut) as calificacion_promedio
                """
            else:
                calificacion_promedio_sql = "NULL as calificacion_promedio"

            # Obtener usuarios con paginación
            list_query = f"""
                {role_cte_sql}
                SELECT 
                    u.rut,
                    u.nombres,
                    u.apellidos,
                    u.email,
                    u.telefono,
                    {role_select_sql} as rol,
                    COALESCE(au.is_active, TRUE) as activo,
                    u.creado_en,
                    u.ultima_actividad,
                    (SELECT COUNT(*) FROM solicitud_servicio WHERE rut_cliente = u.rut) as solicitudes_como_cliente,
                    (SELECT COUNT(*) FROM solicitud_servicio WHERE rut_profesional = u.rut) as solicitudes_como_profesional,
                    {digito_select_sql} as digito_verificador,
                    {servicios_activos_sql},
                    {comuna_nombre_sql} as comuna_nombre,
                    {region_nombre_sql} as region_nombre,
                    {comuna_id_sql} as comuna_id,
                    {region_id_sql} as region_id,
                    {calificacion_promedio_sql}
                FROM usuario u
                {role_join_sql}
                {auth_join_sql}
                {geo_join_sql}
                WHERE {where_sql}
                ORDER BY u.creado_en DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(list_query, params + [page_size, offset])

            users = []
            for row in cursor.fetchall():
                digito_verificador = row[11]
                rut_formateado = _format_rut(row[0], digito_verificador) if row[0] is not None else None
                servicios_activos_raw = row[12]
                servicios_activos = (
                    [s.strip() for s in servicios_activos_raw.split(',')] if servicios_activos_raw else []
                )
                comuna_nombre = row[13]
                region_nombre = row[14]
                comuna_id = row[15]
                region_id = row[16]
                calificacion_promedio = row[17]
                users.append({
                    'rut': row[0],
                    'digito_verificador': digito_verificador,
                    'rut_formateado': rut_formateado,
                    'nombres': row[1],
                    'apellidos': row[2],
                    'nombre_completo': f"{row[1]} {row[2]}",
                    'email': row[3],
                    'telefono': row[4],
                    'rol': row[5],
                    'activo': row[6],
                    'fecha_registro': row[7].isoformat() if row[7] else None,
                    'ultima_actividad': row[8].isoformat() if row[8] else None,
                    'solicitudes_como_cliente': row[9] or 0,
                    'solicitudes_como_profesional': row[10] or 0,
                    'servicios_activos': servicios_activos,
                    'comuna_nombre': comuna_nombre,
                    'region_nombre': region_nombre,
                    'comuna_id': str(comuna_id) if comuna_id else None,
                    'region_id': str(region_id) if region_id else None,
                    'calificacion_promedio': float(calificacion_promedio) if calificacion_promedio is not None else None,
                })

            # Calcular paginación
            total_pages = (total_count + page_size - 1) // page_size

            return Response({
                'users': users,
                'pagination': {
                    'total': total_count,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': total_pages,
                    'has_next': page < total_pages,
                    'has_previous': page > 1
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error obteniendo lista de usuarios: {str(e)}")
        return Response(
            {'error': f'Error al obtener usuarios: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def toggle_user_status(request, rut):
    """
    Habilita o deshabilita una cuenta de usuario.
    
    Body params:
    - activo: boolean (true para habilitar, false para deshabilitar)
    - razon: string (opcional, razón del cambio)
    """
    try:
        # Verificar que el usuario sea administrador
        with connection.cursor() as cursor:
            role = get_user_role_by_email(cursor, request.user.email)
            if role != 'administrador':
                return Response(
                    {'error': 'No tiene permisos de administrador'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if not str(rut).strip().lstrip('-').isdigit():
                return Response(
                    {'error': 'RUT inválido: debe ser numérico'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            admin_email = request.user.email
            nuevo_estado = request.data.get('activo', False)
            if isinstance(nuevo_estado, str):
                # Evita que strings como "false"/"0" se evalúen como verdaderos
                nuevo_estado = nuevo_estado.strip().lower() in ('1', 'true', 'yes', 'si', 'sí')
            else:
                nuevo_estado = bool(nuevo_estado)
            razon = request.data.get('razon', 'Sin razón especificada')

            # No permitir desactivar al propio usuario administrador
            cursor.execute("SELECT rut FROM usuario WHERE email = %s", [admin_email])
            admin_rut = cursor.fetchone()
            if admin_rut and admin_rut[0] == rut:
                return Response(
                    {'error': 'No puedes desactivar tu propia cuenta'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Verificar que el usuario existe
            cursor.execute("SELECT rut, nombres, apellidos, email FROM usuario WHERE rut = %s", [rut])
            usuario_row = cursor.fetchone()
            if not usuario_row:
                return Response(
                    {'error': 'Usuario no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Actualizar el estado en auth_user (controla el acceso al sistema)
            cursor.execute("""
                UPDATE auth_user
                SET is_active = %s
                WHERE email = %s
            """, [nuevo_estado, usuario_row[3]])

            # Actualizar timestamp en usuario
            cursor.execute("""
                UPDATE usuario SET actualizado_en = NOW() WHERE rut = %s
            """, [rut])

            row = usuario_row
            nombre_completo = f"{row[1]} {row[2]}"

            # Si se está deshabilitando la cuenta, cancelar sus solicitudes activas
            # (pendientes o confirmadas) tanto como cliente o como profesional, y
            # notificar a la contraparte con el motivo.
            cancelled_requests_count = 0
            if not nuevo_estado:
                cancelled_requests_count = _cancel_active_requests_for_disabled_user(
                    cursor, rut, nombre_completo
                )

            # Registrar el cambio en logs (opcional - podría ser una tabla de auditoría)
            logger.info(
                f"Usuario {rut} {'habilitado' if nuevo_estado else 'deshabilitado'} "
                f"por admin {admin_email}. Razón: {razon}. "
                f"Solicitudes canceladas: {cancelled_requests_count}"
            )

            user_role = get_user_role_by_email(cursor, row[3])

            return Response({
                'message': f'Usuario {"habilitado" if nuevo_estado else "deshabilitado"} exitosamente',
                'cancelled_requests': cancelled_requests_count,
                'user': {
                    'rut': row[0],
                    'nombre_completo': nombre_completo,
                    'email': row[3],
                    'rol': user_role,
                    'activo': nuevo_estado
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error cambiando estado del usuario: {str(e)}")
        return Response(
            {'error': f'Error al cambiar estado del usuario: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _estado_solicitud(cancelado_en, completado_en, confirmado_en) -> str:
    if cancelado_en is not None:
        return 'cancelado'
    if completado_en is not None:
        return 'completado'
    if confirmado_en is not None:
        return 'confirmado'
    return 'pendiente'


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_service_history(request, rut):
    """
    Gestor de servicios por usuario (panel de administración).

    Retorna, para un usuario dado (identificado por RUT):
    - Información general.
    - Si ofrece servicios (profesional): el detalle de cada servicio que ofrece
      (categoría, descripción, precio, trabajos completados/cancelados, calificación
      promedio) y el historial transaccional completo como profesional (cliente,
      categoría, fecha, precio, estado y reseña/calificación cuando corresponde).
    - El historial transaccional completo como cliente (profesional, categoría,
      fecha, precio, estado y reseña/calificación que dejó, cuando corresponde),
      independiente de si el usuario también ofrece servicios.
    """
    try:
        with connection.cursor() as cursor:
            role = get_user_role_by_email(cursor, request.user.email)
            if role != 'administrador':
                return Response(
                    {'error': 'No tiene permisos de administrador'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if not str(rut).strip().lstrip('-').isdigit():
                return Response(
                    {'error': 'RUT inválido: debe ser numérico'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            has_digito_verificador = _column_exists(cursor, "usuario", "digito_verificador")
            digito_select_sql = "u.digito_verificador" if has_digito_verificador else "NULL"

            cursor.execute(f"""
                SELECT u.rut, {digito_select_sql}, u.nombres, u.apellidos, u.email, u.telefono,
                       u.creado_en, u.ultima_actividad,
                       COALESCE(au.is_active, TRUE) as activo
                FROM usuario u
                LEFT JOIN auth_user au ON au.email = u.email
                WHERE u.rut = %s
            """, [rut])
            row = cursor.fetchone()
            if not row:
                return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            (u_rut, digito, nombres, apellidos, email, telefono, creado_en, ultima_actividad, activo) = row

            has_hev = _table_exists(cursor, "historial_estado_verificacion_servicio") and \
                _table_exists(cursor, "estado_verificacion_servicio")
            has_trabajos_cols = _column_exists(cursor, "servicio_profesional", "trabajos_completados")

            if has_hev:
                estado_actual_sql = """
                    COALESCE(
                        (SELECT evs.nombre
                         FROM historial_estado_verificacion_servicio h
                         JOIN estado_verificacion_servicio evs
                            ON evs.id_estado_verificacion_servicio = h.id_estado_verificacion_servicio
                         WHERE h.id_servicio_profesional = sp.id_servicio_profesional
                         ORDER BY h.cambiado_en DESC LIMIT 1),
                        'pendiente'
                    )
                """
            else:
                estado_actual_sql = "'aprobado'"

            trabajos_sql = "sp.trabajos_completados, sp.trabajos_cancelados" if has_trabajos_cols else "NULL, NULL"

            # Servicios que ofrece el usuario (si es profesional)
            cursor.execute(f"""
                SELECT sp.id_servicio_profesional, cs.nombre, sp.descripcion, sp.anos_experiencia,
                       sp.precio_fijo, {trabajos_sql},
                       {estado_actual_sql} as estado_verificacion,
                       (SELECT ROUND(AVG(
                            (COALESCE(r.calificacion_calidad,0) + COALESCE(r.calificacion_puntualidad,0) + COALESCE(r.calificacion_comunicacion,0)) / 3.0
                        ), 1)
                        FROM resena r
                        JOIN solicitud_servicio s2 ON s2.id_solicitud_servicio = r.id_solicitud_servicio
                        WHERE s2.id_servicio_profesional = sp.id_servicio_profesional) as calificacion_promedio,
                       (SELECT COUNT(*) FROM resena r
                        JOIN solicitud_servicio s2 ON s2.id_solicitud_servicio = r.id_solicitud_servicio
                        WHERE s2.id_servicio_profesional = sp.id_servicio_profesional) as total_resenas
                FROM servicio_profesional sp
                JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
                WHERE sp.rut_usuario = %s
                ORDER BY cs.nombre
            """, [rut])

            services = []
            for r in cursor.fetchall():
                services.append({
                    'id': str(r[0]),
                    'categoria': r[1],
                    'descripcion': r[2],
                    'anos_experiencia': r[3],
                    'precio_fijo': int(r[4]) if r[4] is not None else 0,
                    'trabajos_completados': r[5] or 0,
                    'trabajos_cancelados': r[6] or 0,
                    'estado_verificacion': r[7],
                    'calificacion_promedio': float(r[8]) if r[8] is not None else None,
                    'total_resenas': r[9] or 0,
                })

            is_professional = len(services) > 0

            # Calificación y estadísticas globales como profesional
            overall_rating = None
            total_reviews = 0
            if is_professional:
                cursor.execute("""
                    SELECT
                        ROUND(AVG(
                            (COALESCE(r.calificacion_calidad,0) + COALESCE(r.calificacion_puntualidad,0) + COALESCE(r.calificacion_comunicacion,0)) / 3.0
                        ), 1),
                        COUNT(*)
                    FROM resena r
                    JOIN solicitud_servicio s ON s.id_solicitud_servicio = r.id_solicitud_servicio
                    WHERE s.rut_profesional = %s
                """, [rut])
                avg_row = cursor.fetchone()
                if avg_row:
                    overall_rating = float(avg_row[0]) if avg_row[0] is not None else None
                    total_reviews = avg_row[1] or 0

            # Historial transaccional como profesional
            professional_history = []
            if is_professional:
                cursor.execute("""
                    SELECT s.id_solicitud_servicio, s.titulo, s.fecha_programada, s.precio_total,
                           s.cancelado_en, s.completado_en, s.confirmado_en,
                           uc.nombres || ' ' || uc.apellidos AS cliente_nombre,
                           cat.nombre AS categoria,
                           re.comentario,
                           CASE WHEN re.id_resena IS NULL THEN NULL
                                ELSE ROUND((COALESCE(re.calificacion_calidad,0) + COALESCE(re.calificacion_puntualidad,0) + COALESCE(re.calificacion_comunicacion,0)) / 3.0, 1)
                           END AS calificacion,
                           re.calificacion_calidad, re.calificacion_puntualidad, re.calificacion_comunicacion
                    FROM solicitud_servicio s
                    JOIN usuario uc ON uc.rut = s.rut_cliente
                    LEFT JOIN servicio_profesional sp ON sp.id_servicio_profesional = s.id_servicio_profesional
                    LEFT JOIN categoria_servicio cat ON cat.id_categoria_servicio = sp.id_categoria_servicio
                    LEFT JOIN resena re ON re.id_solicitud_servicio = s.id_solicitud_servicio
                    WHERE s.rut_profesional = %s
                    ORDER BY s.fecha_programada DESC
                """, [rut])
                for r in cursor.fetchall():
                    (rid, titulo, fecha, precio, cancelado_en, completado_en, confirmado_en,
                     cliente_nombre, categoria, comentario, calificacion, cal_calidad, cal_punt, cal_com) = r
                    professional_history.append({
                        'id': str(rid),
                        'titulo': titulo,
                        'fecha': fecha.isoformat() if hasattr(fecha, 'isoformat') else str(fecha),
                        'precio': int(precio or 0),
                        'estado': _estado_solicitud(cancelado_en, completado_en, confirmado_en),
                        'contraparte': cliente_nombre or 'Cliente',
                        'categoria': categoria,
                        'resena_comentario': comentario,
                        'resena_calificacion': float(calificacion) if calificacion is not None else None,
                        'resena_calidad': int(cal_calidad) if cal_calidad is not None else None,
                        'resena_puntualidad': int(cal_punt) if cal_punt is not None else None,
                        'resena_comunicacion': int(cal_com) if cal_com is not None else None,
                    })

            # Historial transaccional como cliente
            cursor.execute("""
                SELECT s.id_solicitud_servicio, s.titulo, s.fecha_programada, s.precio_total,
                       s.cancelado_en, s.completado_en, s.confirmado_en,
                       up.nombres || ' ' || up.apellidos AS profesional_nombre,
                       cat.nombre AS categoria,
                       re.comentario,
                       CASE WHEN re.id_resena IS NULL THEN NULL
                            ELSE ROUND((COALESCE(re.calificacion_calidad,0) + COALESCE(re.calificacion_puntualidad,0) + COALESCE(re.calificacion_comunicacion,0)) / 3.0, 1)
                       END AS calificacion,
                       re.calificacion_calidad, re.calificacion_puntualidad, re.calificacion_comunicacion
                FROM solicitud_servicio s
                LEFT JOIN usuario up ON up.rut = s.rut_profesional
                LEFT JOIN servicio_profesional sp ON sp.id_servicio_profesional = s.id_servicio_profesional
                LEFT JOIN categoria_servicio cat ON cat.id_categoria_servicio = sp.id_categoria_servicio
                LEFT JOIN resena re ON re.id_solicitud_servicio = s.id_solicitud_servicio
                WHERE s.rut_cliente = %s
                ORDER BY s.fecha_programada DESC
            """, [rut])

            client_history = []
            for r in cursor.fetchall():
                (rid, titulo, fecha, precio, cancelado_en, completado_en, confirmado_en,
                 profesional_nombre, categoria, comentario, calificacion, cal_calidad, cal_punt, cal_com) = r
                client_history.append({
                    'id': str(rid),
                    'titulo': titulo,
                    'fecha': fecha.isoformat() if hasattr(fecha, 'isoformat') else str(fecha),
                    'precio': int(precio or 0),
                    'estado': _estado_solicitud(cancelado_en, completado_en, confirmado_en),
                    'contraparte': profesional_nombre or 'Profesional',
                    'categoria': categoria,
                    'resena_comentario': comentario,
                    'resena_calificacion': float(calificacion) if calificacion is not None else None,
                    'resena_calidad': int(cal_calidad) if cal_calidad is not None else None,
                    'resena_puntualidad': int(cal_punt) if cal_punt is not None else None,
                    'resena_comunicacion': int(cal_com) if cal_com is not None else None,
                })

            return Response({
                'user': {
                    'rut': u_rut,
                    'rut_formateado': _format_rut(u_rut, digito),
                    'nombre_completo': f"{nombres} {apellidos}",
                    'email': email,
                    'telefono': telefono,
                    'activo': activo,
                    'fecha_registro': creado_en.isoformat() if creado_en else None,
                    'ultima_actividad': ultima_actividad.isoformat() if ultima_actividad else None,
                },
                'is_professional': is_professional,
                'overall_rating': overall_rating,
                'total_reviews': total_reviews,
                'services': services,
                'professional_history': professional_history,
                'client_history': client_history,
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error obteniendo historial de servicios del usuario: {str(e)}")
        return Response(
            {'error': f'Error al obtener historial de servicios: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
