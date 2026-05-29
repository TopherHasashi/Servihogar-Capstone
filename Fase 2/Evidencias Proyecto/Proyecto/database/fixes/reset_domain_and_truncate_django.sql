-- Reset domain schema and truncate Django data (except migrations/permission metadata)
BEGIN;

-- Drop domain tables (child to parent) if they exist
DROP TABLE IF EXISTS resena CASCADE;
DROP TABLE IF EXISTS disputa CASCADE;
DROP TABLE IF EXISTS pago CASCADE;
DROP TABLE IF EXISTS solicitud_servicio CASCADE;
DROP TABLE IF EXISTS documento_profesional CASCADE;
DROP TABLE IF EXISTS horario_profesional CASCADE;
DROP TABLE IF EXISTS periodo_personalizado CASCADE;
DROP TABLE IF EXISTS dia_bloqueado CASCADE;
DROP TABLE IF EXISTS cuenta_bancaria_profesional CASCADE;
DROP TABLE IF EXISTS cuenta_bancaria_servihogar CASCADE;
DROP TABLE IF EXISTS servicio_profesional CASCADE;
DROP TABLE IF EXISTS notificacion CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS comuna CASCADE;
DROP TABLE IF EXISTS region CASCADE;
DROP TABLE IF EXISTS categoria_servicio CASCADE;

-- Drop legacy/old domain tables if they exist
DROP TABLE IF EXISTS mensaje CASCADE;
DROP TABLE IF EXISTS uso_promocion CASCADE;
DROP TABLE IF EXISTS perfil_profesional CASCADE;
DROP TABLE IF EXISTS promocion CASCADE;
DROP TABLE IF EXISTS log_administrador CASCADE;
DROP TABLE IF EXISTS configuracion_sistema CASCADE;

COMMIT;

-- Truncate selected Django tables (keep schema). Use DO blocks for compatibility
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='auth_user') THEN
		EXECUTE 'TRUNCATE TABLE auth_user RESTART IDENTITY CASCADE';
	END IF;
END$$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='django_session') THEN
		EXECUTE 'TRUNCATE TABLE django_session RESTART IDENTITY CASCADE';
	END IF;
END$$;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='django_admin_log') THEN
		EXECUTE 'TRUNCATE TABLE django_admin_log RESTART IDENTITY CASCADE';
	END IF;
END$$;

-- Note: Do NOT truncate django_migrations, auth_permission, django_content_type
