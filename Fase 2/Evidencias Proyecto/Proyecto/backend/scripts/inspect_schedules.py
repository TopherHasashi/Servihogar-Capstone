import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','servihogar.settings')
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
print('This script is obsolete: managed schedule models were removed. Use SQL against horario_profesional/periodo_personalizado/dia_bloqueado instead.')
