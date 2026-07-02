-- ═══════════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: rut VARCHAR(12) → rut INTEGER + digito_verificador CHAR(1)
-- Aplica el cambio introducido en servihogar_produccion_2026.sql v4.3
-- ═══════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 1. ELIMINAR FK CONSTRAINTS DE TABLAS HIJAS
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE documento_profesional         DROP CONSTRAINT IF EXISTS documento_profesional_rut_usuario_fkey;
ALTER TABLE documento_profesional         DROP CONSTRAINT IF EXISTS documento_profesional_rut_verificador_fkey;
ALTER TABLE historial_genero_usuario      DROP CONSTRAINT IF EXISTS historial_genero_usuario_rut_usuario_fkey;
ALTER TABLE historial_rol_usuario         DROP CONSTRAINT IF EXISTS historial_rol_usuario_rut_usuario_fkey;
ALTER TABLE notificacion                  DROP CONSTRAINT IF EXISTS notificacion_rut_usuario_fkey;
ALTER TABLE resena                        DROP CONSTRAINT IF EXISTS resena_rut_evaluado_fkey;
ALTER TABLE resena                        DROP CONSTRAINT IF EXISTS resena_rut_evaluador_fkey;
ALTER TABLE servicio_profesional          DROP CONSTRAINT IF EXISTS servicio_profesional_rut_usuario_fkey;
ALTER TABLE servicio_profesional          DROP CONSTRAINT IF EXISTS servicio_profesional_rut_verificador_fkey;
ALTER TABLE solicitud_servicio            DROP CONSTRAINT IF EXISTS solicitud_servicio_rut_cliente_fkey;
ALTER TABLE solicitud_servicio            DROP CONSTRAINT IF EXISTS solicitud_servicio_rut_profesional_fkey;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 2. ELIMINAR PK DE usuario
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_pkey;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 3. AGREGAR digito_verificador A usuario (nullable temporalmente)
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS digito_verificador CHAR(1);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 4. POBLAR digito_verificador DESDE EL FORMATO EXISTENTE (XX.XXX.XXX-D)
-- ─────────────────────────────────────────────────────────────────────────────────
UPDATE usuario
SET digito_verificador = UPPER(SPLIT_PART(rut, '-', 2));

-- ─────────────────────────────────────────────────────────────────────────────────
-- 5. CONVERTIR rut EN usuario: VARCHAR → INTEGER (extrae parte numérica sin puntos)
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE usuario
    ALTER COLUMN rut TYPE INTEGER
    USING SPLIT_PART(REPLACE(rut::TEXT, '.', ''), '-', 1)::INTEGER;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 6. APLICAR NOT NULL Y CHECK A digito_verificador
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE usuario ALTER COLUMN digito_verificador SET NOT NULL;
ALTER TABLE usuario ADD CONSTRAINT usuario_digito_verificador_check
    CHECK (digito_verificador ~ '^[0-9K]$');

-- ─────────────────────────────────────────────────────────────────────────────────
-- 7. CONVERTIR COLUMNAS FK EN TABLAS HIJAS: VARCHAR → INTEGER
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE servicio_profesional
    ALTER COLUMN rut_usuario TYPE INTEGER
    USING SPLIT_PART(REPLACE(rut_usuario::TEXT, '.', ''), '-', 1)::INTEGER;

ALTER TABLE servicio_profesional
    ALTER COLUMN rut_verificador TYPE INTEGER
    USING CASE WHEN rut_verificador IS NULL THEN NULL
               ELSE SPLIT_PART(REPLACE(rut_verificador::TEXT, '.', ''), '-', 1)::INTEGER
          END;

ALTER TABLE historial_genero_usuario
    ALTER COLUMN rut_usuario TYPE INTEGER
    USING SPLIT_PART(REPLACE(rut_usuario::TEXT, '.', ''), '-', 1)::INTEGER;

ALTER TABLE historial_rol_usuario
    ALTER COLUMN rut_usuario TYPE INTEGER
    USING SPLIT_PART(REPLACE(rut_usuario::TEXT, '.', ''), '-', 1)::INTEGER;

ALTER TABLE documento_profesional
    ALTER COLUMN rut_usuario TYPE INTEGER
    USING SPLIT_PART(REPLACE(rut_usuario::TEXT, '.', ''), '-', 1)::INTEGER;

