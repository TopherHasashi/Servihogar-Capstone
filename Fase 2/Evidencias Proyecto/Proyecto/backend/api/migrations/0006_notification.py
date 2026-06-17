from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_categoriaservicio_documentoprofesional_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(
                    choices=[
                        ('verification_approved', 'Servicio aprobado'),
                        ('verification_rejected', 'Servicio rechazado'),
                        ('booking_received', 'Nueva solicitud recibida'),
                        ('booking_confirmed', 'Solicitud confirmada'),
                        ('booking_cancelled', 'Solicitud cancelada'),
                        ('booking_completed', 'Servicio completado'),
                        ('review_received', 'Nueva reseña recibida'),
                    ],
                    max_length=40,
                )),
                ('titulo', models.CharField(max_length=200)),
                ('mensaje', models.TextField()),
                ('leida', models.BooleanField(default=False)),
                ('extra', models.JSONField(blank=True, default=dict)),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-creado_en'],
            },
        ),
    ]
