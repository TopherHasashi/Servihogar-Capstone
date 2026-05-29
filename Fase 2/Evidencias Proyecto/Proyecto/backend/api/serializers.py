from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile, UsuarioDominio


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "rut",
            "gender",
            "birth_date",
            "phone",
            "region",
            "district",
            "address",
            "avatar_url",
            "role",
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    effective_role = serializers.SerializerMethodField()

    def get_effective_role(self, obj: User):
        # Map Django flags to admin; otherwise use profile.role; default to cliente
        if obj.is_superuser or obj.is_staff:
            return 'administrador'
        role = getattr(getattr(obj, 'profile', None), 'role', None)
        return role or 'cliente'

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile",
            "is_staff",
            "is_superuser",
            "effective_role",
        ]


class TimeSlotSerializer(serializers.Serializer):
    start = serializers.CharField()
    end = serializers.CharField()


class DayScheduleSerializer(serializers.Serializer):
    enabled = serializers.BooleanField()
    timeSlots = TimeSlotSerializer(many=True)


class WeeklyTemplateSerializer(serializers.Serializer):
    monday = DayScheduleSerializer(required=False)
    tuesday = DayScheduleSerializer(required=False)
    wednesday = DayScheduleSerializer(required=False)
    thursday = DayScheduleSerializer(required=False)
    friday = DayScheduleSerializer(required=False)
    saturday = DayScheduleSerializer(required=False)
    sunday = DayScheduleSerializer(required=False)


class UnavailabilitySerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    reason = serializers.CharField(required=False, allow_blank=True)


class CustomPeriodSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    name = serializers.CharField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    weekly_template = WeeklyTemplateSerializer()