ALTER TABLE documento_profesional
    ALTER COLUMN rut_verificador TYPE INTEGER
    USING CASE WHEN rut_verificador IS NULL THEN NULL
               ELSE SPLIT_PART(REPLACE(rut_verificador::TEXT, '.', ''), '-', 1)::INTEGER
          END;

ALTER TABLE solicitud_servicio
    ALTER COLUMN rut_cliente TYPE INTEGER
    USING SPLIT_PART(REPLACE(rut_cliente::TEXT, '.', ''), '-', 1)::INTEGER;

ALTER TABLE solicitud_servicio
    ALTER COLUMN rut_profesional TYPE INTEGER
    USING CASE WHEN rut_profesional IS NULL THEN NULL
               ELSE SPLIT_PART(REPLACE(rut_profesional::TEXT, '.', ''), '-', 1)::INTEGER
          END;

ALTER TABLE resena
    ALTER COLUMN rut_evaluador TYPE INTEGER
    USING SPLIT_PART(REPLACE(rut_evaluador::TEXT, '.', ''), '-', 1)::INTEGER;

ALTER TABLE resena
    ALTER COLUMN rut_evaluado TYPE INTEGER
    USING SPLIT_PART(REPLACE(rut_evaluado::TEXT, '.', ''), '-', 1)::INTEGER;

ALTER TABLE notificacion
    ALTER COLUMN rut_usuario TYPE INTEGER
    USING SPLIT_PART(REPLACE(rut_usuario::TEXT, '.', ''), '-', 1)::INTEGER;

-- ─────────────────────────────────────────────────────────────────────────────────
-- 8. RECREAR PK EN usuario
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE usuario ADD PRIMARY KEY (rut);

-- ─────────────────────────────────────────────────────────────────────────────────
-- 9. RECREAR FK CONSTRAINTS
-- ─────────────────────────────────────────────────────────────────────────────────
ALTER TABLE documento_profesional
    ADD CONSTRAINT documento_profesional_rut_usuario_fkey
    FOREIGN KEY (rut_usuario) REFERENCES usuario(rut) ON DELETE CASCADE;

ALTER TABLE documento_profesional
    ADD CONSTRAINT documento_profesional_rut_verificador_fkey
    FOREIGN KEY (rut_verificador) REFERENCES usuario(rut);

ALTER TABLE historial_genero_usuario
    ADD CONSTRAINT historial_genero_usuario_rut_usuario_fkey
    FOREIGN KEY (rut_usuario) REFERENCES usuario(rut) ON DELETE CASCADE;

ALTER TABLE historial_rol_usuario
    ADD CONSTRAINT historial_rol_usuario_rut_usuario_fkey
    FOREIGN KEY (rut_usuario) REFERENCES usuario(rut) ON DELETE CASCADE;

ALTER TABLE notificacion
    ADD CONSTRAINT notificacion_rut_usuario_fkey
    FOREIGN KEY (rut_usuario) REFERENCES usuario(rut);

ALTER TABLE resena
    ADD CONSTRAINT resena_rut_evaluado_fkey
    FOREIGN KEY (rut_evaluado) REFERENCES usuario(rut);

ALTER TABLE resena
    ADD CONSTRAINT resena_rut_evaluador_fkey
    FOREIGN KEY (rut_evaluador) REFERENCES usuario(rut);

ALTER TABLE servicio_profesional
    ADD CONSTRAINT servicio_profesional_rut_usuario_fkey
    FOREIGN KEY (rut_usuario) REFERENCES usuario(rut) ON DELETE CASCADE;

ALTER TABLE servicio_profesional
    ADD CONSTRAINT servicio_profesional_rut_verificador_fkey
    FOREIGN KEY (rut_verificador) REFERENCES usuario(rut);

ALTER TABLE solicitud_servicio
    ADD CONSTRAINT solicitud_servicio_rut_cliente_fkey
    FOREIGN KEY (rut_cliente) REFERENCES usuario(rut);

ALTER TABLE solicitud_servicio
    ADD CONSTRAINT solicitud_servicio_rut_profesional_fkey
    FOREIGN KEY (rut_profesional) REFERENCES usuario(rut);

COMMIT;
