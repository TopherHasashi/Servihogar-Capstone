-- ═══════════════════════════════════════════════════════════════════════════════════
-- SERVIHOGAR - BASE DE DATOS PRODUCCIÓN 2026
-- Plataforma de Servicios para el Hogar (Gasfitería, Limpieza, Jardinería)
-- Versión: 4.3 | Año: 2026
-- Motor: PostgreSQL 14+
-- Desarrollado por: Matias Reuque (Scrum Master) & Juan Silva (Product Owner)
-- ───────────────────────────────────────────────────────────────────────────────────
-- CAMBIOS RESPECTO A V4.2:
--   ✅ Eliminadas FK directas de entidades a catálogos (evita triángulo/bucle)
--   ✅ Relación entidad ↔ catálogo pasa ÚNICAMENTE por la tabla historial
--   ✅ Estado actual = registro más reciente en la tabla historial correspondiente
--   ✅ Eliminados triggers que auto-poblaban historial desde entidad (app gestiona inserts)
--   ✅ 22 tablas activas — misma estructura, lógica de relaciones corregida
-- ───────────────────────────────────────────────────────────────────────────────────
-- PATRÓN APLICADO:
--   entidad  ──FK──>  historial_X  ──FK──>  catalogo_X
--   (NO existe FK directa de entidad a catalogo_X)
--
-- Para obtener estado/tipo actual de una entidad:
--   SELECT c.nombre FROM historial_X h
--   JOIN catalogo_X c ON h.id_x = c.id_x
--   WHERE h.id_entidad = :id
--   ORDER BY h.cambiado_en DESC LIMIT 1;
-- ───────────────────────────────────────────────────────────────────────────────────
-- TABLAS ACTIVAS (22):
--   Geografía        (2): region, comuna
--   Configuración    (1): categoria_servicio
--   Catálogos        (5): genero, rol, estado_solicitud,
--                         estado_verificacion_servicio, tipo_notificacion
--   Usuarios/Servs   (7): usuario, servicio_profesional, horario_profesional,
--                         periodo_personalizado, dia_bloqueado,
--                         documento_profesional, solicitud_servicio
--   Comunicación     (2): resena, notificacion
--   Historial        (5): historial_genero_usuario, historial_rol_usuario,
--                         historial_estado_solicitud,
--                         historial_estado_verificacion_servicio,
--                         historial_tipo_notificacion
-- ═══════════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 1. CONFIGURACIÓN INICIAL
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

SET timezone = 'America/Santiago';
SET client_encoding = 'UTF8';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 2. TABLAS DE CONFIGURACIÓN GEOGRÁFICA
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE region (
    id_region UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE region IS 'Regiones administrativas de Chile';
COMMENT ON COLUMN region.codigo IS 'Código oficial de la región (I, II, III, ..., XV, RM)';

CREATE TABLE comuna (
    id_comuna UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_region UUID NOT NULL REFERENCES region(id_region) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_region, nombre)
);

COMMENT ON TABLE comuna IS 'Comunas de Chile agrupadas por región';

-- Seeds región y comunas (idempotentes)
INSERT INTO region (nombre, codigo) VALUES ('Región Metropolitana', 'RM') ON CONFLICT (nombre) DO NOTHING;

