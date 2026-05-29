-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN DE PERFORMANCE
-- Panel de Administración ServiHogar
-- ========================================

-- Índices para tabla solicitud_servicio (queries más frecuentes)
CREATE INDEX IF NOT EXISTS idx_solicitud_estado ON solicitud_servicio(estado);
CREATE INDEX IF NOT EXISTS idx_solicitud_fecha_solicitud ON solicitud_servicio(fecha_solicitud DESC);
CREATE INDEX IF NOT EXISTS idx_solicitud_rut_cliente ON solicitud_servicio(rut_cliente);
CREATE INDEX IF NOT EXISTS idx_solicitud_rut_profesional ON solicitud_servicio(rut_profesional);
CREATE INDEX IF NOT EXISTS idx_solicitud_servicio_prof ON solicitud_servicio(id_servicio_profesional);

-- Índice compuesto para operaciones (búsqueda de problemas)
CREATE INDEX IF NOT EXISTS idx_solicitud_estado_comentarios 
ON solicitud_servicio(estado, fecha_solicitud DESC) 
WHERE comentarios_cancelacion IS NOT NULL;

-- Índices para tabla pago (queries de dashboard y operaciones)
CREATE INDEX IF NOT EXISTS idx_pago_estado ON pago(estado);
CREATE INDEX IF NOT EXISTS idx_pago_fecha ON pago(fecha_pago DESC);
CREATE INDEX IF NOT EXISTS idx_pago_solicitud ON pago(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_pago_creado_en ON pago(creado_en DESC);

-- Índice compuesto para pagos problemáticos
CREATE INDEX IF NOT EXISTS idx_pago_estado_fecha 
ON pago(estado, fecha_pago DESC) 
WHERE estado = 'pendiente';

-- Índices para tabla usuario (joins frecuentes)
CREATE INDEX IF NOT EXISTS idx_usuario_ultima_actividad ON usuario(ultima_actividad DESC);
CREATE INDEX IF NOT EXISTS idx_usuario_creado_en ON usuario(creado_en DESC);

-- Índices para servicio_profesional
CREATE INDEX IF NOT EXISTS idx_servicio_prof_verificado ON servicio_profesional(verificado);
CREATE INDEX IF NOT EXISTS idx_servicio_prof_categoria ON servicio_profesional(id_categoria_servicio);
CREATE INDEX IF NOT EXISTS idx_servicio_prof_usuario ON servicio_profesional(rut_usuario);

-- Índices para reseñas (dashboard ratings)
CREATE INDEX IF NOT EXISTS idx_resena_puntuacion ON resena(puntuacion);
CREATE INDEX IF NOT EXISTS idx_resena_creado_en ON resena(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_resena_evaluado ON resena(rut_evaluado);

-- Índices para cuenta_bancaria_servihogar
CREATE INDEX IF NOT EXISTS idx_cuenta_banco_estado ON cuenta_bancaria_servihogar(estado);
CREATE INDEX IF NOT EXISTS idx_cuenta_banco_prioridad ON cuenta_bancaria_servihogar(prioridad);
CREATE INDEX IF NOT EXISTS idx_cuenta_banco_numero ON cuenta_bancaria_servihogar(numero_cuenta);

-- Índice para configuracion_sistema
CREATE INDEX IF NOT EXISTS idx_config_clave ON configuracion_sistema(clave);

-- ========================================
-- ANÁLISIS DE ESTADÍSTICAS DESPUÉS DE CREAR ÍNDICES
-- ========================================
ANALYZE solicitud_servicio;
ANALYZE pago;
ANALYZE usuario;
ANALYZE servicio_profesional;
ANALYZE resena;
ANALYZE cuenta_bancaria_servihogar;
ANALYZE configuracion_sistema;

-- ========================================
-- VERIFICAR ÍNDICES CREADOS
-- ========================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'solicitud_servicio',
        'pago',
        'usuario',
        'servicio_profesional',
        'resena',
        'cuenta_bancaria_servihogar',
        'configuracion_sistema'
    )
ORDER BY tablename, indexname;
