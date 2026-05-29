from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_alter_profile_role'),
    ]

    operations = [
        migrations.CreateModel(
            name='ServiceSchedule',
            fields=[
                ('service_id', models.UUIDField(primary_key=True, serialize=False)),
                ('weekly_template', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'api_service_schedule',
            },
        ),
        migrations.CreateModel(
            name='ServiceCustomPeriod',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('weekly_template', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('schedule', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='custom_periods', to='api.serviceschedule')),
            ],
            options={
                'db_table': 'api_service_custom_period',
            },
        ),
        migrations.CreateModel(
            name='ServiceUnavailability',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('reason', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('schedule', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='unavailabilities', to='api.serviceschedule')),
            ],
            options={
                'db_table': 'api_service_unavailability',
            },
        ),
    ]
