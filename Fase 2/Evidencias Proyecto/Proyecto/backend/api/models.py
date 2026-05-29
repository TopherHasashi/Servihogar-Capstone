from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
	ROLE_CHOICES = (
		("cliente", "Cliente"),
		("profesional", "Profesional"),
		("verificador", "Verificador"),
	)

	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
	rut = models.CharField(max_length=20, blank=True)
	gender = models.CharField(max_length=32, blank=True)
	birth_date = models.DateField(null=True, blank=True)
	phone = models.CharField(max_length=32, blank=True)
	region = models.CharField(max_length=100, blank=True)
	district = models.CharField(max_length=100, blank=True)
	address = models.CharField(max_length=255, blank=True)
	# URL pública del avatar del usuario (guardada por endpoint de subida)
	avatar_url = models.TextField(blank=True)
	role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="cliente")
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self) -> str:
		return f"Perfil de {self.user.username}"


class UsuarioDominio(models.Model):
	"""Unmanaged mapping a la tabla `usuario` definida en DDL (RUT como PK, id_comuna UUID).

	Importante: Los campos deben reflejar exactamente las columnas reales de la tabla.
	"""
	# PK v3.0
	rut = models.CharField(max_length=12, primary_key=True)
	# Campos obligatorios
	nombres = models.CharField(max_length=100)
	apellidos = models.CharField(max_length=100)
	email = models.EmailField(unique=True)
	telefono = models.CharField(max_length=20)
	# En la tabla es TIMESTAMP NOT NULL; lo modelamos como DateTimeField
	fecha_nacimiento = models.DateTimeField()
	id_comuna = models.UUIDField()
	direccion = models.TextField()
	foto_perfil = models.BinaryField(null=True, blank=True)
	# Flags/campos opcionales existentes en DDL
	email_verificado = models.BooleanField(default=False)
	ultima_actividad = models.DateTimeField(null=True)
	creado_en = models.DateTimeField()
	actualizado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = "usuario"

	def __str__(self) -> str:
		return f"UsuarioDominio<{self.rut} - {self.email}>"


class CategoriaServicio(models.Model):
	"""Unmanaged mapping for categoria_servicio table."""
	id_categoria_servicio = models.UUIDField(primary_key=True)
	nombre = models.CharField(max_length=50)
	slug = models.CharField(max_length=50)

	class Meta:
		managed = False
		db_table = "categoria_servicio"

	def __str__(self) -> str:
		return f"CategoriaServicio<{self.slug}>"


"""
Modelo PerfilProfesional removido (Opción A). La verificación y datos generales
se gestionan por servicio en servicio_profesional.estado_verificacion.
"""


class ServicioProfesional(models.Model):
	"""Unmanaged mapping for servicio_profesional table."""
	id_servicio_profesional = models.UUIDField(primary_key=True)
	rut_usuario = models.CharField(max_length=12)
	id_categoria_servicio = models.UUIDField()
	anos_experiencia = models.CharField(max_length=10)
	descripcion = models.TextField()
	tipo_duracion = models.CharField(max_length=10)
	duracion_fija_minutos = models.IntegerField(null=True)
	duracion_minima_minutos = models.IntegerField(null=True)
	duracion_maxima_minutos = models.IntegerField(null=True)
	precio_fijo = models.IntegerField()
	estado_verificacion = models.CharField(max_length=20)
	creado_en = models.DateTimeField()
	actualizado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = "servicio_profesional"

	def __str__(self) -> str:
		return f"ServicioProfesional<{self.id_servicio_profesional} - {self.rut_usuario}>"


class DocumentoProfesional(models.Model):
	"""Unmanaged mapping for documento_profesional table."""
	id_documento_profesional = models.UUIDField(primary_key=True)
	rut_usuario = models.CharField(max_length=12)
	id_servicio_profesional = models.UUIDField(null=True)
	tipo_documento = models.CharField(max_length=30)
	url_archivo = models.TextField()
	tipo_mime = models.CharField(max_length=100, null=True)
	estado_verificacion = models.CharField(max_length=20)
	rut_verificador = models.CharField(max_length=12, null=True)
	verificado_en = models.DateTimeField(null=True)
	razon_rechazo = models.TextField(null=True)
	subido_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = "documento_profesional"

	def __str__(self) -> str:
		return f"DocumentoProfesional<{self.id_documento_profesional}>"


"""
Modelos administrados de schedule/visibility removidos. Usaremos las tablas del dominio:
 - horario_profesional
 - periodo_personalizado
 - dia_bloqueado
La visibilidad pública se mapeará a servicio_profesional.estado_verificacion ('aprobado' visible, 'suspendido' oculto).
"""

class HorarioProfesional(models.Model):
	id_horario_profesional = models.UUIDField(primary_key=True)
	id_servicio_profesional = models.UUIDField()
	dia_semana = models.IntegerField()
	hora_inicio = models.TimeField()
	hora_fin = models.TimeField()
	creado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = 'horario_profesional'


class PeriodoPersonalizado(models.Model):
	id_periodo_personalizado = models.UUIDField(primary_key=True)
	id_servicio_profesional = models.UUIDField()
	fecha_inicio = models.DateField()
	fecha_fin = models.DateField()
	hora_inicio = models.TimeField()
	hora_fin = models.TimeField()
	descripcion = models.CharField(max_length=200, null=True)
	creado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = 'periodo_personalizado'


class DiaBloqueado(models.Model):
	id_dia_bloqueado = models.UUIDField(primary_key=True)
	id_servicio_profesional = models.UUIDField()
	fecha = models.DateField()
	motivo = models.TextField(null=True)
	creado_en = models.DateTimeField()

	class Meta:
		managed = False
		db_table = 'dia_bloqueado'
