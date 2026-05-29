from django.db.models.signals import post_save, post_migrate
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Profile
import os
from django.conf import settings
from django.db import connection
import uuid


@receiver(post_save, sender=User)
def create_user_profile(sender, instance: User, created: bool, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)


@receiver(post_migrate)
def ensure_default_admin(sender, **kwargs):
    """
    Create or ensure a default admin exists. Idempotent.
    Uses env vars DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD if provided,
    otherwise falls back to the requested credentials.
    """
    try:
        email = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@servihogar.cl').strip().lower()
        password = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'Admin2025!ServiHogar')
        if not email:
            return
        username = email
        try:
            user = User.objects.get(username=username)
            created = False
        except User.DoesNotExist:
            # Fallback: if a legacy 'admin' user exists, migrate it to the email username
            try:
                legacy = User.objects.get(username='admin')
                legacy.username = username
                legacy.email = email
                legacy.first_name = legacy.first_name or 'Admin'
                legacy.last_name = legacy.last_name or 'ServiHogar'
                user = legacy
                created = False
            except User.DoesNotExist:
                user = User(
                    username=username,
                    email=email,
                    first_name='Admin',
                    last_name='ServiHogar',
                )
                created = True
        updated = False
        # Always ensure password is set to the desired one in dev unless disabled
        force_pw = os.environ.get('FORCE_DEFAULT_ADMIN_PASSWORD', '1') == '1'
        if created or force_pw:
            user.set_password(password)
            updated = True
        # Ensure admin flags
        if not user.is_staff:
            user.is_staff = True
            updated = True
        if not user.is_superuser:
            user.is_superuser = True
            updated = True
        if updated:
            user.save()
        # Ensure profile exists for admin user as well
        Profile.objects.get_or_create(user=user)
    except Exception:
        # Avoid breaking migrations if anything goes wrong
        pass


@receiver(post_migrate)
def ensure_default_verifier(sender, **kwargs):
    """
    Create or ensure a default verifier exists. Idempotent.
    Uses env vars DEFAULT_VERIFIER_EMAIL and DEFAULT_VERIFIER_PASSWORD if provided.
    """
    try:
        email = os.environ.get('DEFAULT_VERIFIER_EMAIL', 'verificador@servihogar.cl').strip().lower()
        password = os.environ.get('DEFAULT_VERIFIER_PASSWORD', 'Verifier2025!ServiHogar')
        if not email:
            return
        username = email
        try:
            user = User.objects.get(username=username)
            created = False
        except User.DoesNotExist:
            user = User(
                username=username,
                email=email,
                first_name='Verificador',
                last_name='ServiHogar',
            )
            created = True

        updated = False
        # Ensure it's not admin
        if user.is_staff or user.is_superuser:
            user.is_staff = False
            user.is_superuser = False
            updated = True

        force_pw = os.environ.get('FORCE_DEFAULT_VERIFIER_PASSWORD', '1') == '1'
        if created or force_pw:
            user.set_password(password)
            updated = True

        if updated or created:
            user.save()

        profile, _ = Profile.objects.get_or_create(user=user)
        if profile.role != 'verificador':
            profile.role = 'verificador'
            profile.save(update_fields=['role'])
    except Exception:
        # Avoid breaking migrations if anything goes wrong
        pass


@receiver(post_migrate)
def ensure_service_categories(sender, **kwargs):
    """
    Seed default service categories if categoria_servicio is empty or missing entries.
    Idempotent: checks by slug or lower(nombre) before insert.
    """
    try:
        categories = [
            ("gasfiteria", "Gasfitería"),
            ("limpieza", "Limpieza del Hogar"),
            ("jardineria", "Jardinería"),
        ]
        with connection.cursor() as cur:
            for slug, nombre in categories:
                try:
                    cur.execute(
                        """
                        SELECT 1 FROM categoria_servicio 
                        WHERE slug=%s OR lower(nombre)=lower(%s)
                        LIMIT 1
                        """,
                        [slug, nombre],
                    )
                    exists = cur.fetchone() is not None
                    if not exists:
                        cur.execute(
                            """
                            INSERT INTO categoria_servicio (id_categoria_servicio, nombre, slug)
                            VALUES (%s, %s, %s)
                            """,
                            [str(uuid.uuid4()), nombre, slug],
                        )
                except Exception:
                    # if table missing or other issue, skip to avoid breaking migration
                    continue
    except Exception:
        # Never break migrations due to seeding
        pass
