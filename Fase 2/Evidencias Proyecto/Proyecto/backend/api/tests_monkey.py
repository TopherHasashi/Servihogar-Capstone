"""
Monkey tests para registro y login de usuarios en ServiHogar.

Cubre:
  - Campos obligatorios vacíos / nulos
  - Formatos inválidos: email, RUT, teléfono, fecha de nacimiento, género
  - Límites de longitud
  - Validaciones de edad (menor de 18, mayor de 105)
  - Contraseñas débiles / cortas
  - Duplicados de email y RUT
  - Sensibilidad de mayúsculas/minúsculas en email
  - Inyecciones SQL y XSS
  - Strings extremadamente largos
  - Login con credenciales correctas e incorrectas
  - Login con campos vacíos
  - Login con usuario inactivo
"""

import uuid
from datetime import date, timedelta
from unittest.mock import patch, MagicMock

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

VALID_COMUNA_ID = str(uuid.uuid4())

BASE_PAYLOAD = {
    "first_name": "Juan",
    "last_name": "Pérez",
    "email": "juan.perez@example.com",
    "password": "Segura123!",
    "phone": "+56912345678",
    "rut": "12.345.678-9",
    "gender": "masculino",
    "birth_date": "1990-06-15",
    "address": "Calle Falsa 123",
    "region": "Región del Biobío",
    "district": "Concepción",
    "comuna_id": VALID_COMUNA_ID,
}

LOGIN_URL = "/api/auth/login/"
REGISTER_URL = "/api/auth/register/"


def _payload(**overrides):
    """Devuelve una copia de BASE_PAYLOAD con los campos sobreescritos indicados."""
    data = BASE_PAYLOAD.copy()
    data.update(overrides)
    return data


def _patcher():
    """
    Contexto que anula las dependencias de tablas externas (dominio) para que
    las pruebas funcionen con la BD SQLite del test runner.
    """
    mock_qs = MagicMock()
    mock_qs.exists.return_value = False
    mock_qs.filter.return_value = mock_qs
    mock_qs.exclude.return_value = mock_qs
    mock_qs.first.return_value = None

    patches = [
        # Evitar consultas a la tabla `usuario` del dominio
        patch("api.serializers.UsuarioDominio.objects", mock_qs),
        patch("api.views.UsuarioDominio.objects", mock_qs),
        # Hacer que _upsert_usuario_dominio siempre retorne True
        patch("api.views._upsert_usuario_dominio", return_value=True),
        # Evitar consultas raw SQL a tablas externas (comuna, etc.)
        patch("api.views._resolve_region_comuna", return_value=(None, VALID_COMUNA_ID)),
    ]
    return patches


# ──────────────────────────────────────────────────────────────────────────────
# Mixin base para activar todos los parches
# ──────────────────────────────────────────────────────────────────────────────

class PatchedTestMixin:
    """Activa los parches de dominio externo para cada test."""

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self._active_patches = _patcher()
        for p in self._active_patches:
            p.start()

    def tearDown(self):
        super().tearDown()
        for p in self._active_patches:
            p.stop()


# ──────────────────────────────────────────────────────────────────────────────
# Tests de REGISTRO
# ──────────────────────────────────────────────────────────────────────────────

