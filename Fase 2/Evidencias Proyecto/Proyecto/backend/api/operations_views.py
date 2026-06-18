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
from .permission_utils import get_user_role_by_email

logger = logging.getLogger(__name__)


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

            # Paginación
            page = int(request.GET.get('page', 1))
            page_size = min(int(request.GET.get('page_size', 20)), 100)
            offset = (page - 1) * page_size

            # Filtros
            role_filter = request.GET.get('role', '').strip()
            search_filter = request.GET.get('search', '').strip()
            status_filter = request.GET.get('status', '').strip()

            # Construcción de la consulta base
            where_clauses = []
            params = []

            if role_filter:
                where_clauses.append("u.rol = %s")
                params.append(role_filter)

            if search_filter:
                where_clauses.append("""
                    (u.nombres ILIKE %s 
                     OR u.apellidos ILIKE %s 
                     OR u.email ILIKE %s 
                     OR u.rut ILIKE %s)
                """)
                search_pattern = f'%{search_filter}%'
                params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

            if status_filter == 'activo':
                where_clauses.append("u.activo = TRUE")
            elif status_filter == 'inactivo':
                where_clauses.append("u.activo = FALSE")

            where_sql = ' AND '.join(where_clauses) if where_clauses else '1=1'

            # Contar total de registros
            count_query = f"""
                SELECT COUNT(*) 
                FROM usuario u
                WHERE {where_sql}
            """
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

            # Obtener usuarios con paginación
            list_query = f"""
                SELECT 
                    u.rut,
                    u.nombres,
                    u.apellidos,
                    u.email,
                    u.telefono,
                    u.rol,
                    u.activo,
                    u.fecha_registro,
                    u.ultima_actividad,
                    (SELECT COUNT(*) FROM solicitud_servicio WHERE rut_cliente = u.rut) as solicitudes_como_cliente,
                    (SELECT COUNT(*) FROM solicitud_servicio WHERE rut_profesional = u.rut) as solicitudes_como_profesional
                FROM usuario u
                WHERE {where_sql}
                ORDER BY u.fecha_registro DESC
                LIMIT %s OFFSET %s
            """
            cursor.execute(list_query, params + [page_size, offset])

            users = []
            for row in cursor.fetchall():
                users.append({
                    'rut': row[0],
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
                    'solicitudes_como_profesional': row[10] or 0
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

            admin_email = request.user.email
            nuevo_estado = request.data.get('activo', False)
            razon = request.data.get('razon', 'Sin razón especificada')

            # No permitir desactivar al propio usuario administrador
            cursor.execute("SELECT rut FROM usuario WHERE email = %s", [admin_email])
            admin_rut = cursor.fetchone()
            if admin_rut and admin_rut[0] == rut:
                return Response(
                    {'error': 'No puedes desactivar tu propia cuenta'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Actualizar el estado del usuario
            cursor.execute("""
                UPDATE usuario
                SET activo = %s,
                    actualizado_en = NOW()
                WHERE rut = %s
                RETURNING rut, nombres, apellidos, email, rol, activo
            """, [nuevo_estado, rut])

            row = cursor.fetchone()
            if not row:
                return Response(
                    {'error': 'Usuario no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Registrar el cambio en logs (opcional - podría ser una tabla de auditoría)
            logger.info(
                f"Usuario {rut} {'habilitado' if nuevo_estado else 'deshabilitado'} "
                f"por admin {admin_email}. Razón: {razon}"
            )

            return Response({
                'message': f'Usuario {"habilitado" if nuevo_estado else "deshabilitado"} exitosamente',
                'user': {
                    'rut': row[0],
                    'nombre_completo': f"{row[1]} {row[2]}",
                    'email': row[3],
                    'rol': row[4],
                    'activo': row[5]
                }
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error cambiando estado del usuario: {str(e)}")
        return Response(
            {'error': f'Error al cambiar estado del usuario: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
