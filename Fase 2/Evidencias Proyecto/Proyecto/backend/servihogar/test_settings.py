"""
Settings específicos para el test runner (usa SQLite en memoria).
Uso: python manage.py test --settings=servihogar.test_settings
"""
from .settings import *  # noqa: F401, F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Acelerar hashing de contraseñas en tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Silenciar warnings de correo en tests
EMAIL_BACKEND = "django.core.mail.backends.dummy.EmailBackend"