WITH rm AS (SELECT id_region FROM region WHERE codigo='RM' LIMIT 1)
INSERT INTO comuna (id_region, nombre, codigo)
SELECT rm.id_region, v.nombre, v.codigo FROM rm
CROSS JOIN (VALUES ('Santiago','STGO'),('Providencia','PROV'),('Las Condes','LCON'),('Maipú','MAIP'),('Ñuñoa','NUNO')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

INSERT INTO region (nombre, codigo) VALUES
    ('Arica y Parinacota','XV'),('Tarapacá','I'),('Antofagasta','II'),('Atacama','III'),
    ('Coquimbo','IV'),('Valparaíso','V'),('O''Higgins','VI'),('Maule','VII'),('Ñuble','XVI'),
    ('Biobío','VIII'),('La Araucanía','IX'),('Los Ríos','XIV'),('Los Lagos','X'),
    ('Aysén','XI'),('Magallanes y Antártica Chilena','XII')
ON CONFLICT (nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Arica y Parinacota')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Arica','ARICA'),('Camarones','CAM'),('Putre','PUT'),('General Lagos','GLA')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Tarapacá')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Iquique','IQQ'),('Alto Hospicio','AHOS'),('Pozo Almonte','PAL'),('Camiña','CAMI'),('Colchane','COL'),('Huara','HUA'),('Pica','PICA')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Antofagasta')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Antofagasta','ANF'),('Mejillones','MEJ'),('Sierra Gorda','SGO'),('Taltal','TAL'),('Calama','CAL'),('Ollagüe','OLL'),('San Pedro de Atacama','SPA'),('Tocopilla','TOC'),('María Elena','MEL')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Atacama')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Copiapó','COP'),('Caldera','CALD'),('Tierra Amarilla','TAM'),('Chañaral','CHA'),('Diego de Almagro','DAL'),('Vallenar','VAL'),('Huasco','HUA3'),('Freirina','FRE'),('Alto del Carmen','ADC')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Coquimbo')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('La Serena','LS'),('Coquimbo','CQB'),('Andacollo','AND'),('La Higuera','LH'),('Paihuano','PAI'),('Vicuña','VIC'),('Illapel','ILL'),('Canela','CAN'),('Los Vilos','LV'),('Salamanca','SAL'),('Ovalle','OVL'),('Combarbalá','COM'),('Monte Patria','MP'),('Punitaqui','PUN'),('Río Hurtado','RH')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Valparaíso')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Valparaíso','VALP'),('Viña del Mar','VDM'),('Concón','CONC'),('Quintero','QTR'),('Puchuncaví','PUC'),('Casablanca','CAS'),('Juan Fernández','JF'),
           ('Quillota','QUI'),('La Calera','LCA'),('La Cruz','LCR'),('Nogales','NOG'),('Hijuelas','HIJ'),
           ('San Antonio','SA'),('Cartagena','CAR'),('El Tabo','ETB'),('El Quisco','EQ'),('Algarrobo','ALG'),
           ('San Felipe','SFE'),('Llaillay','LLA'),('Catemu','CAT'),('Panquehue','PAN'),('Putaendo','PUTA'),('Santa María','SM'),
           ('Los Andes','LAN'),('Calle Larga','CLL'),('Rinconada','RIN'),('San Esteban','SE'),
           ('La Ligua','LLI'),('Cabildo','CAB'),('Zapallar','ZAP'),('Papudo','PAP'),
           ('Quilpué','QPE'),('Villa Alemana','VA'),('Limache','LIM'),('Olmué','OLM')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='O''Higgins')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Rancagua','RAN'),('Machalí','MAC'),('Graneros','GRA'),('Doñihue','DON'),('Coltauco','COLT'),('Coinco','COI'),('Las Cabras','LC'),('Requínoa','REQ'),('Rengo','REN'),('Olivar','OLI'),('Malloa','MAL'),('Quinta de Tilcoco','QDT'),('San Vicente','SV'),('Pichidegua','PIC'),('Peumo','PEU'),
           ('San Fernando','SFE2'),('Chimbarongo','CHI'),('Nancagua','NAN'),('Placilla','PLA'),('Santa Cruz','SCR'),('Palmilla','PALM'),('Peralillo','PER'),('Lolol','LOL'),('Pumanque','PUM'),
           ('Pichilemu','PMU'),('La Estrella','LES'),('Litueche','LIT'),('Marchigüe','MAR'),('Navidad','NAV'),('Paredones','PAR')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Maule')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Talca','TALC'),('Constitución','CON'),('Curepto','CUR'),('Empedrado','EMP'),('Maule','MAU'),('Pelarco','PEL'),('Pencahue','PEN'),('Río Claro','RCL'),('San Clemente','SCL'),('San Rafael','SRF'),
           ('Curicó','CURC'),('Hualañé','HUA2'),('Licantén','LIC'),('Molina','MOL'),('Rauco','RAU'),('Romeral','ROM'),('Sagrada Familia','SAG'),('Teno','TEN'),('Vichuquén','VIC2'),
           ('Linares','LIN'),('Colbún','COLB'),('Longaví','LON'),('Parral','PAR2'),('Retiro','RET'),('San Javier','SJ'),('Villa Alegre','VAL2'),('Yerbas Buenas','YB'),
           ('Cauquenes','CAU'),('Chanco','CHA2'),('Pelluhue','PEL2')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Ñuble')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Chillán','CHN'),('Chillán Viejo','CHV'),('Bulnes','BUL'),('Quillón','QUI2'),('San Ignacio','SIG'),('El Carmen','ELC'),('Pemuco','PEM'),('Yungay','YUN'),('San Carlos','SCA'),('Coihueco','COI2'),('San Fabián','SFB'),('Ñiquén','NIQ'),('San Nicolás','SNI'),('Ninhue','NIN'),('Portezuelo','POR'),('Quirihue','QUIR'),('Cobquecura','COB'),('Trehuaco','TRE'),('Ránquil','RAN'),('Coelemu','COE')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Biobío')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Concepción','CONC2'),('Coronel','COR'),('Chiguayante','CHI3'),('Florida','FLO'),('Hualpén','HUA4'),('Hualqui','HUA5'),('Lota','LOT'),('Penco','PEN2'),('San Pedro de la Paz','SPDLP'),('Santa Juana','SJU'),('Talcahuano','TAL2'),('Tomé','TOM'),
           ('Los Ángeles','LAN2'),('Antuco','ANT'),('Cabrero','CAB2'),('Laja','LAJ'),('Mulchén','MUL'),('Nacimiento','NAC'),('Negrete','NEG'),('Quilaco','QLC'),('Quilleco','QLL'),('San Rosendo','SRS'),('Santa Bárbara','SBA'),('Tucapel','TUC'),('Yumbel','YUM'),('Alto Biobío','ABI'),
           ('Arauco','ARU'),('Cañete','CAN2'),('Contulmo','CON3'),('Curanilahue','CUR2'),('Lebu','LEB'),('Los Álamos','LAL'),('Tirúa','TIR')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='La Araucanía')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Temuco','TEM'),('Carahue','CAR2'),('Cholchol','CHO'),('Cunco','CUN'),('Curarrehue','CUR3'),('Freire','FRE2'),('Galvarino','GAL'),('Gorbea','GOR'),('Lautaro','LAU'),('Loncoche','LON2'),('Melipeuco','MEL2'),('Nueva Imperial','NIM'),('Padre Las Casas','PLC'),('Perquenco','PER2'),('Pitrufquén','PIT'),('Pucón','PUC2'),('Saavedra','SAA'),('Teodoro Schmidt','TS'),('Toltén','TOL'),('Vilcún','VIL'),('Villarrica','VIC3'),
           ('Angol','ANG'),('Collipulli','COL2'),('Curacautín','CUR4'),('Ercilla','ERC'),('Lonquimay','LQM'),('Los Sauces','LSA'),('Lumaco','LUM'),('Purén','PUR'),('Renaico','REN2'),('Traiguén','TRA'),('Victoria','VIC4')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Los Ríos')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Valdivia','VAL2'),('Corral','COR2'),('Lanco','LAN3'),('Los Lagos','LLG'),('Máfil','MAF'),('Mariquina','MAR2'),('Paillaco','PAI2'),('Panguipulli','PAN2'),('La Unión','LUN'),('Futrono','FUT'),('Lago Ranco','LR'),('Río Bueno','RBU')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Los Lagos')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Puerto Montt','PMT'),('Calbuco','CAL2'),('Cochamó','COC'),('Maullín','MAU2'),('Puerto Varas','PVA'),('Llanquihue','LLA2'),('Frutillar','FRU'),('Fresia','FRE3'),('Los Muermos','LMU'),
           ('Osorno','OSO'),('Puyehue','PUY'),('Río Negro','RNE'),('Purranque','PUR2'),('San Pablo','SPB'),
           ('Castro','CAS2'),('Ancud','ANC'),('Quellón','QUE'),('Quemchi','QUEM'),('Dalcahue','DAL2'),('Curaco de Vélez','CDV'),('Puqueldón','PUQ'),('Queilén','QEI'),('Chonchi','CHO2'),
           ('Chaitén','CHA3'),('Futaleufú','FUT2'),('Hualaihué','HUA6'),('Palena','PAL2')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Aysén')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Coyhaique','COY'),('Lago Verde','LVE'),('Aysén','AYS'),('Cisnes','CIS'),('Guaitecas','GUA'),('Cochrane','COC2'),('O''Higgins','OH'),('Tortel','TOR'),('Chile Chico','CHC'),('Río Ibáñez','RIB')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