class ServiceScheduleSerializer(serializers.Serializer):
    weekly_template = WeeklyTemplateSerializer()
    unavailabilities = UnavailabilitySerializer(many=True)
    custom_periods = CustomPeriodSerializer(many=True)


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    # Profile fields (required to satisfy domain table constraints)
    phone = serializers.CharField(required=True, allow_blank=False, max_length=32)
    rut = serializers.CharField(required=True, allow_blank=False, max_length=20)
    gender = serializers.CharField(required=True, allow_blank=False, max_length=32)
    birth_date = serializers.DateField(required=True)
    # Preferimos comuna_id (UUID). Si no viene, aceptamos region + district por nombre
    comuna_id = serializers.UUIDField(required=False, allow_null=True)
    region = serializers.CharField(required=False, allow_blank=True, max_length=100)
    district = serializers.CharField(required=False, allow_blank=True, max_length=100)
    address = serializers.CharField(required=True, allow_blank=False, max_length=255)
    role = serializers.ChoiceField(choices=[("cliente", "Cliente"), ("profesional", "Profesional")], required=False)

    def validate_email(self, value):
        # Normalizar a minúsculas antes de validar para evitar duplicados por diferencia de caso
        value = value.lower().strip()
        if User.objects.filter(username=value).exists() or User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ya existe un usuario con este email")
        # Validar también contra la tabla principal de dominio `usuario`
        try:
            if UsuarioDominio.objects.filter(email__iexact=value).exists():
                raise serializers.ValidationError("Este email ya está registrado en el sistema principal. Inicia sesión o recupera tu contraseña.")
        except Exception:
            # Si falla la consulta (por ejemplo, DB no disponible), no bloquear aquí; la vista validará de nuevo
            pass
        return value

    def validate_rut(self, value):
        v = (value or '').strip()
        if not v:
            raise serializers.ValidationError("RUT es requerido")
        # Validación simple de formato chileno con guión verificador (no calculamos dígito aquí)
        # Acepta con o sin puntos: 12.345.678-9 o 12345678-9
        import re
        pattern = re.compile(r"^(\d{1,2}\.?\d{3}\.?\d{3}-[0-9Kk])$")
        if not pattern.match(v):
            raise serializers.ValidationError("Formato de RUT inválido (ej: 12.345.678-9)")
        # No permitir crear un segundo usuario si el RUT ya existe en la tabla principal `usuario`
        try:
            if UsuarioDominio.objects.filter(rut=v).exists():
                raise serializers.ValidationError("Este RUT ya está registrado en el sistema principal. Inicia sesión o recupera tu contraseña.")
        except Exception:
            # Si la consulta falla (p.ej. DB no accesible), dejaremos que la vista haga el chequeo final
            pass
        return v

    def validate_gender(self, value):
        v = (value or '').strip().lower()
        if v in {"masculino", "femenino", "no_binario"}:
            return v
        if v in {"otro", "prefiero-no-decir", "no binario", "nobinario", "no-binario"}:
            return "no_binario"
        raise serializers.ValidationError("Género inválido. Use: masculino, femenino, no_binario")

    def validate_phone(self, value):
        # Acepta formatos: +56912345678, 56912345678, 912345678
        # Limpia y valida que tenga el formato correcto
        import re
        v = (value or '').strip()
        if not v:
            raise serializers.ValidationError("Teléfono es requerido")
        # Remover espacios y caracteres especiales excepto '+'
        clean = re.sub(r'[^\d+]', '', v)
        # Verificar formato chileno: debe tener 9 dígitos después del código de país
        # Formatos aceptados: +56912345678 (11 dígitos con +), 56912345678 (11 dígitos), 912345678 (9 dígitos)
        digits_only = clean.replace('+', '')
        if len(digits_only) == 9:
            # Formato: 912345678 - agregar código de país
            if not digits_only.startswith('9'):
                raise serializers.ValidationError("Número celular debe comenzar con 9")
            return '+56' + digits_only
        elif len(digits_only) == 11 and digits_only.startswith('56'):
            # Formato: 56912345678
            if not digits_only[2] == '9':
                raise serializers.ValidationError("Número celular debe comenzar con 9 después del código de país")
            return '+' + digits_only
        else:
            raise serializers.ValidationError("Formato de teléfono inválido. Use: +56912345678 o 912345678")

    def validate_birth_date(self, value):
        # Rechaza menores de 18 años
        from datetime import date
        if not value:
            raise serializers.ValidationError("Fecha de nacimiento es requerida")
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError("Debes ser mayor de 18 años para registrarte en ServiHogar")
        # Rechaza mayores a 105 años
        if age > 105:
            raise serializers.ValidationError("La edad máxima permitida es 105 años para registrarte en ServiHogar")
        return value

    def validate(self, attrs):
        # Debe venir comuna_id o bien region + district
        comuna_id = attrs.get("comuna_id")
        region = (attrs.get("region") or "").strip()
        district = (attrs.get("district") or "").strip()
        if not comuna_id and (not region or not district):
            raise serializers.ValidationError({
                "comuna_id": "Requerido si no se envía región y comuna por nombre",
                "region": "Requerido si no se envía comuna_id",
                "district": "Requerido si no se envía comuna_id",
            })
        return attrs

    def create(self, validated_data):
        # Pop profile fields
        phone = validated_data.pop("phone", "")
        rut = validated_data.pop("rut", "")
        gender = validated_data.pop("gender", "")
        birth_date = validated_data.pop("birth_date", None)
        region = validated_data.pop("region", "")
        district = validated_data.pop("district", "")
        comuna_id = validated_data.pop("comuna_id", None)
        address = validated_data.pop("address", "")
        role = validated_data.pop("role", "cliente")

        email = validated_data["email"].lower().strip()
        password = validated_data["password"]
        first_name = validated_data.get("first_name", "").strip()
        last_name = validated_data.get("last_name", "").strip()

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        # Use get_or_create to avoid duplicate profile when post_save signal already created one
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.phone = phone
        profile.rut = rut
        profile.gender = gender
        profile.birth_date = birth_date
        profile.region = region
        profile.district = district
        profile.address = address
        profile.role = role or "cliente"
        profile.save()
        # Guardamos comuna_id en el serializer para que la vista lo use en el upsert
        self._saved_user = user
        self._saved_comuna_id = str(comuna_id) if comuna_id else None
        self._saved_rut = rut
        return user
