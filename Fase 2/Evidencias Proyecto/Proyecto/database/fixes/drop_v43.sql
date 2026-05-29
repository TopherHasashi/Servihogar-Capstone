BEGIN;
-- Tablas historial
DROP TABLE IF EXISTS historial_genero_usuario CASCADE;
DROP TABLE IF EXISTS historial_rol_usuario CASCADE;
DROP TABLE IF EXISTS historial_estado_solicitud CASCADE;
DROP TABLE IF EXISTS historial_estado_verificacion_servicio CASCADE;
DROP TABLE IF EXISTS historial_tipo_notificacion CASCADE;

-- Catálogos
DROP TABLE IF EXISTS genero CASCADE;
DROP TABLE IF EXISTS rol CASCADE;
DROP TABLE IF EXISTS estado_solicitud CASCADE;
DROP TABLE IF EXISTS estado_verificacion_servicio CASCADE;
DROP TABLE IF EXISTS tipo_notificacion CASCADE;

-- Resto de tablas V4.2
DROP TABLE IF EXISTS pago CASCADE;
DROP TABLE IF EXISTS resena CASCADE;
DROP TABLE IF EXISTS notificacion CASCADE;
DROP TABLE IF EXISTS disputa CASCADE;
DROP TABLE IF EXISTS solicitud_servicio CASCADE;
DROP TABLE IF EXISTS documento_profesional CASCADE;
DROP TABLE IF EXISTS dia_bloqueado CASCADE;
DROP TABLE IF EXISTS periodo_personalizado CASCADE;
DROP TABLE IF EXISTS horario_profesional CASCADE;
DROP TABLE IF EXISTS cuenta_bancaria_profesional CASCADE;
DROP TABLE IF EXISTS cuenta_bancaria_servihogar CASCADE;
DROP TABLE IF EXISTS servicio_profesional CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS categoria_servicio CASCADE;
DROP TABLE IF EXISTS comuna CASCADE;
DROP TABLE IF EXISTS region CASCADE;

COMMIT;