WITH r AS (SELECT id_region FROM region WHERE nombre='Magallanes y Antártica Chilena')
INSERT INTO comuna (id_region, nombre, codigo) SELECT r.id_region, v.nombre, v.codigo FROM r CROSS JOIN (
    VALUES ('Punta Arenas','PA'),('Laguna Blanca','LAG'),('Río Verde','RVE'),('San Gregorio','SGR'),('Cabo de Hornos','CDH'),('Antártica','ANTC'),('Porvenir','POR2'),('Primavera','PRI'),('Timaukel','TIM'),('Puerto Natales','PNA'),('Torres del Paine','TDP')) AS v(nombre,codigo)
ON CONFLICT (id_region, nombre) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 3. CATEGORÍAS DE SERVICIOS
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE categoria_servicio (
    id_categoria_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    descripcion_corta VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categoria_servicio IS 'Categorías de servicios ofrecidos (Gasfitería, Limpieza, Jardinería, etc.)';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 4. TABLAS CATÁLOGO (LOOKUP) - ESTADOS Y TIPOS NORMALIZADOS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Catálogo de géneros
CREATE TABLE genero (
    id_genero UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(20) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE genero IS 'Catálogo de géneros disponibles para usuarios';

INSERT INTO genero (nombre, descripcion) VALUES
    ('masculino',  'Género masculino'),
    ('femenino',   'Género femenino'),
    ('no_binario', 'Género no binario')
ON CONFLICT (nombre) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────────

-- Catálogo de roles de usuario
CREATE TABLE rol (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(20) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE rol IS 'Catálogo de roles disponibles para usuarios';

INSERT INTO rol (nombre, descripcion) VALUES
    ('cliente',        'Usuario que solicita servicios del hogar'),
    ('profesional',    'Proveedor de servicios del hogar'),
    ('administrador',  'Administrador de la plataforma ServiHogar'),
    ('verificador',    'Verificador de documentos y profesionales')
ON CONFLICT (nombre) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────────

-- Catálogo de estados para solicitud_servicio
CREATE TABLE estado_solicitud (
    id_estado_solicitud UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(20) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE estado_solicitud IS 'Catálogo de estados posibles para una solicitud de servicio';

INSERT INTO estado_solicitud (nombre, descripcion) VALUES
    ('pendiente',   'Esperando aceptación del profesional'),
    ('confirmado',  'Profesional aceptó la solicitud'),
    ('en_progreso', 'Trabajo iniciado por el profesional'),
    ('completado',  'Trabajo terminado exitosamente'),
    ('cancelado',   'Solicitud cancelada por cliente o profesional')
ON CONFLICT (nombre) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────────

-- Catálogo de estados de verificación para servicio_profesional
CREATE TABLE estado_verificacion_servicio (
    id_estado_verificacion_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(20) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE estado_verificacion_servicio IS 'Catálogo de estados de verificación para servicios de profesionales';

INSERT INTO estado_verificacion_servicio (nombre, descripcion) VALUES
    ('pendiente',   'Pendiente de revisión por un verificador'),
    ('en_revision', 'En proceso de revisión activa'),
    ('aprobado',    'Servicio verificado y aprobado para operar'),
    ('rechazado',   'Servicio rechazado por incumplimiento de requisitos'),
    ('suspendido',  'Servicio suspendido temporalmente')
ON CONFLICT (nombre) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────────

-- Catálogo de tipos de notificación
CREATE TABLE tipo_notificacion (
    id_tipo_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tipo_notificacion IS 'Catálogo de tipos de notificaciones del sistema';

INSERT INTO tipo_notificacion (nombre, descripcion) VALUES
    ('solicitud_servicio', 'Notificación relacionada a una solicitud de servicio'),
    ('resena',             'Notificación de nueva reseña recibida'),
    ('verificacion',       'Notificación de verificación de documentos o servicios'),
    ('mensaje',            'Mensaje directo de otro usuario'),
    ('sistema',            'Notificación automática del sistema')
ON CONFLICT (nombre) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 5. SISTEMA DE USUARIOS MULTI-ROL - RUT COMO PK
--    NOTA: genero y rol NO son FK directas; se obtienen via historial_genero_usuario
--          e historial_rol_usuario (registro más reciente = valor actual)
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE usuario (
    rut VARCHAR(12) PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    fecha_nacimiento TIMESTAMP NOT NULL,
    id_comuna UUID NOT NULL REFERENCES comuna(id_comuna),
    direccion TEXT NOT NULL,

    -- CAMPOS OPCIONALES
    foto_perfil BYTEA,

    -- VERIFICACIÓN DE CUENTA
    email_verificado BOOLEAN DEFAULT false,

    -- TIMESTAMPS
    ultima_actividad TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuario IS 'Tabla central de usuarios con sistema multi-rol';
COMMENT ON COLUMN usuario.rut IS 'RUT chileno formato 12.345.678-9 - CLAVE PRIMARIA';
COMMENT ON COLUMN usuario.id_comuna IS 'Comuna de residencia - región se obtiene mediante JOIN';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 6. SISTEMA DE PROFESIONALES - MÚLTIPLES SERVICIOS (MÁXIMO 3)
--    NOTA: estado_verificacion NO es FK directa; se obtiene via
--          historial_estado_verificacion_servicio (registro más reciente = estado actual)
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE servicio_profesional (
    id_servicio_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    id_categoria_servicio UUID NOT NULL REFERENCES categoria_servicio(id_categoria_servicio),

    -- CONFIGURACIÓN ESPECÍFICA POR SERVICIO
    anos_experiencia VARCHAR(10) NOT NULL,
    descripcion TEXT NOT NULL,

    -- CONFIGURACIÓN DE DURACIÓN
    tipo_duracion VARCHAR(10) NOT NULL CHECK (tipo_duracion IN ('fija', 'rango')),
    duracion_fija_minutos INTEGER,
    duracion_minima_minutos INTEGER,
    duracion_maxima_minutos INTEGER,

    -- PRECIO FIJO EN CLP
    precio_fijo INTEGER NOT NULL CHECK (precio_fijo > 0),

    -- VERIFICACIÓN (quién verificó y motivo de rechazo; estado en historial)
    rut_verificador VARCHAR(12) REFERENCES usuario(rut),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,

    -- MÉTRICAS
    trabajos_completados INTEGER DEFAULT 0,
    trabajos_cancelados INTEGER DEFAULT 0,

    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(rut_usuario, id_categoria_servicio)
);

COMMENT ON TABLE servicio_profesional IS 'Servicios específicos ofrecidos por cada profesional (máximo 3)';
COMMENT ON COLUMN servicio_profesional.precio_fijo IS 'Precio fijo del servicio en CLP, no varía por tiempo';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 7. SISTEMA DE HORARIOS AVANZADO (3 NIVELES DE JERARQUÍA)
-- ═══════════════════════════════════════════════════════════════════════════════════

-- NIVEL 1: Horario base semanal
CREATE TABLE horario_profesional (
    id_horario_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_servicio_profesional, dia_semana, hora_inicio)
);

COMMENT ON TABLE horario_profesional IS 'Horario base semanal del profesional - Nivel 1';
COMMENT ON COLUMN horario_profesional.dia_semana IS '0 = Domingo, 1 = Lunes, ..., 6 = Sábado';

-- NIVEL 2: Períodos personalizados (sobrescribe horario base)
CREATE TABLE periodo_personalizado (
    id_periodo_personalizado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    dia_semana INTEGER CHECK (dia_semana >= 0 AND dia_semana <= 6),
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion VARCHAR(200),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (fecha_fin >= fecha_inicio)
);

COMMENT ON TABLE periodo_personalizado IS 'Períodos personalizados que sobrescriben horario base - Nivel 2';
COMMENT ON COLUMN periodo_personalizado.dia_semana IS '0=Domingo...6=Sábado; NULL=aplica al rango de fechas completo';

-- NIVEL 3: Días específicos bloqueados
CREATE TABLE dia_bloqueado (
    id_dia_bloqueado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    motivo TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE dia_bloqueado IS 'Días específicos bloqueados - Nivel 3';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 8. DOCUMENTOS Y VERIFICACIÓN DIFERENCIADA
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE documento_profesional (
    id_documento_profesional UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE SET NULL,

    tipo_documento VARCHAR(30) NOT NULL CHECK (tipo_documento IN (
        'certificado_antecedentes',
        'certificado_experiencia'
    )),
    tipo_mime BYTEA,

    estado_verificacion VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado_verificacion IN ('pendiente', 'aprobado', 'rechazado')),
    rut_verificador VARCHAR(12) REFERENCES usuario(rut),
    verificado_en TIMESTAMP,
    razon_rechazo TEXT,

    subido_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE documento_profesional IS 'Documentos del profesional con verificación diferenciada';
COMMENT ON COLUMN documento_profesional.id_servicio_profesional IS 'NULL=antecedentes globales, UUID=documento por servicio';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 9. SOLICITUDES DE SERVICIO
--    NOTA: estado NO es FK directa; se obtiene via historial_estado_solicitud
--          (registro más reciente = estado actual)
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE solicitud_servicio (
    id_solicitud_servicio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_cliente VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    rut_profesional VARCHAR(12) REFERENCES usuario(rut),
    id_servicio_profesional UUID REFERENCES servicio_profesional(id_servicio_profesional),

    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,

    fecha_programada TIMESTAMP NOT NULL,
    duracion_minutos INTEGER,

    direccion_servicio TEXT NOT NULL,
    id_comuna_servicio UUID NOT NULL REFERENCES comuna(id_comuna),

    precio_total INTEGER NOT NULL,

    -- TIMESTAMPS DE TRANSICIÓN (referencia rápida; historial es la fuente de verdad)
    confirmado_en TIMESTAMP,
    iniciado_en TIMESTAMP,
    completado_en TIMESTAMP,
    cancelado_en TIMESTAMP,
    razon_cancelacion TEXT,

    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE solicitud_servicio IS 'Solicitudes de servicio entre clientes y profesionales';
COMMENT ON COLUMN solicitud_servicio.precio_total IS 'Precio fijo al momento de la solicitud en CLP';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 10. RESEÑAS Y CALIFICACIONES
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE resena (
    id_resena UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_solicitud_servicio UUID NOT NULL UNIQUE REFERENCES solicitud_servicio(id_solicitud_servicio),
    rut_evaluador VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    rut_evaluado VARCHAR(12) NOT NULL REFERENCES usuario(rut),

    comentario TEXT,
    calificacion_puntualidad INTEGER CHECK (calificacion_puntualidad >= 1 AND calificacion_puntualidad <= 5),
    calificacion_calidad INTEGER CHECK (calificacion_calidad >= 1 AND calificacion_calidad <= 5),
    calificacion_comunicacion INTEGER CHECK (calificacion_comunicacion >= 1 AND calificacion_comunicacion <= 5),

    es_destacada BOOLEAN DEFAULT false,

    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE resena IS 'Reseñas y calificaciones de servicios';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 11. NOTIFICACIONES
--     NOTA: tipo NO es FK directa; se obtiene via historial_tipo_notificacion
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE TABLE notificacion (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut),
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notificacion IS 'Notificaciones para usuarios';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 12. TABLAS DE HISTORIAL (INTERSECCIÓN)
--     Cada tabla conecta la entidad con su catálogo y registra el timestamp del cambio.
--     El estado/tipo ACTUAL de una entidad es el registro con cambiado_en más reciente.
-- ═══════════════════════════════════════════════════════════════════════════════════

-- usuario ── historial_genero_usuario ── genero
CREATE TABLE historial_genero_usuario (
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    id_genero UUID NOT NULL REFERENCES genero(id_genero),
    cambiado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (rut_usuario, id_genero)
);

COMMENT ON TABLE historial_genero_usuario IS 'Intersección usuario ↔ genero con timestamp de cada asignación';

-- ─────────────────────────────────────────────────────────────────────────────────

-- usuario ── historial_rol_usuario ── rol
CREATE TABLE historial_rol_usuario (
    rut_usuario VARCHAR(12) NOT NULL REFERENCES usuario(rut) ON DELETE CASCADE,
    id_rol UUID NOT NULL REFERENCES rol(id_rol),
    cambiado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (rut_usuario, id_rol)
);

COMMENT ON TABLE historial_rol_usuario IS 'Intersección usuario ↔ rol con timestamp de cada asignación';

-- ─────────────────────────────────────────────────────────────────────────────────

-- solicitud_servicio ── historial_estado_solicitud ── estado_solicitud
CREATE TABLE historial_estado_solicitud (
    id_solicitud_servicio UUID NOT NULL REFERENCES solicitud_servicio(id_solicitud_servicio) ON DELETE CASCADE,
    id_estado_solicitud UUID NOT NULL REFERENCES estado_solicitud(id_estado_solicitud),
    cambiado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_solicitud_servicio, id_estado_solicitud)
);

COMMENT ON TABLE historial_estado_solicitud IS 'Intersección solicitud_servicio ↔ estado_solicitud con timestamp de cada cambio';

-- ─────────────────────────────────────────────────────────────────────────────────

-- servicio_profesional ── historial_estado_verificacion_servicio ── estado_verificacion_servicio
CREATE TABLE historial_estado_verificacion_servicio (
    id_servicio_profesional UUID NOT NULL REFERENCES servicio_profesional(id_servicio_profesional) ON DELETE CASCADE,
    id_estado_verificacion_servicio UUID NOT NULL REFERENCES estado_verificacion_servicio(id_estado_verificacion_servicio),
    cambiado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_servicio_profesional, id_estado_verificacion_servicio)
);

COMMENT ON TABLE historial_estado_verificacion_servicio IS 'Intersección servicio_profesional ↔ estado_verificacion_servicio con timestamp de cada cambio';

-- ─────────────────────────────────────────────────────────────────────────────────

-- notificacion ── historial_tipo_notificacion ── tipo_notificacion
CREATE TABLE historial_tipo_notificacion (
    id_notificacion UUID NOT NULL REFERENCES notificacion(id_notificacion) ON DELETE CASCADE,
    id_tipo_notificacion UUID NOT NULL REFERENCES tipo_notificacion(id_tipo_notificacion),
    cambiado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_notificacion, id_tipo_notificacion)
);

COMMENT ON TABLE historial_tipo_notificacion IS 'Intersección notificacion ↔ tipo_notificacion con timestamp de asignación';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 13. ÍNDICES PARA OPTIMIZACIÓN
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Usuario
CREATE INDEX idx_usuario_email   ON usuario(email);
CREATE INDEX idx_usuario_comuna  ON usuario(id_comuna);

-- Servicio profesional
CREATE INDEX idx_servicio_profesional_rut       ON servicio_profesional(rut_usuario);
CREATE INDEX idx_servicio_profesional_categoria ON servicio_profesional(id_categoria_servicio);

-- Solicitud servicio
CREATE INDEX idx_solicitud_cliente     ON solicitud_servicio(rut_cliente);
CREATE INDEX idx_solicitud_profesional ON solicitud_servicio(rut_profesional);
CREATE INDEX idx_solicitud_fecha       ON solicitud_servicio(fecha_programada);

-- Reseña
CREATE INDEX idx_resena_evaluador ON resena(rut_evaluador);
CREATE INDEX idx_resena_evaluado  ON resena(rut_evaluado);
CREATE INDEX idx_resena_destacada ON resena(es_destacada);

-- Notificación
CREATE INDEX idx_notificacion_usuario ON notificacion(rut_usuario);

-- Historiales (optimiza búsqueda de estado/tipo actual con ORDER BY cambiado_en DESC)
CREATE INDEX idx_hist_genero_usuario    ON historial_genero_usuario(rut_usuario, cambiado_en DESC);
CREATE INDEX idx_hist_rol_usuario       ON historial_rol_usuario(rut_usuario, cambiado_en DESC);
CREATE INDEX idx_hist_estado_solicitud  ON historial_estado_solicitud(id_solicitud_servicio, cambiado_en DESC);
CREATE INDEX idx_hist_estado_verif      ON historial_estado_verificacion_servicio(id_servicio_profesional, cambiado_en DESC);
CREATE INDEX idx_hist_tipo_notificacion ON historial_tipo_notificacion(id_notificacion, cambiado_en DESC);

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 14. FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════════

-- Función genérica para actualizar actualizado_en
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_usuario
    BEFORE UPDATE ON usuario
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_servicio_profesional
    BEFORE UPDATE ON servicio_profesional
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trigger_actualizar_solicitud_servicio
    BEFORE UPDATE ON solicitud_servicio
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ─────────────────────────────────────────────────────────────────────────────────
-- Función para validar RUT chileno (dígito verificador)
CREATE OR REPLACE FUNCTION validar_rut_chileno(rut VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    rut_numeros VARCHAR;
    digito_verificador CHAR(1);
    suma INTEGER := 0;
    multiplicador INTEGER := 2;
    resto INTEGER;
    digito_calculado CHAR(1);
BEGIN
    rut_numeros := REPLACE(REPLACE(rut, '.', ''), '-', '');
    digito_verificador := SUBSTRING(rut_numeros FROM LENGTH(rut_numeros));
    rut_numeros := SUBSTRING(rut_numeros FROM 1 FOR LENGTH(rut_numeros) - 1);

    FOR i IN REVERSE 1..LENGTH(rut_numeros) LOOP
        suma := suma + (SUBSTRING(rut_numeros FROM i FOR 1)::INTEGER * multiplicador);
        multiplicador := multiplicador + 1;
        IF multiplicador > 7 THEN multiplicador := 2; END IF;
    END LOOP;

    resto := 11 - (suma % 11);

    IF resto = 11 THEN digito_calculado := '0';
    ELSIF resto = 10 THEN digito_calculado := 'K';
    ELSE digito_calculado := resto::CHAR(1);
    END IF;

    RETURN UPPER(digito_verificador) = UPPER(digito_calculado);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_rut_chileno IS 'Valida el dígito verificador de un RUT chileno usando algoritmo Módulo 11';

-- ═══════════════════════════════════════════════════════════════════════════════════
-- 15. CONSTRAINT: MÁXIMO 3 SERVICIOS POR PROFESIONAL
-- ═══════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION validar_max_servicios_profesional()
RETURNS TRIGGER AS $$
DECLARE
    total_servicios INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_servicios
    FROM servicio_profesional
    WHERE rut_usuario = NEW.rut_usuario;

    IF total_servicios >= 3 THEN
        RAISE EXCEPTION 'Un profesional no puede tener más de 3 servicios activos';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_max_servicios
    BEFORE INSERT ON servicio_profesional
    FOR EACH ROW EXECUTE FUNCTION validar_max_servicios_profesional();

-- ═══════════════════════════════════════════════════════════════════════════════════
-- FIN DEL SCRIPT - SERVIHOGAR PRODUCCIÓN 2026
-- Versión: 4.3 | 22 tablas activas | Sin pagos/cuentas bancarias/disputas
-- Relaciones catálogo solo via historial (sin FK directa en entidades)
-- Compatible con PostgreSQL 14+
-- ═══════════════════════════════════════════════════════════════════════════════════
