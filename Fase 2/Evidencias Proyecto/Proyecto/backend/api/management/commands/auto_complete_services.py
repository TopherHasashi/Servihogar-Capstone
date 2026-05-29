"""
Comando para auto-completar servicios después de 3 días de la fecha del servicio.
Se puede ejecutar manualmente con: python manage.py auto_complete_services
O configurarse en un cron job para ejecutarse diariamente.
"""
from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
	help = 'Auto-completa servicios confirmados después de 3 días de la fecha del servicio'

	def add_arguments(self, parser):
		parser.add_argument(
			'--dry-run',
			action='store_true',
			help='Muestra qué servicios se completarían sin hacer cambios',
		)

	def handle(self, *args, **options):
		dry_run = options['dry_run']
		
		# Fecha límite: hace 3 días
		fecha_limite = timezone.now() - timedelta(days=3)
		
		self.stdout.write(f"Buscando servicios confirmados con fecha anterior a: {fecha_limite}")
		
		with connection.cursor() as cur:
			# Buscar servicios confirmados que ya pasaron 3 días
			cur.execute(
				"""
				SELECT id_solicitud_servicio, rut_cliente, rut_profesional, 
				       fecha_programada, estado
				FROM solicitud_servicio
				WHERE estado = 'confirmado'
				  AND fecha_programada <= %s
				ORDER BY fecha_programada
				""",
				[fecha_limite]
			)
			
			servicios = cur.fetchall()
		
		if not servicios:
			self.stdout.write(self.style.SUCCESS('No hay servicios para auto-completar'))
			return
		
		self.stdout.write(f"Encontrados {len(servicios)} servicio(s) para auto-completar:")
		
		completados = 0
		for servicio in servicios:
			id_solicitud, rut_cliente, rut_prof, fecha_programada, estado_actual = servicio
			
			self.stdout.write(
				f"  - ID: {id_solicitud}, Cliente: {rut_cliente}, "
				f"Profesional: {rut_prof}, Fecha programada: {fecha_programada}"
			)
			
			if not dry_run:
				with connection.cursor() as cur:
					cur.execute(
						"""
						UPDATE solicitud_servicio
						SET estado='completado', 
						    completado_en=%s, 
						    actualizado_en=%s
						WHERE id_solicitud_servicio=%s
						""",
						[timezone.now(), timezone.now(), id_solicitud]
					)
				
				logger.info(f"Auto-completado servicio {id_solicitud} (fecha programada: {fecha_programada})")
				completados += 1
		
		if dry_run:
			self.stdout.write(
				self.style.WARNING(
					f'\nModo DRY RUN: {len(servicios)} servicio(s) serían auto-completados'
				)
			)
		else:
			self.stdout.write(
				self.style.SUCCESS(
					f'\n✅ {completados} servicio(s) auto-completados exitosamente'
				)
			)