class RegisterHappyPathTests(PatchedTestMixin, TestCase):
    """Casos válidos que deben retornar HTTP 201."""

    def test_registro_valido_completo(self):
        resp = self.client.post(REGISTER_URL, _payload(), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertIn("user", resp.data)

    def test_telefono_formato_9_digitos(self):
        resp = self.client.post(REGISTER_URL, _payload(phone="912345678"), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_telefono_formato_sin_mas(self):
        resp = self.client.post(REGISTER_URL, _payload(phone="56912345678"), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_usuario_exactamente_18_anios(self):
        today = date.today()
        eighteen_ago = date(today.year - 18, today.month, today.day)
        resp = self.client.post(REGISTER_URL, _payload(
            email="adult18@example.com",
            rut="9.876.543-2",
            birth_date=str(eighteen_ago)
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_usuario_exactamente_105_anios(self):
        today = date.today()
        max_date = date(today.year - 105, today.month, today.day)
        resp = self.client.post(REGISTER_URL, _payload(
            email="old105@example.com",
            rut="8.765.432-1",
            birth_date=str(max_date)
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_password_exactamente_8_caracteres(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="short8pw@example.com",
            rut="7.654.321-0",
            password="Abcd1234"
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_genero_femenino(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="femenino@example.com",
            rut="6.543.210-9",
            gender="femenino"
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_genero_no_binario(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="nobinario@example.com",
            rut="5.432.109-8",
            gender="no_binario"
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_genero_alias_no_binario(self):
        """Aliass 'otro', 'prefiero-no-decir', 'no binario' deben aceptarse."""
        # RUTs únicos para cada alias (mismo formato válido, cuerpos distintos)
        alias_data = [
            ("otro",             "alias_otro@example.com",      "4.321.098-7"),
            ("prefiero-no-decir","alias_pref@example.com",      "3.210.987-6"),
            ("no binario",       "alias_nobinario@example.com", "2.109.876-5"),
            ("nobinario",        "alias_nobinario2@example.com","1.098.765-4"),
            ("no-binario",       "alias_nobinario3@example.com","9.087.654-3"),
        ]
        for alias, email, rut in alias_data:
            resp = self.client.post(REGISTER_URL, _payload(
                email=email,
                rut=rut,
                gender=alias
            ), format="json")
            self.assertEqual(resp.status_code, 201, f"alias {alias!r} debería aceptarse, obtuvo {resp.content}")

    def test_rut_sin_puntos(self):
        """RUT sin puntos pero con guión debe ser aceptado."""
        resp = self.client.post(REGISTER_URL, _payload(
            email="sinpuntos@example.com",
            rut="12345678-9"
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_rut_dv_k_mayuscula(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="dvk@example.com",
            rut="3.210.987-K"
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_rut_dv_k_minuscula(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="dvklow@example.com",
            rut="3.210.987-k"
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_rol_profesional(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="profesional@example.com",
            rut="2.109.876-5",
            role="profesional"
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)


# ──────────────────────────────────────────────────────────────────────────────

class RegisterCamposObligatoriosTests(PatchedTestMixin, TestCase):
    """Campos requeridos vacíos o ausentes deben retornar HTTP 400."""

    def _assert_400(self, **overrides):
        resp = self.client.post(REGISTER_URL, _payload(**overrides), format="json")
        self.assertEqual(resp.status_code, 400, f"Esperaba 400, obtuvo {resp.status_code}: {resp.content}")

    def test_sin_first_name(self):
        self._assert_400(first_name="")

    def test_sin_last_name(self):
        self._assert_400(last_name="")

    def test_sin_email(self):
        self._assert_400(email="")

    def test_sin_password(self):
        self._assert_400(password="")

    def test_sin_phone(self):
        self._assert_400(phone="")

    def test_sin_rut(self):
        self._assert_400(rut="")

    def test_sin_gender(self):
        self._assert_400(gender="")

    def test_sin_address(self):
        self._assert_400(address="")

    def test_sin_birth_date(self):
        payload = _payload()
        del payload["birth_date"]
        resp = self.client.post(REGISTER_URL, payload, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_payload_completamente_vacio(self):
        resp = self.client.post(REGISTER_URL, {}, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_first_name_solo_espacios(self):
        self._assert_400(first_name="   ")

    def test_last_name_solo_espacios(self):
        self._assert_400(last_name="   ")


# ──────────────────────────────────────────────────────────────────────────────

class RegisterEmailTests(PatchedTestMixin, TestCase):
    """Validación del campo email."""

    def test_email_invalido_sin_arroba(self):
        resp = self.client.post(REGISTER_URL, _payload(email="noemail.com"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_email_invalido_dominio_faltante(self):
        resp = self.client.post(REGISTER_URL, _payload(email="user@"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_email_invalido_tld_faltante(self):
        resp = self.client.post(REGISTER_URL, _payload(email="user@domain"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_email_con_espacios(self):
        resp = self.client.post(REGISTER_URL, _payload(email="user @example.com"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_email_duplicado_mismo_caso(self):
        """Dos registros con el mismo email deben fallar en el segundo."""
        self.client.post(REGISTER_URL, _payload(), format="json")
        resp = self.client.post(REGISTER_URL, _payload(rut="9.876.543-2"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_email_duplicado_mayusculas(self):
        """
        MONKEY BUG detectado: si el primero se registra en minúsculas y el segundo
        envía el mismo email en mayúsculas, la validación debe rechazarlo.
        """
        self.client.post(REGISTER_URL, _payload(), format="json")
        upper_email = BASE_PAYLOAD["email"].upper()  # JUAN.PEREZ@EXAMPLE.COM
        resp = self.client.post(REGISTER_URL, _payload(
            email=upper_email,
            rut="9.876.543-2"
        ), format="json")
        self.assertEqual(
            resp.status_code, 400,
            f"Email en mayúsculas duplicado debería ser rechazado (HTTP 400), "
            f"pero retornó {resp.status_code}: {resp.content}"
        )

    def test_email_xss_intento(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email='<script>alert(1)</script>@example.com'
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_email_sql_injection(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="' OR '1'='1"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)


# ──────────────────────────────────────────────────────────────────────────────

class RegisterPasswordTests(PatchedTestMixin, TestCase):
    """Validación del campo contraseña."""

    def test_password_7_caracteres_rechazado(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="pw7@example.com",
            rut="9.876.543-2",
            password="Abc123!"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_password_vacio_rechazado(self):
        resp = self.client.post(REGISTER_URL, _payload(password=""), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_password_muy_largo_aceptado(self):
        """Un password de 200 caracteres debe ser aceptado (no hay límite superior)."""
        resp = self.client.post(REGISTER_URL, _payload(
            email="longpw@example.com",
            rut="8.765.432-1",
            password="A" * 200
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)


# ──────────────────────────────────────────────────────────────────────────────

class RegisterRutTests(PatchedTestMixin, TestCase):
    """Validación del campo RUT."""

    def test_rut_sin_guion(self):
        resp = self.client.post(REGISTER_URL, _payload(rut="123456789"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_rut_sin_numeros(self):
        resp = self.client.post(REGISTER_URL, _payload(rut="abc-def"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_rut_solo_guion(self):
        resp = self.client.post(REGISTER_URL, _payload(rut="-"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_rut_demasiado_largo(self):
        resp = self.client.post(REGISTER_URL, _payload(rut="123.456.789.012-3"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_rut_letras_en_cuerpo(self):
        resp = self.client.post(REGISTER_URL, _payload(rut="AB.CDE.FGH-1"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_rut_dv_letra_distinta_de_k(self):
        resp = self.client.post(REGISTER_URL, _payload(rut="12.345.678-A"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_rut_xss_intento(self):
        resp = self.client.post(REGISTER_URL, _payload(rut='<script>-1'), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_rut_sql_injection(self):
        resp = self.client.post(REGISTER_URL, _payload(rut="12345678-' OR 1=1--"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_rut_duplicado(self):
        """Registrar el mismo RUT dos veces debe rechazar el segundo."""
        self.client.post(REGISTER_URL, _payload(), format="json")
        # Reutilizar UsuarioDominio mock: simular que el RUT ya existe en el segundo intento
        with patch("api.views.UsuarioDominio.objects") as mock_dom:
            mock_qs = MagicMock()
            mock_qs.filter.return_value.exists.return_value = True
            mock_dom.filter.return_value.exists.return_value = True
            mock_dom.filter.return_value.exclude.return_value.first.return_value = None
            mock_dom.objects = mock_qs
            resp = self.client.post(REGISTER_URL, _payload(email="otro@example.com"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)


# ──────────────────────────────────────────────────────────────────────────────

class RegisterPhoneTests(PatchedTestMixin, TestCase):
    """Validación del campo teléfono."""

    def test_telefono_letras_rechazado(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="ph1@example.com", rut="9.876.543-2",
            phone="phonenumber"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_telefono_muy_corto(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="ph2@example.com", rut="9.876.543-2",
            phone="9123"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_telefono_sin_9_inicial(self):
        """Número que no empieza por 9 (ej: línea fija) debe ser rechazado."""
        resp = self.client.post(REGISTER_URL, _payload(
            email="ph3@example.com", rut="9.876.543-2",
            phone="212345678"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_telefono_codigo_pais_incorrecto(self):
        """Código de país distinto a 56 debe ser rechazado."""
        resp = self.client.post(REGISTER_URL, _payload(
            email="ph4@example.com", rut="9.876.543-2",
            phone="+54912345678"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_telefono_solo_espacios(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="ph5@example.com", rut="9.876.543-2",
            phone="   "
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)


# ──────────────────────────────────────────────────────────────────────────────

class RegisterFechaTests(PatchedTestMixin, TestCase):
    """Validación del campo birth_date."""

    def test_fecha_formato_invalido(self):
        resp = self.client.post(REGISTER_URL, _payload(birth_date="not-a-date"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_fecha_formato_dia_mes_anio(self):
        """DD/MM/YYYY no es el formato esperado (ISO)."""
        resp = self.client.post(REGISTER_URL, _payload(birth_date="15/06/1990"), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_menor_de_18_rechazado(self):
        today = date.today()
        minor = date(today.year - 17, today.month, today.day)
        resp = self.client.post(REGISTER_URL, _payload(
            email="minor@example.com", rut="9.876.543-2",
            birth_date=str(minor)
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_exactamente_un_dia_antes_de_18(self):
        today = date.today()
        almost_18 = date(today.year - 18, today.month, today.day) + timedelta(days=1)
        resp = self.client.post(REGISTER_URL, _payload(
            email="almost18@example.com", rut="9.876.543-2",
            birth_date=str(almost_18)
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_mayor_de_105_rechazado(self):
        today = date.today()
        too_old = date(today.year - 106, today.month, today.day)
        resp = self.client.post(REGISTER_URL, _payload(
            email="tooold@example.com", rut="9.876.543-2",
            birth_date=str(too_old)
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_fecha_futura_rechazada(self):
        tomorrow = date.today() + timedelta(days=1)
        resp = self.client.post(REGISTER_URL, _payload(
            email="future@example.com", rut="9.876.543-2",
            birth_date=str(tomorrow)
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_fecha_anio_cero(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="year0@example.com", rut="9.876.543-2",
            birth_date="0000-01-01"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)


# ──────────────────────────────────────────────────────────────────────────────

class RegisterGeneroTests(PatchedTestMixin, TestCase):
    """Validación del campo género."""

    def test_genero_invalido(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="gv1@example.com", rut="9.876.543-2",
            gender="alien"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_genero_numerico(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="gv2@example.com", rut="9.876.543-2",
            gender="1"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_genero_xss(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="gv3@example.com", rut="9.876.543-2",
            gender="<script>alert(1)</script>"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)


# ──────────────────────────────────────────────────────────────────────────────

class RegisterLongitudTests(PatchedTestMixin, TestCase):
    """Límites de longitud de campos."""

    def test_first_name_max_150_aceptado(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="fn150@example.com", rut="9.876.543-2",
            first_name="A" * 150
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_first_name_151_rechazado(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="fn151@example.com", rut="9.876.543-2",
            first_name="A" * 151
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_address_max_255_aceptado(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="addr255@example.com", rut="9.876.543-2",
            address="A" * 255
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_address_256_rechazado(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="addr256@example.com", rut="9.876.543-2",
            address="A" * 256
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_rut_max_20_caracteres(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="rutlong@example.com",
            rut="1" * 21 + "-9"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)


# ──────────────────────────────────────────────────────────────────────────────

class RegisterInyeccionTests(PatchedTestMixin, TestCase):
    """Intentos de inyección en campos de texto libre."""

    def test_first_name_html_aceptado_sin_ejecucion(self):
        """La API acepta HTML en nombres (responsabilidad del frontend el escape)."""
        resp = self.client.post(REGISTER_URL, _payload(
            email="html@example.com", rut="9.876.543-2",
            first_name="<b>Juan</b>"
        ), format="json")
        # DRF no rechaza HTML en CharField — el test verifica que no hay error de servidor
        self.assertIn(resp.status_code, [201, 400], resp.content)

    def test_address_sql_injection(self):
        """SQL injection en address no debe causar error 500."""
        resp = self.client.post(REGISTER_URL, _payload(
            email="sqladdrr@example.com", rut="9.876.543-2",
            address="'; DROP TABLE users; --"
        ), format="json")
        self.assertNotEqual(resp.status_code, 500, "SQL injection causó error 500")

    def test_first_name_unicode_extremo(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="unicode@example.com", rut="9.876.543-2",
            first_name="José María"
        ), format="json")
        self.assertEqual(resp.status_code, 201, resp.content)

    def test_null_byte_en_email(self):
        resp = self.client.post(REGISTER_URL, _payload(
            email="test\x00@example.com"
        ), format="json")
        self.assertEqual(resp.status_code, 400, resp.content)


# ──────────────────────────────────────────────────────────────────────────────
# Tests de LOGIN
# ──────────────────────────────────────────────────────────────────────────────

class LoginHappyPathTests(PatchedTestMixin, TestCase):

    def setUp(self):
        super().setUp()
        # Crear usuario directamente con email lowercase como username
        self.user = User.objects.create_user(
            username="user@test.com",
            email="user@test.com",
            password="Correcta123!"
        )

    def test_login_credenciales_correctas(self):
        resp = self.client.post(LOGIN_URL, {
            "username": "user@test.com",
            "password": "Correcta123!"
        }, format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)

    def test_login_email_en_campo_username(self):
        """simplejwt usa 'username' como campo de credencial."""
        resp = self.client.post(LOGIN_URL, {
            "username": "user@test.com",
            "password": "Correcta123!"
        }, format="json")
        self.assertEqual(resp.status_code, 200, resp.content)


class LoginInvalidTests(PatchedTestMixin, TestCase):

    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            username="logintest@test.com",
            email="logintest@test.com",
            password="Correcta123!"
        )

    def test_password_incorrecto(self):
        resp = self.client.post(LOGIN_URL, {
            "username": "logintest@test.com",
            "password": "Incorrecta999!"
        }, format="json")
        self.assertEqual(resp.status_code, 401, resp.content)

    def test_usuario_no_existente(self):
        resp = self.client.post(LOGIN_URL, {
            "username": "noexiste@test.com",
            "password": "CualquierCosa1!"
        }, format="json")
        self.assertEqual(resp.status_code, 401, resp.content)

    def test_campos_vacios(self):
        resp = self.client.post(LOGIN_URL, {
            "username": "",
            "password": ""
        }, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_sin_username(self):
        resp = self.client.post(LOGIN_URL, {
            "password": "Correcta123!"
        }, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_sin_password(self):
        resp = self.client.post(LOGIN_URL, {
            "username": "logintest@test.com"
        }, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_payload_vacio(self):
        resp = self.client.post(LOGIN_URL, {}, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_sql_injection_en_username(self):
        resp = self.client.post(LOGIN_URL, {
            "username": "' OR '1'='1",
            "password": "anything"
        }, format="json")
        self.assertNotEqual(resp.status_code, 200, "SQL injection no debe otorgar acceso")
        self.assertNotEqual(resp.status_code, 500, "SQL injection no debe causar error 500")

    def test_xss_en_username(self):
        resp = self.client.post(LOGIN_URL, {
            "username": "<script>alert(1)</script>",
            "password": "anything"
        }, format="json")
        self.assertNotEqual(resp.status_code, 200, resp.content)

    def test_password_muy_largo(self):
        """Un password de 1000 caracteres no debe causar error 500."""
        resp = self.client.post(LOGIN_URL, {
            "username": "logintest@test.com",
            "password": "A" * 1000
        }, format="json")
        self.assertNotEqual(resp.status_code, 500, resp.content)

    def test_usuario_inactivo_rechazado(self):
        self.user.is_active = False
        self.user.save()
        resp = self.client.post(LOGIN_URL, {
            "username": "logintest@test.com",
            "password": "Correcta123!"
        }, format="json")
        self.assertEqual(resp.status_code, 401, resp.content)

    def test_login_sensible_mayusculas(self):
        """
        MONKEY BUG detectado: simplejwt compara username de forma exacta.
        LOGIN con email en mayúsculas debe FALLAR si el username está en minúsculas.
        """
        resp = self.client.post(LOGIN_URL, {
            "username": "LOGINTEST@TEST.COM",
            "password": "Correcta123!"
        }, format="json")
        self.assertEqual(
            resp.status_code, 401,
            "Login con email en mayúsculas debería fallar (username almacenado en minúsculas)"
        )


# ──────────────────────────────────────────────────────────────────────────────

class LoginCampoUsernameTests(PatchedTestMixin, TestCase):
    """Verifica que el campo correcto para login es 'username', no 'email'."""

    def setUp(self):
        super().setUp()
        User.objects.create_user(
            username="campo@test.com",
            email="campo@test.com",
            password="Test1234!"
        )

    def test_enviar_campo_email_en_lugar_de_username_falla(self):
        """
        El endpoint /api/auth/login/ usa simplejwt que espera 'username'.
        Si el frontend envía 'email' en lugar de 'username', debe fallar.
        """
        resp = self.client.post(LOGIN_URL, {
            "email": "campo@test.com",
            "password": "Test1234!"
        }, format="json")
        self.assertEqual(
            resp.status_code, 400,
            f"Enviar 'email' en vez de 'username' debe devolver 400, "
            f"obtuvo {resp.status_code}: {resp.content}"
        )
