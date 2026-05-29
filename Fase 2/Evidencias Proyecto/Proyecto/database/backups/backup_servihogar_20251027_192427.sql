--
-- PostgreSQL database dump
--

\restrict dUJGciS1JwtTdq2tmeuciayNBUj0yd6SyK0n44ohS3vRLzkZViipcD8dgg18W2h

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: actualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_timestamp() OWNER TO postgres;

--
-- Name: validar_max_servicios_profesional(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_max_servicios_profesional() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_servicios INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO total_servicios
    FROM servicio_profesional
    WHERE rut_usuario = NEW.rut_usuario;
    
    IF total_servicios >= 3 THEN
        RAISE EXCEPTION 'Un profesional no puede tener m??s de 3 servicios activos';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_max_servicios_profesional() OWNER TO postgres;

--
-- Name: validar_rut_chileno(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_rut_chileno(rut character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    rut_numeros VARCHAR;
    digito_verificador CHAR(1);
    suma INTEGER := 0;
    multiplicador INTEGER := 2;
    resto INTEGER;
    digito_calculado CHAR(1);
BEGIN
    -- Eliminar puntos y gui??n
    rut_numeros := REPLACE(REPLACE(rut, '.', ''), '-', '');
    
    -- Extraer d??gito verificador
    digito_verificador := SUBSTRING(rut_numeros FROM LENGTH(rut_numeros));
    rut_numeros := SUBSTRING(rut_numeros FROM 1 FOR LENGTH(rut_numeros) - 1);
    
    -- Calcular d??gito verificador
    FOR i IN REVERSE 1..LENGTH(rut_numeros) LOOP
        suma := suma + (SUBSTRING(rut_numeros FROM i FOR 1)::INTEGER * multiplicador);
        multiplicador := multiplicador + 1;
        IF multiplicador > 7 THEN
            multiplicador := 2;
        END IF;
    END LOOP;
    
    resto := 11 - (suma % 11);
    
    IF resto = 11 THEN
        digito_calculado := '0';
    ELSIF resto = 10 THEN
        digito_calculado := 'K';
    ELSE
        digito_calculado := resto::CHAR(1);
    END IF;
    
    RETURN UPPER(digito_verificador) = UPPER(digito_calculado);
END;
$$;


ALTER FUNCTION public.validar_rut_chileno(rut character varying) OWNER TO postgres;

--
-- Name: FUNCTION validar_rut_chileno(rut character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.validar_rut_chileno(rut character varying) IS 'Valida el d??gito verificador de un RUT chileno';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_profile (
    id bigint NOT NULL,
    rut character varying(20) NOT NULL,
    gender character varying(32) NOT NULL,
    birth_date date,
    phone character varying(32) NOT NULL,
    region character varying(100) NOT NULL,
    district character varying(100) NOT NULL,
    address character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    user_id integer NOT NULL,
    avatar_url text NOT NULL
);


ALTER TABLE public.api_profile OWNER TO postgres;

--
-- Name: api_profile_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.api_profile ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.api_profile_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: api_service_custom_period; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_service_custom_period (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    weekly_template jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    schedule_id uuid NOT NULL
);


ALTER TABLE public.api_service_custom_period OWNER TO postgres;

--
-- Name: api_service_custom_period_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.api_service_custom_period ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.api_service_custom_period_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: api_service_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_service_schedule (
    service_id uuid NOT NULL,
    weekly_template jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.api_service_schedule OWNER TO postgres;

--
-- Name: api_service_unavailability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_service_unavailability (
    id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    schedule_id uuid NOT NULL
);


ALTER TABLE public.api_service_unavailability OWNER TO postgres;

--
-- Name: api_service_unavailability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.api_service_unavailability ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.api_service_unavailability_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: api_service_visibility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.api_service_visibility (
    service_id uuid NOT NULL,
    is_active boolean NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.api_service_visibility OWNER TO postgres;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO postgres;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO postgres;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO postgres;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO postgres;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO postgres;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO postgres;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: categoria_servicio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categoria_servicio (
    id_categoria_servicio uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(50) NOT NULL,
    slug character varying(50),
    descripcion text,
    descripcion_corta character varying(200),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categoria_servicio OWNER TO postgres;

--
-- Name: TABLE categoria_servicio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.categoria_servicio IS 'Categor??as de servicios ofrecidos (Gasfiter??a, Limpieza, Jardiner??a, etc.)';


--
-- Name: comuna; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comuna (
    id_comuna uuid DEFAULT gen_random_uuid() NOT NULL,
    id_region uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo character varying(10),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comuna OWNER TO postgres;

--
-- Name: TABLE comuna; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.comuna IS 'Comunas de Chile agrupadas por regi??n';


--
-- Name: cuenta_bancaria_profesional; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuenta_bancaria_profesional (
    id_cuenta_bancaria_profesional uuid DEFAULT gen_random_uuid() NOT NULL,
    rut_usuario character varying(12) NOT NULL,
    banco character varying(100) NOT NULL,
    tipo_cuenta character varying(20) NOT NULL,
    numero_cuenta character varying(50) NOT NULL,
    rut_titular character varying(12) NOT NULL,
    nombre_titular character varying(200) NOT NULL,
    email_contacto character varying(255),
    prioridad integer NOT NULL,
    estado character varying(20) DEFAULT 'activa'::character varying,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    es_principal boolean DEFAULT false,
    CONSTRAINT cuenta_bancaria_profesional_estado_check CHECK (((estado)::text = ANY ((ARRAY['activa'::character varying, 'inactiva'::character varying, 'bloqueada'::character varying])::text[]))),
    CONSTRAINT cuenta_bancaria_profesional_prioridad_check CHECK (((prioridad >= 1) AND (prioridad <= 3))),
    CONSTRAINT cuenta_bancaria_profesional_tipo_cuenta_check CHECK (((tipo_cuenta)::text = ANY ((ARRAY['Corriente'::character varying, 'Vista'::character varying, 'Ahorro'::character varying, 'RUT'::character varying])::text[])))
);


ALTER TABLE public.cuenta_bancaria_profesional OWNER TO postgres;

--
-- Name: TABLE cuenta_bancaria_profesional; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cuenta_bancaria_profesional IS 'Cuentas bancarias de profesionales (m??ximo 3, con fallback) - V3.0';


--
-- Name: COLUMN cuenta_bancaria_profesional.rut_usuario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cuenta_bancaria_profesional.rut_usuario IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';


--
-- Name: COLUMN cuenta_bancaria_profesional.prioridad; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cuenta_bancaria_profesional.prioridad IS '1 = Principal, 2 = Secundaria, 3 = Terciaria';


--
-- Name: cuenta_bancaria_servihogar; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuenta_bancaria_servihogar (
    id_cuenta_bancaria_servihogar uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre_identificador character varying(100) NOT NULL,
    banco character varying(100) NOT NULL,
    tipo_cuenta character varying(20) NOT NULL,
    numero_cuenta character varying(50) NOT NULL,
    rut_titular character varying(12) NOT NULL,
    nombre_titular character varying(200) NOT NULL,
    email_contacto character varying(255),
    prioridad integer NOT NULL,
    estado character varying(20) DEFAULT 'activa'::character varying,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cuenta_bancaria_servihogar_estado_check CHECK (((estado)::text = ANY ((ARRAY['activa'::character varying, 'inactiva'::character varying, 'bloqueada'::character varying])::text[]))),
    CONSTRAINT cuenta_bancaria_servihogar_prioridad_check CHECK (((prioridad >= 1) AND (prioridad <= 3)))
);


ALTER TABLE public.cuenta_bancaria_servihogar OWNER TO postgres;

--
-- Name: TABLE cuenta_bancaria_servihogar; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cuenta_bancaria_servihogar IS 'Cuentas bancarias corporativas de ServiHogar';


--
-- Name: dia_bloqueado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dia_bloqueado (
    id_dia_bloqueado uuid DEFAULT gen_random_uuid() NOT NULL,
    id_servicio_profesional uuid NOT NULL,
    fecha date NOT NULL,
    motivo text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dia_bloqueado OWNER TO postgres;

--
-- Name: TABLE dia_bloqueado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.dia_bloqueado IS 'D??as espec??ficos bloqueados - Nivel 3';


--
-- Name: disputa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disputa (
    id_disputa uuid DEFAULT gen_random_uuid() NOT NULL,
    id_solicitud_servicio uuid NOT NULL,
    rut_reportante character varying(12) NOT NULL,
    rut_reportado character varying(12) NOT NULL,
    tipo_disputa character varying(30) NOT NULL,
    descripcion text NOT NULL,
    evidencia_url text,
    estado character varying(20) DEFAULT 'abierta'::character varying,
    resolucion text,
    rut_resuelto_por character varying(12),
    resuelta_en timestamp without time zone,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT disputa_estado_check CHECK (((estado)::text = ANY ((ARRAY['abierta'::character varying, 'en_revision'::character varying, 'resuelta'::character varying, 'cerrada'::character varying])::text[]))),
    CONSTRAINT disputa_tipo_disputa_check CHECK (((tipo_disputa)::text = ANY ((ARRAY['trabajo_incompleto'::character varying, 'trabajo_no_realizado'::character varying, 'cobro_indebido'::character varying, 'mal_trato'::character varying, 'incumplimiento_horario'::character varying, 'otro'::character varying])::text[])))
);


ALTER TABLE public.disputa OWNER TO postgres;

--
-- Name: TABLE disputa; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.disputa IS 'Sistema de disputas entre usuarios - V3.0';


--
-- Name: COLUMN disputa.rut_reportante; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.disputa.rut_reportante IS 'RUT del reportante - FOREIGN KEY a usuario(rut)';


--
-- Name: COLUMN disputa.rut_reportado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.disputa.rut_reportado IS 'RUT del reportado - FOREIGN KEY a usuario(rut)';


--
-- Name: COLUMN disputa.rut_resuelto_por; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.disputa.rut_resuelto_por IS 'RUT del admin - FOREIGN KEY a usuario(rut)';


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO postgres;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO postgres;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO postgres;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO postgres;

--
-- Name: documento_profesional; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documento_profesional (
    id_documento_profesional uuid DEFAULT gen_random_uuid() NOT NULL,
    rut_usuario character varying(12) NOT NULL,
    id_servicio_profesional uuid,
    tipo_documento character varying(30) NOT NULL,
    url_archivo text NOT NULL,
    tipo_mime character varying(100),
    estado_verificacion character varying(20) DEFAULT 'pendiente'::character varying,
    rut_verificador character varying(12),
    verificado_en timestamp without time zone,
    razon_rechazo text,
    subido_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT documento_profesional_estado_verificacion_check CHECK (((estado_verificacion)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobado'::character varying, 'rechazado'::character varying])::text[]))),
    CONSTRAINT documento_profesional_tipo_documento_check CHECK (((tipo_documento)::text = ANY ((ARRAY['certificado_antecedentes'::character varying, 'certificado_experiencia'::character varying])::text[])))
);


ALTER TABLE public.documento_profesional OWNER TO postgres;

--
-- Name: TABLE documento_profesional; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.documento_profesional IS 'Documentos del profesional con verificaci??n diferenciada';


--
-- Name: COLUMN documento_profesional.rut_usuario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento_profesional.rut_usuario IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';


--
-- Name: COLUMN documento_profesional.rut_verificador; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.documento_profesional.rut_verificador IS 'RUT del verificador - FOREIGN KEY a usuario(rut)';


--
-- Name: horario_profesional; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.horario_profesional (
    id_horario_profesional uuid DEFAULT gen_random_uuid() NOT NULL,
    id_servicio_profesional uuid NOT NULL,
    dia_semana integer NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT horario_profesional_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


ALTER TABLE public.horario_profesional OWNER TO postgres;

--
-- Name: TABLE horario_profesional; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.horario_profesional IS 'Horario base semanal del profesional - Nivel 1';


--
-- Name: COLUMN horario_profesional.dia_semana; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.horario_profesional.dia_semana IS '0 = Domingo, 1 = Lunes, ..., 6 = S??bado';


--
-- Name: notificacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notificacion (
    id_notificacion uuid DEFAULT gen_random_uuid() NOT NULL,
    rut_usuario character varying(12) NOT NULL,
    tipo character varying(30) NOT NULL,
    titulo character varying(200) NOT NULL,
    mensaje text NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notificacion_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['solicitud_servicio'::character varying, 'pago'::character varying, 'resena'::character varying, 'verificacion'::character varying, 'mensaje'::character varying, 'sistema'::character varying])::text[])))
);


ALTER TABLE public.notificacion OWNER TO postgres;

--
-- Name: TABLE notificacion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notificacion IS 'Notificaciones para usuarios';


--
-- Name: COLUMN notificacion.rut_usuario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.notificacion.rut_usuario IS 'RUT del usuario - FOREIGN KEY a usuario(rut)';


--
-- Name: pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pago (
    id_pago_mercadopago character varying(100) NOT NULL,
    id_solicitud_servicio uuid NOT NULL,
    id_cuenta_destino_profesional uuid,
    id_cuenta_origen_servihogar uuid,
    monto integer NOT NULL,
    metodo_pago character varying(50),
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    comision_plataforma integer DEFAULT 0,
    monto_profesional integer DEFAULT 0,
    liberado_al_profesional_en timestamp without time zone,
    reembolsado_en timestamp without time zone,
    monto_reembolso integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pago_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobado'::character varying, 'autorizado'::character varying, 'en_proceso'::character varying, 'rechazado'::character varying, 'cancelado'::character varying, 'reembolsado'::character varying])::text[]))),
    CONSTRAINT pago_monto_check CHECK ((monto > 0))
);


ALTER TABLE public.pago OWNER TO postgres;

--
-- Name: TABLE pago; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pago IS 'Pagos procesados con MercadoPago - V3.0';


--
-- Name: COLUMN pago.id_pago_mercadopago; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pago.id_pago_mercadopago IS 'ID ??nico de MercadoPago - CLAVE PRIMARIA';


--
-- Name: COLUMN pago.comision_plataforma; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pago.comision_plataforma IS 'Comisi??n del 5% para ServiHogar';


--
-- Name: pago_profesional; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pago_profesional (
    id_pago_profesional uuid DEFAULT gen_random_uuid() NOT NULL,
    id_retencion uuid NOT NULL,
    id_pago_mercadopago character varying(100) NOT NULL,
    id_solicitud_servicio uuid NOT NULL,
    rut_profesional character varying(12) NOT NULL,
    id_cuenta_profesional uuid NOT NULL,
    monto_a_pagar integer NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    metodo_pago character varying(50) DEFAULT 'transferencia_bancaria'::character varying,
    referencia_transaccion character varying(100),
    comprobante_url text,
    fecha_programada date,
    fecha_procesado timestamp without time zone,
    fecha_pagado timestamp without time zone,
    motivo_fallo text,
    notas text,
    procesado_por character varying(12),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pago_profesional_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'en_proceso'::character varying, 'pagado'::character varying, 'fallido'::character varying, 'revertido'::character varying, 'retenido'::character varying])::text[]))),
    CONSTRAINT pago_profesional_monto_a_pagar_check CHECK ((monto_a_pagar > 0))
);


ALTER TABLE public.pago_profesional OWNER TO postgres;

--
-- Name: periodo_personalizado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.periodo_personalizado (
    id_periodo_personalizado uuid DEFAULT gen_random_uuid() NOT NULL,
    id_servicio_profesional uuid NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    descripcion character varying(200),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT periodo_personalizado_check CHECK ((fecha_fin >= fecha_inicio))
);


ALTER TABLE public.periodo_personalizado OWNER TO postgres;

--
-- Name: TABLE periodo_personalizado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.periodo_personalizado IS 'Per??odos personalizados que sobrescriben horario base - Nivel 2';


--
-- Name: region; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.region (
    id_region uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo character varying(10) NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.region OWNER TO postgres;

--
-- Name: TABLE region; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.region IS 'Regiones administrativas de Chile';


--
-- Name: COLUMN region.codigo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.region.codigo IS 'C??digo oficial de la regi??n (I, II, III, ..., XV, RM)';


--
-- Name: resena; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resena (
    id_resena uuid DEFAULT gen_random_uuid() NOT NULL,
    id_solicitud_servicio uuid NOT NULL,
    rut_evaluador character varying(12) NOT NULL,
    rut_evaluado character varying(12) NOT NULL,
    comentario text,
    calificacion_puntualidad integer,
    calificacion_calidad integer,
    calificacion_comunicacion integer,
    es_destacada boolean DEFAULT false,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT resena_calificacion_calidad_check CHECK (((calificacion_calidad >= 1) AND (calificacion_calidad <= 5))),
    CONSTRAINT resena_calificacion_comunicacion_check CHECK (((calificacion_comunicacion >= 1) AND (calificacion_comunicacion <= 5))),
    CONSTRAINT resena_calificacion_puntualidad_check CHECK (((calificacion_puntualidad >= 1) AND (calificacion_puntualidad <= 5)))
);


ALTER TABLE public.resena OWNER TO postgres;

--
-- Name: TABLE resena; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.resena IS 'Rese??as y calificaciones de servicios - V3.0';


--
-- Name: COLUMN resena.rut_evaluador; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resena.rut_evaluador IS 'RUT del cliente - FOREIGN KEY a usuario(rut)';


--
-- Name: COLUMN resena.rut_evaluado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.resena.rut_evaluado IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';


--
-- Name: retencion_plataforma; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.retencion_plataforma (
    id_retencion uuid DEFAULT gen_random_uuid() NOT NULL,
    id_pago_mercadopago character varying(100) NOT NULL,
    id_solicitud_servicio uuid NOT NULL,
    monto_total_pago integer NOT NULL,
    porcentaje_retencion numeric(5,2) DEFAULT 5.00 NOT NULL,
    monto_retenido integer NOT NULL,
    monto_profesional integer NOT NULL,
    id_cuenta_destino_servihogar uuid,
    retenido_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_suma_montos CHECK ((monto_total_pago = (monto_retenido + monto_profesional))),
    CONSTRAINT retencion_plataforma_monto_profesional_check CHECK ((monto_profesional >= 0)),
    CONSTRAINT retencion_plataforma_monto_retenido_check CHECK ((monto_retenido >= 0)),
    CONSTRAINT retencion_plataforma_monto_total_pago_check CHECK ((monto_total_pago > 0)),
    CONSTRAINT retencion_plataforma_porcentaje_retencion_check CHECK (((porcentaje_retencion >= (0)::numeric) AND (porcentaje_retencion <= (100)::numeric)))
);


ALTER TABLE public.retencion_plataforma OWNER TO postgres;

--
-- Name: servicio_profesional; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.servicio_profesional (
    id_servicio_profesional uuid DEFAULT gen_random_uuid() NOT NULL,
    rut_usuario character varying(12) NOT NULL,
    id_categoria_servicio uuid NOT NULL,
    anos_experiencia character varying(10) NOT NULL,
    descripcion text NOT NULL,
    tipo_duracion character varying(10) NOT NULL,
    duracion_fija_minutos integer,
    duracion_minima_minutos integer,
    duracion_maxima_minutos integer,
    precio_fijo integer NOT NULL,
    estado_verificacion character varying(20) DEFAULT 'pendiente'::character varying,
    rut_verificador character varying(12),
    verificado_en timestamp without time zone,
    razon_rechazo text,
    trabajos_completados integer DEFAULT 0,
    trabajos_cancelados integer DEFAULT 0,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT servicio_profesional_estado_verificacion_check CHECK (((estado_verificacion)::text = ANY ((ARRAY['pendiente'::character varying, 'en_revision'::character varying, 'aprobado'::character varying, 'rechazado'::character varying, 'suspendido'::character varying])::text[]))),
    CONSTRAINT servicio_profesional_precio_fijo_check CHECK ((precio_fijo > 0)),
    CONSTRAINT servicio_profesional_tipo_duracion_check CHECK (((tipo_duracion)::text = ANY ((ARRAY['fija'::character varying, 'rango'::character varying])::text[])))
);


ALTER TABLE public.servicio_profesional OWNER TO postgres;

--
-- Name: TABLE servicio_profesional; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.servicio_profesional IS 'Servicios espec??ficos ofrecidos por cada profesional (m??ximo 3)';


--
-- Name: COLUMN servicio_profesional.rut_usuario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.servicio_profesional.rut_usuario IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';


--
-- Name: COLUMN servicio_profesional.precio_fijo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.servicio_profesional.precio_fijo IS 'Precio fijo del servicio, no var??a por tiempo';


--
-- Name: solicitud_servicio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitud_servicio (
    id_solicitud_servicio uuid DEFAULT gen_random_uuid() NOT NULL,
    rut_cliente character varying(12) NOT NULL,
    rut_profesional character varying(12),
    id_servicio_profesional uuid,
    titulo character varying(200) NOT NULL,
    descripcion text NOT NULL,
    fecha_programada timestamp without time zone NOT NULL,
    duracion_minutos integer,
    direccion_servicio text NOT NULL,
    id_comuna_servicio uuid NOT NULL,
    precio_total integer NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    confirmado_en timestamp without time zone,
    iniciado_en timestamp without time zone,
    completado_en timestamp without time zone,
    cancelado_en timestamp without time zone,
    razon_cancelacion text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT solicitud_servicio_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmado'::character varying, 'en_progreso'::character varying, 'completado'::character varying, 'cancelado'::character varying, 'en_disputa'::character varying])::text[])))
);


ALTER TABLE public.solicitud_servicio OWNER TO postgres;

--
-- Name: TABLE solicitud_servicio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.solicitud_servicio IS 'Solicitudes de servicio entre clientes y profesionales';


--
-- Name: COLUMN solicitud_servicio.rut_cliente; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.solicitud_servicio.rut_cliente IS 'RUT del cliente - FOREIGN KEY a usuario(rut)';


--
-- Name: COLUMN solicitud_servicio.rut_profesional; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.solicitud_servicio.rut_profesional IS 'RUT del profesional - FOREIGN KEY a usuario(rut)';


--
-- Name: COLUMN solicitud_servicio.id_comuna_servicio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.solicitud_servicio.id_comuna_servicio IS 'Comuna donde se realiza el servicio';


--
-- Name: COLUMN solicitud_servicio.precio_total; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.solicitud_servicio.precio_total IS 'Precio fijo, no var??a por duraci??n';


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuario (
    rut character varying(12) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    telefono character varying(20) NOT NULL,
    genero character varying(20) NOT NULL,
    fecha_nacimiento date NOT NULL,
    id_comuna uuid NOT NULL,
    direccion text NOT NULL,
    rol character varying(20) DEFAULT 'cliente'::character varying NOT NULL,
    foto_perfil_url text,
    email_verificado boolean DEFAULT false,
    ultima_actividad timestamp without time zone,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hash_contrasena character varying(255),
    foto_perfil bytea,
    foto_perfil_mime character varying(100),
    foto_perfil_nombre text,
    foto_perfil_tam integer,
    CONSTRAINT usuario_genero_check CHECK (((genero)::text = ANY ((ARRAY['masculino'::character varying, 'femenino'::character varying, 'no_binario'::character varying])::text[]))),
    CONSTRAINT usuario_rol_check CHECK (((rol)::text = ANY ((ARRAY['cliente'::character varying, 'profesional'::character varying, 'administrador'::character varying, 'verificador'::character varying])::text[])))
);


ALTER TABLE public.usuario OWNER TO postgres;

--
-- Name: TABLE usuario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.usuario IS 'Tabla central de usuarios con sistema multi-rol';


--
-- Name: COLUMN usuario.rut; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuario.rut IS 'RUT chileno formato 12.345.678-9 - CLAVE PRIMARIA';


--
-- Name: COLUMN usuario.genero; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuario.genero IS '3 opciones: masculino, femenino, no_binario';


--
-- Name: COLUMN usuario.id_comuna; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuario.id_comuna IS 'Comuna de residencia - regi??n se obtiene mediante JOIN';


--
-- Data for Name: api_profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_profile (id, rut, gender, birth_date, phone, region, district, address, role, created_at, user_id, avatar_url) FROM stdin;
1			\N					cliente	2025-10-18 03:21:39.740751+00	1	
2			\N					verificador	2025-10-18 03:21:40.054369+00	2	
11	12.345.678-5	masculino	1990-01-01	+56912345678			Calle Falsa 123	cliente	2025-10-27 00:46:42.751143+00	11	
12	20.439.672-8	masculino	2000-11-19	+56 9 7812 3221			estambul	cliente	2025-10-27 00:51:33.987159+00	12	
\.


--
-- Data for Name: api_service_custom_period; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_service_custom_period (id, name, start_date, end_date, weekly_template, created_at, schedule_id) FROM stdin;
\.


--
-- Data for Name: api_service_schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_service_schedule (service_id, weekly_template, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: api_service_unavailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_service_unavailability (id, start_date, end_date, reason, created_at, schedule_id) FROM stdin;
\.


--
-- Data for Name: api_service_visibility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.api_service_visibility (service_id, is_active, updated_at) FROM stdin;
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add user	4	add_user
14	Can change user	4	change_user
15	Can delete user	4	delete_user
16	Can view user	4	view_user
17	Can add content type	5	add_contenttype
18	Can change content type	5	change_contenttype
19	Can delete content type	5	delete_contenttype
20	Can view content type	5	view_contenttype
21	Can add session	6	add_session
22	Can change session	6	change_session
23	Can delete session	6	delete_session
24	Can view session	6	view_session
25	Can add profile	7	add_profile
26	Can change profile	7	change_profile
27	Can delete profile	7	delete_profile
28	Can view profile	7	view_profile
29	Can add service schedule	8	add_serviceschedule
30	Can change service schedule	8	change_serviceschedule
31	Can delete service schedule	8	delete_serviceschedule
32	Can view service schedule	8	view_serviceschedule
33	Can add service custom period	9	add_servicecustomperiod
34	Can change service custom period	9	change_servicecustomperiod
35	Can delete service custom period	9	delete_servicecustomperiod
36	Can view service custom period	9	view_servicecustomperiod
37	Can add service unavailability	10	add_serviceunavailability
38	Can change service unavailability	10	change_serviceunavailability
39	Can delete service unavailability	10	delete_serviceunavailability
40	Can view service unavailability	10	view_serviceunavailability
41	Can add categoria servicio	11	add_categoriaservicio
42	Can change categoria servicio	11	change_categoriaservicio
43	Can delete categoria servicio	11	delete_categoriaservicio
44	Can view categoria servicio	11	view_categoriaservicio
45	Can add documento profesional	12	add_documentoprofesional
46	Can change documento profesional	12	change_documentoprofesional
47	Can delete documento profesional	12	delete_documentoprofesional
48	Can view documento profesional	12	view_documentoprofesional
49	Can add perfil profesional	13	add_perfilprofesional
50	Can change perfil profesional	13	change_perfilprofesional
51	Can delete perfil profesional	13	delete_perfilprofesional
52	Can view perfil profesional	13	view_perfilprofesional
53	Can add servicio profesional	14	add_servicioprofesional
54	Can change servicio profesional	14	change_servicioprofesional
55	Can delete servicio profesional	14	delete_servicioprofesional
56	Can view servicio profesional	14	view_servicioprofesional
57	Can add usuario dominio	15	add_usuariodominio
58	Can change usuario dominio	15	change_usuariodominio
59	Can delete usuario dominio	15	delete_usuariodominio
60	Can view usuario dominio	15	view_usuariodominio
61	Can add service visibility	16	add_servicevisibility
62	Can change service visibility	16	change_servicevisibility
63	Can delete service visibility	16	delete_servicevisibility
64	Can view service visibility	16	view_servicevisibility
\.


--
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) FROM stdin;
1	pbkdf2_sha256$600000$EbyjDYPDntKjKYBBRXcOxz$LVOPZNK6PS95fpsjIRbUBDM5vmnJS1jEgCRFIBeARsA=	\N	t	admin@servihogar.cl	Admin	ServiHogar	admin@servihogar.cl	t	t	2025-10-18 03:21:39.445606+00
2	pbkdf2_sha256$600000$tdmzsHcrAZwrBi9HzdNRlM$D76GQCWVRscQIAI472dlT4YowTNYZvrx67lPAqSdHLY=	\N	f	verificador@servihogar.cl	Verificador	ServiHogar	verificador@servihogar.cl	f	t	2025-10-18 03:21:39.757014+00
11	pbkdf2_sha256$600000$IBV2PEEkFivyRG9NojULVN$NotBBzjEXjDUzHOwydCx5QO7Zos6iyJ3PwpgS70PIGc=	\N	f	testuser_001@example.com	Test	User	testuser_001@example.com	f	t	2025-10-27 00:46:42.466198+00
12	pbkdf2_sha256$600000$Bjn11ZGFIqb0B17WKFzR9h$4X3RRQRqevGv+Wq1e9aVEjLXgDB8C1J2VXpGmQ7cvGY=	\N	f	sawrunner12@hotmail.com	Matias	Alejandro Reuque Barros	sawrunner12@hotmail.com	f	t	2025-10-27 00:51:33.719817+00
\.


--
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user_groups (id, user_id, group_id) FROM stdin;
\.


--
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: categoria_servicio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categoria_servicio (id_categoria_servicio, nombre, slug, descripcion, descripcion_corta, creado_en, actualizado_en) FROM stdin;
657c6734-fef6-42c0-ba12-d89e6272dad4	Gasfiter??a	gasfiteria	\N	\N	2025-10-26 01:30:28.315897	2025-10-26 01:30:28.315897
be4486a6-c4cb-4061-91e9-df7300b1f481	Limpieza del Hogar	limpieza	\N	\N	2025-10-26 01:30:28.31874	2025-10-26 01:30:28.31874
69ed82de-4e2c-43d7-8ae7-961d7afc9eaf	Jardiner??a	jardineria	\N	\N	2025-10-26 01:30:28.32276	2025-10-26 01:30:28.32276
\.


--
-- Data for Name: comuna; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comuna (id_comuna, id_region, nombre, codigo, creado_en) FROM stdin;
a9e247da-8984-42de-b889-3dbb9d3a23b5	544b1326-255f-404d-ba30-e46b38ef1db8	Santiago	STGO	2025-10-25 20:51:41.213429
5f498789-4be7-4ae7-bb52-397d31ebd9fc	544b1326-255f-404d-ba30-e46b38ef1db8	Providencia	PROV	2025-10-25 20:51:41.213429
ad7a7a0c-9fa2-4cd8-8d98-14461133e887	544b1326-255f-404d-ba30-e46b38ef1db8	Las Condes	LCON	2025-10-25 20:51:41.213429
fc9c265a-62d5-4158-82c2-9bdcc870290d	544b1326-255f-404d-ba30-e46b38ef1db8	Maip??	MAIP	2025-10-25 20:51:41.213429
6d0e0fe2-7979-4fd7-9005-d0713f9efade	544b1326-255f-404d-ba30-e46b38ef1db8	??u??oa	NUNO	2025-10-25 20:51:41.213429
7705bbfd-811a-474e-8c64-7e81b613791b	8aa6459b-5fe8-41df-a236-1f995d30bbed	Arica	ARICA	2025-10-25 23:16:59.334429
dfd13d65-431e-4aad-a198-e92c940d0730	8aa6459b-5fe8-41df-a236-1f995d30bbed	Camarones	CAM	2025-10-25 23:16:59.334429
f019bd95-74c2-4cd0-938d-d483c24d63b5	8aa6459b-5fe8-41df-a236-1f995d30bbed	Putre	PUT	2025-10-25 23:16:59.334429
914b3d06-ac31-4ed7-83da-a49166c4a80c	8aa6459b-5fe8-41df-a236-1f995d30bbed	General Lagos	GLA	2025-10-25 23:16:59.334429
5557ee06-f541-4a66-b110-2a264cc959e3	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Antofagasta	ANF	2025-10-25 23:16:59.334429
0eaa26f3-b19c-4fa8-9f9f-7340b45acccf	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Mejillones	MEJ	2025-10-25 23:16:59.334429
7a56f525-35cf-4e6f-8e01-b8206af524ee	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Sierra Gorda	SGO	2025-10-25 23:16:59.334429
de6e53b5-d4b8-454f-aeed-eb163b13d108	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Taltal	TAL	2025-10-25 23:16:59.334429
d7c255f0-4b5a-4ba9-9862-00dd7f05c6ea	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Calama	CAL	2025-10-25 23:16:59.334429
b280b387-ddae-47e3-86b9-7cf7a5f1c0ac	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Ollag??e	OLL	2025-10-25 23:16:59.334429
a2de10b8-261d-4d02-afdc-a958d0bd6dc6	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	San Pedro de Atacama	SPA	2025-10-25 23:16:59.334429
bbfecd83-b670-49a5-809f-25b1aad7033a	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Tocopilla	TOC	2025-10-25 23:16:59.334429
022e23c7-40e9-4024-bbc2-d79ae9069f48	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Mar??a Elena	MEL	2025-10-25 23:16:59.334429
114ec132-8e1b-46bb-96a3-4d8c187fcabb	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Copiap??	COP	2025-10-25 23:16:59.334429
14b23da8-9bfb-43ec-8496-f791989df7e6	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Caldera	CALD	2025-10-25 23:16:59.334429
dc95ba07-b8a1-43bc-82d1-51b88e300371	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Tierra Amarilla	TAM	2025-10-25 23:16:59.334429
6d3a7cb8-ded3-4225-aa52-ca2813628f13	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Cha??aral	CHA	2025-10-25 23:16:59.334429
44990576-5fc6-41fd-ad6a-c706ca547354	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Diego de Almagro	DAL	2025-10-25 23:16:59.334429
8c738dff-e117-4b7d-80d9-af10fbf166e1	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Vallenar	VAL	2025-10-25 23:16:59.334429
48f3c961-a5d6-48c1-a4ee-495609ad948a	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Huasco	HUA3	2025-10-25 23:16:59.334429
34b97cc5-6ae2-40f0-aa05-11bd6eac3f4b	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Freirina	FRE	2025-10-25 23:16:59.334429
f502865e-0935-4c95-a0cf-7de339425f31	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Alto del Carmen	ADC	2025-10-25 23:16:59.334429
7a9d6e28-e8c7-49c2-825c-87b2952183e1	9312d0b5-0c85-4ed7-b97c-1349ab24def6	La Serena	LS	2025-10-25 23:16:59.334429
82dd4478-7f1c-4506-82be-d9f816b08008	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Coquimbo	CQB	2025-10-25 23:16:59.334429
6069576e-3687-486d-8be1-ed88c400a493	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Andacollo	AND	2025-10-25 23:16:59.334429
eecccf12-0745-41fe-86a2-cfd4e1c81342	9312d0b5-0c85-4ed7-b97c-1349ab24def6	La Higuera	LH	2025-10-25 23:16:59.334429
cbbc1524-bec4-4497-bde1-66dcf3f6b775	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Paihuano	PAI	2025-10-25 23:16:59.334429
38b9ce44-a410-4bcd-86c9-cdc9db915aca	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Vicu??a	VIC	2025-10-25 23:16:59.334429
3b7f751a-fdd9-48a3-af14-3a21f96b575f	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Illapel	ILL	2025-10-25 23:16:59.334429
c4be5bab-0fee-4324-ac82-9c8b0f22d767	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Canela	CAN	2025-10-25 23:16:59.334429
a7ef93c0-501e-4e79-b525-f44454c1ea10	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Los Vilos	LV	2025-10-25 23:16:59.334429
4d364647-3ed3-4da1-9c3b-1a96881b89e1	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Salamanca	SAL	2025-10-25 23:16:59.334429
872f976d-62a6-4576-a4b3-c79227d4b02f	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Ovalle	OVL	2025-10-25 23:16:59.334429
ae06b4e3-dc42-4dd3-a8fb-b7f522a63d33	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Combarbal??	COM	2025-10-25 23:16:59.334429
421be529-0ba5-4cf6-96f5-fcf6484dfc38	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Monte Patria	MP	2025-10-25 23:16:59.334429
3770cb62-6f60-4dce-9755-5d4325c836f6	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Punitaqui	PUN	2025-10-25 23:16:59.334429
ba8f1595-1fd9-45cb-aa6b-7a2927a48014	9312d0b5-0c85-4ed7-b97c-1349ab24def6	R??o Hurtado	RH	2025-10-25 23:16:59.334429
6bb991ba-783b-4978-9f7d-e98bc91d29e9	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Rancagua	RAN	2025-10-25 23:16:59.334429
1536beec-2066-4d0b-8d86-a583886df169	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Machal??	MAC	2025-10-25 23:16:59.334429
ee67d5a2-c32e-4876-8f4b-c1e5c28fb374	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Graneros	GRA	2025-10-25 23:16:59.334429
56106508-ea87-4ffd-8c24-293147448742	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Do??ihue	DON	2025-10-25 23:16:59.334429
c3522583-e6c0-4fd1-920c-b44647083890	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Coltauco	COLT	2025-10-25 23:16:59.334429
49cec7ce-6d56-4387-b579-15e378ac590d	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Coinco	COI	2025-10-25 23:16:59.334429
1ea35dd2-e89f-47b7-a9c0-51ea96ec14cb	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Las Cabras	LC	2025-10-25 23:16:59.334429
06e458a3-3626-4dca-8ed8-635e463b7194	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Requ??noa	REQ	2025-10-25 23:16:59.334429
89a409a6-4b65-4c25-bc7e-4af5cae2e1f9	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Rengo	REN	2025-10-25 23:16:59.334429
f77db83f-3110-4a7e-baa8-1edb5de3c9c2	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Olivar	OLI	2025-10-25 23:16:59.334429
dde6eaed-32e4-4dfd-bd4e-a886f00d72a2	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Malloa	MAL	2025-10-25 23:16:59.334429
7fa197a9-56c4-403a-ac80-ed25507f7da4	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Quinta de Tilcoco	QDT	2025-10-25 23:16:59.334429
05b22804-9b6f-47cc-a8cb-6f69e959866e	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	San Vicente	SV	2025-10-25 23:16:59.334429
a079fa39-aa83-4e51-9050-a59747ca5435	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Pichidegua	PIC	2025-10-25 23:16:59.334429
15eba7b3-eb23-4f7a-b5ce-90ae8de12d25	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Peumo	PEU	2025-10-25 23:16:59.334429
903d495f-1b33-41ca-93ae-d996c15dc4de	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	San Fernando	SFE2	2025-10-25 23:16:59.334429
10641937-cb9e-4cad-b02d-914074bde5c4	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Chimbarongo	CHI	2025-10-25 23:16:59.334429
c3f98fe8-18b6-47b1-8be7-ad17db6d56c6	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Nancagua	NAN	2025-10-25 23:16:59.334429
9245bb57-5754-46e3-be93-5e91f6201f40	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Placilla	PLA	2025-10-25 23:16:59.334429
c8ea8a97-f809-4842-9682-dd44c7bdfebe	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Santa Cruz	SCR	2025-10-25 23:16:59.334429
62b4be40-a416-4195-8e56-69e866140080	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Palmilla	PALM	2025-10-25 23:16:59.334429
289ae9f1-b02d-42f2-a371-1cd93e1af88d	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Peralillo	PER	2025-10-25 23:16:59.334429
d434a22f-546b-45e7-b2fe-395ea9579547	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Lolol	LOL	2025-10-25 23:16:59.334429
7cf84e57-fa34-47ee-8fdd-ebcc7451142d	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Pumanque	PUM	2025-10-25 23:16:59.334429
7c6e2f3e-8986-4f07-9e49-ff6fdce529c5	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Pichilemu	PMU	2025-10-25 23:16:59.334429
2e12a405-c7bb-416f-b603-aaaf341afa36	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	La Estrella	LES	2025-10-25 23:16:59.334429
4329666b-3500-4d2e-a4c4-316a6fab2a8a	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Litueche	LIT	2025-10-25 23:16:59.334429
521b9fbd-5783-4f3f-ae87-34d2fdd51783	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Marchig??e	MAR	2025-10-25 23:16:59.334429
16eced15-ce85-4c22-8a8c-b92652d4583b	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Navidad	NAV	2025-10-25 23:16:59.334429
f9c3612c-2f2f-40dc-af0a-300767626e2c	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Paredones	PAR	2025-10-25 23:16:59.334429
a183151b-5990-4239-8aca-21b463dfb1a4	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Talca	TALC	2025-10-25 23:16:59.334429
22637f2c-f33c-46c2-aafc-f36c70542ac9	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Constituci??n	CON	2025-10-25 23:16:59.334429
094e28c8-08ef-4d59-a86d-29639f9b807e	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Curepto	CUR	2025-10-25 23:16:59.334429
5562b65b-5023-42b4-9edf-02254a1d35f6	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Empedrado	EMP	2025-10-25 23:16:59.334429
1d141c5b-b63c-4101-9097-6ed720d7cc09	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Maule	MAU	2025-10-25 23:16:59.334429
a1cd5fd8-70c8-43e8-bcd6-f1e184b0c03e	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Pelarco	PEL	2025-10-25 23:16:59.334429
abfea697-7c61-4c98-99eb-09622980f867	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Pencahue	PEN	2025-10-25 23:16:59.334429
5f6615d9-0596-4e2d-b566-f5bb2a7d1918	88b28e48-46d5-49bb-8b35-f2dc85ca9998	R??o Claro	RCL	2025-10-25 23:16:59.334429
d92543e9-24a7-4a8e-ac68-5949f520a4ed	88b28e48-46d5-49bb-8b35-f2dc85ca9998	San Clemente	SCL	2025-10-25 23:16:59.334429
0e02dbb6-1f9e-462f-a7b3-2f4dfa40a00c	88b28e48-46d5-49bb-8b35-f2dc85ca9998	San Rafael	SRF	2025-10-25 23:16:59.334429
e0b2fb55-9956-4bad-bdea-81c9bf36bd61	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Curic??	CURC	2025-10-25 23:16:59.334429
62819a2a-e3de-4622-9d98-7fa73d2de0e3	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Huala????	HUA2	2025-10-25 23:16:59.334429
bacd3a1f-b3e4-42af-ba28-5be72c0faaf7	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Licant??n	LIC	2025-10-25 23:16:59.334429
170a0b76-e6b9-46f3-a5ee-cac4ae98109c	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Molina	MOL	2025-10-25 23:16:59.334429
62185a55-be70-45f1-b5f4-0f90a4ea9cc7	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Rauco	RAU	2025-10-25 23:16:59.334429
4a56bbc1-3bef-449b-add7-406c2c155658	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Romeral	ROM	2025-10-25 23:16:59.334429
d0380e03-3526-41c0-9695-950d44208057	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Sagrada Familia	SAG	2025-10-25 23:16:59.334429
2d8f8d06-64f3-4eee-85b1-9ca962014159	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Teno	TEN	2025-10-25 23:16:59.334429
49bf989c-a6b0-41d9-8e8d-e22e3b3f5739	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Vichuqu??n	VIC2	2025-10-25 23:16:59.334429
6c7af7d0-e385-4ffb-8ade-61928f3b5907	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Linares	LIN	2025-10-25 23:16:59.334429
87b7147e-7ae4-42af-bf90-a7b59a4eac89	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Colb??n	COLB	2025-10-25 23:16:59.334429
440a2b18-67ad-4be1-b5c3-159d6c2c1c80	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Longav??	LON	2025-10-25 23:16:59.334429
89c070ac-e535-444c-8eff-5dd30da85a60	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Parral	PAR2	2025-10-25 23:16:59.334429
3818de2b-9546-4155-8ec7-b57e5e428e25	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Retiro	RET	2025-10-25 23:16:59.334429
01882e5b-7a48-4440-8b37-4e89a5250c34	88b28e48-46d5-49bb-8b35-f2dc85ca9998	San Javier	SJ	2025-10-25 23:16:59.334429
b2137d89-6f81-42de-a41f-ffc3cd0f188c	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Villa Alegre	VAL2	2025-10-25 23:16:59.334429
8e4a97ac-82a0-4d64-a9bf-fa028d731f67	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Yerbas Buenas	YB	2025-10-25 23:16:59.334429
fb52182d-e070-4bce-9809-857ca7dc323b	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Cauquenes	CAU	2025-10-25 23:16:59.334429
b120bc4b-42b7-4695-8d90-6648500879a6	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Chanco	CHA2	2025-10-25 23:16:59.334429
ef3c6ad5-fa5e-4165-8fc3-18f237112e85	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Pelluhue	PEL2	2025-10-25 23:16:59.334429
6b1c2a70-52ad-47f9-ae0c-97488fd8c5d7	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Puerto Montt	PMT	2025-10-25 23:16:59.334429
34d2ee95-8d16-42ac-9190-1b1dec3e9cae	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Calbuco	CAL2	2025-10-25 23:16:59.334429
091bbdab-2bf5-4c6a-8b69-9cfb623f48b0	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Cocham??	COC	2025-10-25 23:16:59.334429
053ad9d7-6d8e-4935-81c1-60716e19ac80	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Maull??n	MAU2	2025-10-25 23:16:59.334429
f22900c9-f852-4f00-a562-851f1ed418b7	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Puerto Varas	PVA	2025-10-25 23:16:59.334429
0e1bac4b-f97b-44cf-a24e-ad4baf9a04f2	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Llanquihue	LLA2	2025-10-25 23:16:59.334429
be9b923c-290f-4bd7-9d07-0b2b86b0741a	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Frutillar	FRU	2025-10-25 23:16:59.334429
af89cae2-aa29-450e-a84b-25ef92cc7006	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Fresia	FRE3	2025-10-25 23:16:59.334429
04bf44f1-c737-464b-9814-bd5ea82a89ba	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Los Muermos	LMU	2025-10-25 23:16:59.334429
074f24f0-4cfd-47fd-a72d-049a53ffa3b7	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Osorno	OSO	2025-10-25 23:16:59.334429
79fc12fa-926b-4bf1-82df-926de6c6d18f	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Puyehue	PUY	2025-10-25 23:16:59.334429
ef793751-248c-4b7b-bac1-1e9f58f000f3	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	R??o Negro	RNE	2025-10-25 23:16:59.334429
78145f11-be7a-467d-9f37-669552ae4e8b	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Purranque	PUR2	2025-10-25 23:16:59.334429
94087fc9-d338-4738-aa18-e0271bcdd905	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	San Pablo	SPB	2025-10-25 23:16:59.334429
99287fe1-4884-4c05-9d15-905eea973978	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Castro	CAS2	2025-10-25 23:16:59.334429
70e33716-9d3c-4a5c-8a0e-3942b3464cc2	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Ancud	ANC	2025-10-25 23:16:59.334429
3fb09c62-3c64-4585-b868-69e6b01a7c2c	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Quell??n	QUE	2025-10-25 23:16:59.334429
1533b6f4-41a3-47cb-a24b-cc3df32463f2	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Quemchi	QUEM	2025-10-25 23:16:59.334429
ec49f30c-33a9-453e-ad3c-c79b288d9a05	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Dalcahue	DAL2	2025-10-25 23:16:59.334429
f4838fba-14bc-4762-b734-f18879c45a00	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Curaco de V??lez	CDV	2025-10-25 23:16:59.334429
00241b78-6ab8-4e42-9415-1a7264198582	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Puqueld??n	PUQ	2025-10-25 23:16:59.334429
92273de2-8a56-42d0-ac54-e1e25a903b1c	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Queil??n	QEI	2025-10-25 23:16:59.334429
1b59b2eb-d203-4cc3-97d5-a71e86a7d1ce	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Chonchi	CHO2	2025-10-25 23:16:59.334429
1ae01cbd-8f40-45f4-904e-c44be66c31c8	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Chait??n	CHA3	2025-10-25 23:16:59.334429
06199919-57ec-44ae-b3e9-68545697458c	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Futaleuf??	FUT2	2025-10-25 23:16:59.334429
e4c797fc-9380-4009-ac68-615350e38855	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Hualaihu??	HUA6	2025-10-25 23:16:59.334429
7a13e43a-53e9-4240-8610-ec22a73ba7bf	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Palena	PAL2	2025-10-25 23:16:59.334429
a64e1687-838c-4fa6-8636-e7f2dcf40d12	8e21a1a3-2c15-4510-af30-a136b1493cf8	Iquique	IQQ	2025-10-25 23:43:24.277952
dc12bc22-e19f-41b1-ba63-c38c6de007c0	8e21a1a3-2c15-4510-af30-a136b1493cf8	Alto Hospicio	AHOS	2025-10-25 23:43:24.277952
56bfcc05-2e5f-4147-af80-37b3a27d800e	8e21a1a3-2c15-4510-af30-a136b1493cf8	Pozo Almonte	PAL	2025-10-25 23:43:24.277952
a5c1efbb-597c-4827-b8f3-409d465db345	8e21a1a3-2c15-4510-af30-a136b1493cf8	Cami??a	CAMI	2025-10-25 23:43:24.277952
d64701ff-c60e-4a65-9040-22cf31c63cda	8e21a1a3-2c15-4510-af30-a136b1493cf8	Colchane	COL	2025-10-25 23:43:24.277952
59b2cb7c-f4d9-4a26-ab42-456aa9b2d05e	8e21a1a3-2c15-4510-af30-a136b1493cf8	Huara	HUA	2025-10-25 23:43:24.277952
34e36cc5-e2d1-476a-8d2c-a1110a7a2a5c	8e21a1a3-2c15-4510-af30-a136b1493cf8	Pica	PICA	2025-10-25 23:43:24.277952
05e5f814-25fc-4f32-9421-5b69895e538f	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Ollag??e	OLL	2025-10-25 23:43:24.277952
6ff1dfc2-ad40-4e69-a683-a1720e179983	e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Mar??a Elena	MEL	2025-10-25 23:43:24.277952
f89701a5-db9b-4863-b8ac-36ed9d2e0039	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Copiap??	COP	2025-10-25 23:43:24.277952
6bd4a722-947d-4a62-9760-2f831df56114	21810b5a-d8d0-4caa-94bf-76cfe39238ed	Cha??aral	CHA	2025-10-25 23:43:24.277952
f562fb9f-ba83-4972-8b29-c299806398be	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Vicu??a	VIC	2025-10-25 23:43:24.277952
1e0d08fe-02b8-41c5-9c7b-9e78f641b9eb	9312d0b5-0c85-4ed7-b97c-1349ab24def6	Combarbal??	COM	2025-10-25 23:43:24.277952
366a3cad-a11e-4a92-91c2-99f7fac46387	9312d0b5-0c85-4ed7-b97c-1349ab24def6	R??o Hurtado	RH	2025-10-25 23:43:24.277952
de70f1e9-9ef3-46c3-a19b-80bfcdd64bf8	a0616bd8-63c0-4282-8619-06ccf951897d	Valpara??so	VALP	2025-10-25 23:43:24.277952
eaec9db4-28eb-4de1-b372-0fcad51be18a	a0616bd8-63c0-4282-8619-06ccf951897d	Vi??a del Mar	VDM	2025-10-25 23:43:24.277952
9d458869-b3d6-457e-8e7f-fbb332b9a10c	a0616bd8-63c0-4282-8619-06ccf951897d	Conc??n	CONC	2025-10-25 23:43:24.277952
cf625546-29c7-4371-9962-ef4443ca2fd4	a0616bd8-63c0-4282-8619-06ccf951897d	Quintero	QTR	2025-10-25 23:43:24.277952
5f7d7e56-6162-40b6-84fd-554f8783bd2b	a0616bd8-63c0-4282-8619-06ccf951897d	Puchuncav??	PUC	2025-10-25 23:43:24.277952
f2e3334f-5b02-4f5f-825d-f8dbce92ddc0	a0616bd8-63c0-4282-8619-06ccf951897d	Casablanca	CAS	2025-10-25 23:43:24.277952
fef2e10a-4525-4666-bb4b-6091872c58a0	a0616bd8-63c0-4282-8619-06ccf951897d	Juan Fern??ndez	JF	2025-10-25 23:43:24.277952
7c412f0e-c41d-49ed-8c11-7a169ece9ca7	a0616bd8-63c0-4282-8619-06ccf951897d	Quillota	QUI	2025-10-25 23:43:24.277952
557c20bc-6ed6-4d46-a921-cf5b7dd18f6f	a0616bd8-63c0-4282-8619-06ccf951897d	La Calera	LCA	2025-10-25 23:43:24.277952
93c70899-955f-489a-864f-e1770ed83f63	a0616bd8-63c0-4282-8619-06ccf951897d	La Cruz	LCR	2025-10-25 23:43:24.277952
f592a671-7b13-4c82-9ac2-55b7bcbc75a7	a0616bd8-63c0-4282-8619-06ccf951897d	Nogales	NOG	2025-10-25 23:43:24.277952
54c895e5-2ed4-4cd8-b72c-a21452c87870	a0616bd8-63c0-4282-8619-06ccf951897d	Hijuelas	HIJ	2025-10-25 23:43:24.277952
341e964e-9936-4e29-9bd2-1e960218cc64	a0616bd8-63c0-4282-8619-06ccf951897d	San Antonio	SA	2025-10-25 23:43:24.277952
4cbaabc4-0b66-4051-850a-d1a942f79e78	a0616bd8-63c0-4282-8619-06ccf951897d	Cartagena	CAR	2025-10-25 23:43:24.277952
2695a9f7-ca95-4230-9d78-457b9c04a3de	a0616bd8-63c0-4282-8619-06ccf951897d	El Tabo	ETB	2025-10-25 23:43:24.277952
08059ba6-4ca9-4bb0-9aeb-b1a5867e755f	a0616bd8-63c0-4282-8619-06ccf951897d	El Quisco	EQ	2025-10-25 23:43:24.277952
a857ab48-ce79-439f-84ea-fbdd5e5cfd48	a0616bd8-63c0-4282-8619-06ccf951897d	Algarrobo	ALG	2025-10-25 23:43:24.277952
81e19216-a1b2-4a22-9469-2f553086e876	a0616bd8-63c0-4282-8619-06ccf951897d	San Felipe	SFE	2025-10-25 23:43:24.277952
3a1e520f-e155-4af1-9cf8-7996e1e5e07e	a0616bd8-63c0-4282-8619-06ccf951897d	Llaillay	LLA	2025-10-25 23:43:24.277952
0593678d-f10a-4c78-9a41-5edb53d6fbaa	a0616bd8-63c0-4282-8619-06ccf951897d	Catemu	CAT	2025-10-25 23:43:24.277952
5c445795-dfb6-498c-9537-a90e919c995d	a0616bd8-63c0-4282-8619-06ccf951897d	Panquehue	PAN	2025-10-25 23:43:24.277952
537a94a6-8a0d-4fdb-9d63-408252a48972	a0616bd8-63c0-4282-8619-06ccf951897d	Putaendo	PUTA	2025-10-25 23:43:24.277952
59b476e7-e31f-47cc-a577-e57a09e1717c	a0616bd8-63c0-4282-8619-06ccf951897d	Santa Mar??a	SM	2025-10-25 23:43:24.277952
bf0b4b99-0171-4b8a-8a47-d17b566835c6	a0616bd8-63c0-4282-8619-06ccf951897d	Los Andes	LAN	2025-10-25 23:43:24.277952
f5bf33a0-3253-4384-b660-352fa651d0fb	a0616bd8-63c0-4282-8619-06ccf951897d	Calle Larga	CLL	2025-10-25 23:43:24.277952
71074c7d-cf99-4998-a2d1-afcf65400ced	a0616bd8-63c0-4282-8619-06ccf951897d	Rinconada	RIN	2025-10-25 23:43:24.277952
2910e6c0-e0f3-46e1-898d-9a44056725d3	a0616bd8-63c0-4282-8619-06ccf951897d	San Esteban	SE	2025-10-25 23:43:24.277952
9570c5ef-7bca-4f29-b619-3ea306892a96	a0616bd8-63c0-4282-8619-06ccf951897d	La Ligua	LLI	2025-10-25 23:43:24.277952
3f389701-b12f-4e6c-87fa-590ccccdef76	a0616bd8-63c0-4282-8619-06ccf951897d	Cabildo	CAB	2025-10-25 23:43:24.277952
a4e946d1-587f-4ccc-9c9e-7e39fa838693	a0616bd8-63c0-4282-8619-06ccf951897d	Zapallar	ZAP	2025-10-25 23:43:24.277952
8170c93f-e3cb-4a9c-b770-3bd427b6a13a	a0616bd8-63c0-4282-8619-06ccf951897d	Papudo	PAP	2025-10-25 23:43:24.277952
76f6fd0c-31d9-452e-8f69-304422d2bf1c	a0616bd8-63c0-4282-8619-06ccf951897d	Quilpu??	QPE	2025-10-25 23:43:24.277952
77ee83e0-86fc-4364-a952-39212151f294	a0616bd8-63c0-4282-8619-06ccf951897d	Villa Alemana	VA	2025-10-25 23:43:24.277952
ab3b5dd5-09e1-4817-943d-8c6da7b09e9f	a0616bd8-63c0-4282-8619-06ccf951897d	Limache	LIM	2025-10-25 23:43:24.277952
7dac830a-411a-4f4d-8f9f-ee2b733131a7	a0616bd8-63c0-4282-8619-06ccf951897d	Olmu??	OLM	2025-10-25 23:43:24.277952
0784e7e7-61ce-439b-bb4c-4cfd95c54aff	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Machal??	MAC	2025-10-25 23:43:24.277952
3a33159b-179b-4883-bc5a-68eaa07c91a0	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Do??ihue	DON	2025-10-25 23:43:24.277952
10a44763-9569-49b3-887e-627e5a3f3b72	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Requ??noa	REQ	2025-10-25 23:43:24.277952
179a1d1a-f621-4937-97b8-4e96f05865cf	bb25a914-158d-4f6c-b5e2-adc1697f5fa8	Marchig??e	MAR	2025-10-25 23:43:24.277952
956866cf-5029-4c3f-a6e1-4bb623a393d2	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Constituci??n	CON	2025-10-25 23:43:24.277952
dff915b3-d85b-452a-8349-0d5bd418c3da	88b28e48-46d5-49bb-8b35-f2dc85ca9998	R??o Claro	RCL	2025-10-25 23:43:24.277952
16519ffa-8ff7-428d-b11a-d413bd4bfad0	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Curic??	CURC	2025-10-25 23:43:24.277952
91a3145b-7c60-4efb-8a6b-57946aeafd2b	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Huala????	HUA2	2025-10-25 23:43:24.277952
c10dc2bc-1863-47f8-9a55-bd02ae476df1	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Licant??n	LIC	2025-10-25 23:43:24.277952
22683ae4-ab1f-4175-9b04-d6d767aa4f7a	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Vichuqu??n	VIC2	2025-10-25 23:43:24.277952
7de83fa6-6cee-44c8-b040-fdd32131ead6	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Colb??n	COLB	2025-10-25 23:43:24.277952
903a1204-8db5-4ac2-8746-42a1fc3b8978	88b28e48-46d5-49bb-8b35-f2dc85ca9998	Longav??	LON	2025-10-25 23:43:24.277952
3ac8d67e-2201-4e24-904f-3f277a2c212e	a78bc36c-2633-42e4-ba60-eba26cdd1364	Chill??n	CHN	2025-10-25 23:43:24.277952
e8a3e87c-1504-4cb5-a714-3837805f01c9	a78bc36c-2633-42e4-ba60-eba26cdd1364	Chill??n Viejo	CHV	2025-10-25 23:43:24.277952
4f2ce396-6270-4aa5-835c-f6b662c87c69	a78bc36c-2633-42e4-ba60-eba26cdd1364	Bulnes	BUL	2025-10-25 23:43:24.277952
6a54d96c-ec6a-4d52-8700-c1f15a28c4de	a78bc36c-2633-42e4-ba60-eba26cdd1364	Quill??n	QUI2	2025-10-25 23:43:24.277952
1d98a899-f695-4c6f-a0be-492795c47e41	a78bc36c-2633-42e4-ba60-eba26cdd1364	San Ignacio	SIG	2025-10-25 23:43:24.277952
b82d2ef3-fb86-494d-9778-64ccbc6887a8	a78bc36c-2633-42e4-ba60-eba26cdd1364	El Carmen	ELC	2025-10-25 23:43:24.277952
e8160bc9-aab2-4627-9438-cc12ded00229	a78bc36c-2633-42e4-ba60-eba26cdd1364	Pemuco	PEM	2025-10-25 23:43:24.277952
a919907f-24c6-4cea-a558-7609fe840d8e	a78bc36c-2633-42e4-ba60-eba26cdd1364	Yungay	YUN	2025-10-25 23:43:24.277952
83d95245-410f-4f44-839c-ae9dcf6913fe	a78bc36c-2633-42e4-ba60-eba26cdd1364	San Carlos	SCA	2025-10-25 23:43:24.277952
53686ffb-ab0f-412b-bace-be464406462f	a78bc36c-2633-42e4-ba60-eba26cdd1364	Coihueco	COI2	2025-10-25 23:43:24.277952
7d0ed041-75d4-48cc-8f3e-a3c6ca651c3b	a78bc36c-2633-42e4-ba60-eba26cdd1364	San Fabi??n	SFB	2025-10-25 23:43:24.277952
cef00ead-2798-44ec-a0ee-7a4bcee763b2	a78bc36c-2633-42e4-ba60-eba26cdd1364	??iqu??n	NIQ	2025-10-25 23:43:24.277952
a2f67ee1-1299-4e70-ab1b-4d4c7937a974	a78bc36c-2633-42e4-ba60-eba26cdd1364	San Nicol??s	SNI	2025-10-25 23:43:24.277952
c57ae84f-78b8-45f4-8ed6-4b67c27ff12f	a78bc36c-2633-42e4-ba60-eba26cdd1364	Ninhue	NIN	2025-10-25 23:43:24.277952
48d72348-aa80-43aa-b208-1f7342c7a35f	a78bc36c-2633-42e4-ba60-eba26cdd1364	Portezuelo	POR	2025-10-25 23:43:24.277952
c8baa6c6-2ce8-4af6-ada9-48ded8a6e8a8	a78bc36c-2633-42e4-ba60-eba26cdd1364	Quirihue	QUIR	2025-10-25 23:43:24.277952
cb7fa982-4a4d-477e-8743-f91646c1e72f	a78bc36c-2633-42e4-ba60-eba26cdd1364	Cobquecura	COB	2025-10-25 23:43:24.277952
7e7c4fb3-62d3-464e-bdad-735f5711e4a3	a78bc36c-2633-42e4-ba60-eba26cdd1364	Trehuaco	TRE	2025-10-25 23:43:24.277952
dd312900-58b1-4746-9096-c95bf06c0f6d	a78bc36c-2633-42e4-ba60-eba26cdd1364	R??nquil	RAN	2025-10-25 23:43:24.277952
58f86b50-d00a-41f5-8d12-35b7bb990319	a78bc36c-2633-42e4-ba60-eba26cdd1364	Coelemu	COE	2025-10-25 23:43:24.277952
b3ff8b76-0537-4b19-9b1e-f03b30aba1d8	88459e42-8f39-434e-b466-ee4cbf3c3764	Concepci??n	CONC2	2025-10-25 23:43:24.277952
19e57e98-c04a-47e9-9766-5292fb30bdf5	88459e42-8f39-434e-b466-ee4cbf3c3764	Coronel	COR	2025-10-25 23:43:24.277952
252833d0-3c39-46b3-9976-cfbcc07a4500	88459e42-8f39-434e-b466-ee4cbf3c3764	Chiguayante	CHI3	2025-10-25 23:43:24.277952
8b329593-eadc-4be8-893f-65b7bf188d9f	88459e42-8f39-434e-b466-ee4cbf3c3764	Florida	FLO	2025-10-25 23:43:24.277952
51a410c8-ea06-4f0d-a765-34c80e1bca67	88459e42-8f39-434e-b466-ee4cbf3c3764	Hualp??n	HUA4	2025-10-25 23:43:24.277952
38f32402-4f31-4b09-ad88-40aa26ac36ce	88459e42-8f39-434e-b466-ee4cbf3c3764	Hualqui	HUA5	2025-10-25 23:43:24.277952
7aaaf0e9-ce12-4ca8-b147-42a4789f1e92	88459e42-8f39-434e-b466-ee4cbf3c3764	Lota	LOT	2025-10-25 23:43:24.277952
abac643e-5032-458b-9c40-4f9c424d9adc	88459e42-8f39-434e-b466-ee4cbf3c3764	Penco	PEN2	2025-10-25 23:43:24.277952
b944095f-809c-47ad-9436-7d02ee26ab37	88459e42-8f39-434e-b466-ee4cbf3c3764	San Pedro de la Paz	SPDLP	2025-10-25 23:43:24.277952
07b7008b-d687-43c1-9b45-8023fa2f3c3e	88459e42-8f39-434e-b466-ee4cbf3c3764	Santa Juana	SJU	2025-10-25 23:43:24.277952
887e52c9-455a-4a60-b0d5-6fc2ab39cd15	88459e42-8f39-434e-b466-ee4cbf3c3764	Talcahuano	TAL2	2025-10-25 23:43:24.277952
84f37f64-6a33-40ea-881b-56012efc9b55	88459e42-8f39-434e-b466-ee4cbf3c3764	Tom??	TOM	2025-10-25 23:43:24.277952
1462a2b5-26f3-4fe2-b095-98a2b534c268	88459e42-8f39-434e-b466-ee4cbf3c3764	Los ??ngeles	LAN2	2025-10-25 23:43:24.277952
04f06625-45ef-4d98-9f2c-21f6ae4a119f	88459e42-8f39-434e-b466-ee4cbf3c3764	Antuco	ANT	2025-10-25 23:43:24.277952
4a60e3e7-6a8e-4536-841c-4fa7012d381d	88459e42-8f39-434e-b466-ee4cbf3c3764	Cabrero	CAB2	2025-10-25 23:43:24.277952
dab59ad7-0a51-421c-9439-72e8d4d1361a	88459e42-8f39-434e-b466-ee4cbf3c3764	Laja	LAJ	2025-10-25 23:43:24.277952
bfa943e6-3f8f-48e7-a334-5e0adecd5412	88459e42-8f39-434e-b466-ee4cbf3c3764	Mulch??n	MUL	2025-10-25 23:43:24.277952
ec9fd014-10e3-416f-baf3-c73261a41dcd	88459e42-8f39-434e-b466-ee4cbf3c3764	Nacimiento	NAC	2025-10-25 23:43:24.277952
0758848e-3f73-4a5a-9d81-8b00af9fd03f	88459e42-8f39-434e-b466-ee4cbf3c3764	Negrete	NEG	2025-10-25 23:43:24.277952
bb7aaf7b-e865-4ab1-be21-24fb01213137	88459e42-8f39-434e-b466-ee4cbf3c3764	Quilaco	QLC	2025-10-25 23:43:24.277952
c4020ad8-fa71-491a-b2e6-bfd839e0660f	88459e42-8f39-434e-b466-ee4cbf3c3764	Quilleco	QLL	2025-10-25 23:43:24.277952
c9d1505c-e61b-4f1f-89e5-e3eacfbc30f2	88459e42-8f39-434e-b466-ee4cbf3c3764	San Rosendo	SRS	2025-10-25 23:43:24.277952
0a369bfd-a1f0-47bc-90ae-686b36e0f882	88459e42-8f39-434e-b466-ee4cbf3c3764	Santa B??rbara	SBA	2025-10-25 23:43:24.277952
22cec944-70b5-43d2-a15f-115651b6cc15	88459e42-8f39-434e-b466-ee4cbf3c3764	Tucapel	TUC	2025-10-25 23:43:24.277952
a9b7ea38-be87-4bf8-ac2f-6e6d503cadd9	88459e42-8f39-434e-b466-ee4cbf3c3764	Yumbel	YUM	2025-10-25 23:43:24.277952
e9094496-e248-4f73-a1c2-996933486325	88459e42-8f39-434e-b466-ee4cbf3c3764	Alto Biob??o	ABI	2025-10-25 23:43:24.277952
19bc1819-d634-411b-a044-510d6c3f6a66	88459e42-8f39-434e-b466-ee4cbf3c3764	Arauco	ARU	2025-10-25 23:43:24.277952
0ee5c14f-0006-459b-abb0-90df3fb0b852	88459e42-8f39-434e-b466-ee4cbf3c3764	Ca??ete	CAN2	2025-10-25 23:43:24.277952
b400ca9b-993c-42d2-a346-89219b7abeaf	88459e42-8f39-434e-b466-ee4cbf3c3764	Contulmo	CON3	2025-10-25 23:43:24.277952
ed985487-44b3-40a7-9a8a-b5b08ac6d0e9	88459e42-8f39-434e-b466-ee4cbf3c3764	Curanilahue	CUR2	2025-10-25 23:43:24.277952
691dd730-2dba-4bbb-a9b8-0d966a69841e	88459e42-8f39-434e-b466-ee4cbf3c3764	Lebu	LEB	2025-10-25 23:43:24.277952
af998c34-b4d7-42b8-a629-ff67d1aae0c9	88459e42-8f39-434e-b466-ee4cbf3c3764	Los ??lamos	LAL	2025-10-25 23:43:24.277952
ddbe5a29-f9eb-4d42-9845-d190fdccdf4b	88459e42-8f39-434e-b466-ee4cbf3c3764	Tir??a	TIR	2025-10-25 23:43:24.277952
5c590ea6-e7f7-4881-9d6a-70b4de3d1373	b41ac88c-44e5-4484-807a-2be4bc61513d	Temuco	TEM	2025-10-25 23:43:24.277952
8c48125c-dfe7-46ba-9ead-769572d2354d	b41ac88c-44e5-4484-807a-2be4bc61513d	Carahue	CAR2	2025-10-25 23:43:24.277952
e634b1aa-05af-4c4a-8d3e-2f4cb375e377	b41ac88c-44e5-4484-807a-2be4bc61513d	Cholchol	CHO	2025-10-25 23:43:24.277952
af066684-1379-4acc-baee-2f379cefd084	b41ac88c-44e5-4484-807a-2be4bc61513d	Cunco	CUN	2025-10-25 23:43:24.277952
10f19995-b922-491e-b2c2-fc7b4c59c330	b41ac88c-44e5-4484-807a-2be4bc61513d	Curarrehue	CUR3	2025-10-25 23:43:24.277952
638ac2b8-0d54-4ac6-b84f-7494e0fcfbf2	b41ac88c-44e5-4484-807a-2be4bc61513d	Freire	FRE2	2025-10-25 23:43:24.277952
237b86e0-3da7-4581-ba43-3ed474786fdc	b41ac88c-44e5-4484-807a-2be4bc61513d	Galvarino	GAL	2025-10-25 23:43:24.277952
a00e47e3-c7ea-4b03-a88d-ba19e0320ef8	b41ac88c-44e5-4484-807a-2be4bc61513d	Gorbea	GOR	2025-10-25 23:43:24.277952
2c3ff2ef-21f2-4235-bfb0-5825d55d8081	b41ac88c-44e5-4484-807a-2be4bc61513d	Lautaro	LAU	2025-10-25 23:43:24.277952
fb3a7b41-f5fb-45c6-adaf-12c443140f3f	b41ac88c-44e5-4484-807a-2be4bc61513d	Loncoche	LON2	2025-10-25 23:43:24.277952
e3cd7ccb-16aa-415a-ae25-ff04b87d7104	b41ac88c-44e5-4484-807a-2be4bc61513d	Melipeuco	MEL2	2025-10-25 23:43:24.277952
c72e6678-dccf-4aa7-8e20-17f4aed60158	b41ac88c-44e5-4484-807a-2be4bc61513d	Nueva Imperial	NIM	2025-10-25 23:43:24.277952
e0a34757-4e3b-4efe-a810-e62be180e699	b41ac88c-44e5-4484-807a-2be4bc61513d	Padre Las Casas	PLC	2025-10-25 23:43:24.277952
86c0f264-3897-4e11-806a-68a200e9ced5	b41ac88c-44e5-4484-807a-2be4bc61513d	Perquenco	PER2	2025-10-25 23:43:24.277952
d90edc6f-1f73-4444-9c96-e704c206ce86	b41ac88c-44e5-4484-807a-2be4bc61513d	Pitrufqu??n	PIT	2025-10-25 23:43:24.277952
4743077a-dd7b-45a6-8c7b-36233da04367	b41ac88c-44e5-4484-807a-2be4bc61513d	Puc??n	PUC2	2025-10-25 23:43:24.277952
29d837b4-0d4d-4f69-b5f0-ff375a09b116	b41ac88c-44e5-4484-807a-2be4bc61513d	Saavedra	SAA	2025-10-25 23:43:24.277952
eb8717c8-abfe-4c82-a0c9-2c9078f2018d	b41ac88c-44e5-4484-807a-2be4bc61513d	Teodoro Schmidt	TS	2025-10-25 23:43:24.277952
dfe63fa4-5842-4e21-a960-78c3f450a385	b41ac88c-44e5-4484-807a-2be4bc61513d	Tolt??n	TOL	2025-10-25 23:43:24.277952
63912c31-5a7c-4cf3-936f-402bceaff5f5	b41ac88c-44e5-4484-807a-2be4bc61513d	Vilc??n	VIL	2025-10-25 23:43:24.277952
e07cbc98-4d50-4141-8e9e-7fce288ddf59	b41ac88c-44e5-4484-807a-2be4bc61513d	Villarrica	VIC3	2025-10-25 23:43:24.277952
ee8d7758-b867-4c14-b1f3-98539c10e183	b41ac88c-44e5-4484-807a-2be4bc61513d	Angol	ANG	2025-10-25 23:43:24.277952
8492842d-a441-483d-b0f1-e16b53f58967	b41ac88c-44e5-4484-807a-2be4bc61513d	Collipulli	COL2	2025-10-25 23:43:24.277952
d30ba428-2d93-40fb-bc84-9ed78255bfb8	b41ac88c-44e5-4484-807a-2be4bc61513d	Curacaut??n	CUR4	2025-10-25 23:43:24.277952
3f1f71e9-b488-412d-892b-f2c2764de768	b41ac88c-44e5-4484-807a-2be4bc61513d	Ercilla	ERC	2025-10-25 23:43:24.277952
f1aeda07-0e32-447b-bd79-3989048905cd	b41ac88c-44e5-4484-807a-2be4bc61513d	Lonquimay	LQM	2025-10-25 23:43:24.277952
80cdf944-f91f-4ed3-a5c6-fd90b4cb2b9f	b41ac88c-44e5-4484-807a-2be4bc61513d	Los Sauces	LSA	2025-10-25 23:43:24.277952
a93fb4a9-0a71-48ce-b737-0597c242f85c	b41ac88c-44e5-4484-807a-2be4bc61513d	Lumaco	LUM	2025-10-25 23:43:24.277952
c4691f84-32ef-456a-8c2a-fa507453a816	b41ac88c-44e5-4484-807a-2be4bc61513d	Pur??n	PUR	2025-10-25 23:43:24.277952
839e0f76-ca88-45b3-98e7-8e738eb107c0	b41ac88c-44e5-4484-807a-2be4bc61513d	Renaico	REN2	2025-10-25 23:43:24.277952
1c01a4d7-0d74-4790-bcec-599f369ec44e	b41ac88c-44e5-4484-807a-2be4bc61513d	Traigu??n	TRA	2025-10-25 23:43:24.277952
88355a0e-1b7d-48e2-bafd-1491350e0def	b41ac88c-44e5-4484-807a-2be4bc61513d	Victoria	VIC4	2025-10-25 23:43:24.277952
a8b3243b-636c-4774-bd06-3b97d6b1f196	aaeca420-285f-45c5-8387-8d1ac360c074	Valdivia	VAL2	2025-10-25 23:43:24.277952
c995f541-8029-4db1-a928-578fe80a21ca	aaeca420-285f-45c5-8387-8d1ac360c074	Corral	COR2	2025-10-25 23:43:24.277952
c36369ac-e870-491f-80d2-bfb94f4ffc50	aaeca420-285f-45c5-8387-8d1ac360c074	Lanco	LAN3	2025-10-25 23:43:24.277952
31d09574-4b04-47b8-b99a-f43880471600	aaeca420-285f-45c5-8387-8d1ac360c074	Los Lagos	LLG	2025-10-25 23:43:24.277952
2e85fd5b-02db-45d3-9752-742a04df127a	aaeca420-285f-45c5-8387-8d1ac360c074	M??fil	MAF	2025-10-25 23:43:24.277952
e45dd7e8-9483-4811-bb87-9f23d57fc28b	aaeca420-285f-45c5-8387-8d1ac360c074	Mariquina	MAR2	2025-10-25 23:43:24.277952
96c68843-f0f8-4527-8193-ad2c59abb5c0	aaeca420-285f-45c5-8387-8d1ac360c074	Paillaco	PAI2	2025-10-25 23:43:24.277952
23fc73a4-7583-49b6-bbc2-d20be3db9249	aaeca420-285f-45c5-8387-8d1ac360c074	Panguipulli	PAN2	2025-10-25 23:43:24.277952
9066c4d7-ffef-437e-b0e4-87ce56d8f5be	aaeca420-285f-45c5-8387-8d1ac360c074	La Uni??n	LUN	2025-10-25 23:43:24.277952
cd683e8a-a9ae-4fe5-87ca-eee8849e047d	aaeca420-285f-45c5-8387-8d1ac360c074	Futrono	FUT	2025-10-25 23:43:24.277952
bb84f155-621d-4b10-a4be-f3e8d502620c	aaeca420-285f-45c5-8387-8d1ac360c074	Lago Ranco	LR	2025-10-25 23:43:24.277952
dc294f65-815f-4572-8e08-b410d645e93c	aaeca420-285f-45c5-8387-8d1ac360c074	R??o Bueno	RBU	2025-10-25 23:43:24.277952
e3822abd-0b01-494b-9636-acd1d1243261	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Cocham??	COC	2025-10-25 23:43:24.277952
e5a9501d-fd2e-4acd-829f-d45264f0160c	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Maull??n	MAU2	2025-10-25 23:43:24.277952
8378024e-192b-4d25-954f-c847a96b33cc	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	R??o Negro	RNE	2025-10-25 23:43:24.277952
f75edf40-9c69-475c-af9c-1e588b80c67c	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Quell??n	QUE	2025-10-25 23:43:24.277952
84a3e0a5-3847-4136-81db-629da9ac3c02	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Curaco de V??lez	CDV	2025-10-25 23:43:24.277952
43b9f9f1-5bdf-49e2-b88b-baa821e8f552	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Puqueld??n	PUQ	2025-10-25 23:43:24.277952
2a88c559-b23e-48a6-9376-6e6c8178b26a	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Queil??n	QEI	2025-10-25 23:43:24.277952
7e45fbfc-c3fc-40a3-921a-87e56ce93583	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Chait??n	CHA3	2025-10-25 23:43:24.277952
7a7c54b9-1469-4f52-995b-a6dbb1ad94b8	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Futaleuf??	FUT2	2025-10-25 23:43:24.277952
671b19e4-5b49-4028-948a-eed98c2477f7	3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Hualaihu??	HUA6	2025-10-25 23:43:24.277952
a70c6b5d-92c4-46c5-815f-7c68ea94372a	2ef34dc4-9193-4de5-8002-57524010ca44	Coyhaique	COY	2025-10-25 23:43:24.277952
e9842246-6fac-4e0b-9eb5-511ea5159758	2ef34dc4-9193-4de5-8002-57524010ca44	Lago Verde	LVE	2025-10-25 23:43:24.277952
611a800f-498c-4396-b405-03d1fb04f374	2ef34dc4-9193-4de5-8002-57524010ca44	Ays??n	AYS	2025-10-25 23:43:24.277952
67954ad9-bfdf-4a2e-be77-292afac2e9ad	2ef34dc4-9193-4de5-8002-57524010ca44	Cisnes	CIS	2025-10-25 23:43:24.277952
ee6bd25b-e012-4f3c-b359-339a0c0f880c	2ef34dc4-9193-4de5-8002-57524010ca44	Guaitecas	GUA	2025-10-25 23:43:24.277952
c6719056-fad3-4ce3-9ca8-0b0944c3b148	2ef34dc4-9193-4de5-8002-57524010ca44	Cochrane	COC2	2025-10-25 23:43:24.277952
71fe2a3b-41b6-4c60-8fe8-1509ff18797f	2ef34dc4-9193-4de5-8002-57524010ca44	O'Higgins	OH	2025-10-25 23:43:24.277952
75384538-8b9c-4865-9fdc-1831509a1158	2ef34dc4-9193-4de5-8002-57524010ca44	Tortel	TOR	2025-10-25 23:43:24.277952
27a89514-5e21-4539-971b-a7461e65dc4a	2ef34dc4-9193-4de5-8002-57524010ca44	Chile Chico	CHC	2025-10-25 23:43:24.277952
4ff7a441-6e57-43bf-a826-c7b487b0171e	2ef34dc4-9193-4de5-8002-57524010ca44	R??o Ib????ez	RIB	2025-10-25 23:43:24.277952
9cf9293d-47e2-4c5a-826e-83d16fb149fe	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Punta Arenas	PA	2025-10-25 23:43:24.277952
cb142460-12b1-4014-834c-1262724de7e8	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Laguna Blanca	LAG	2025-10-25 23:43:24.277952
2bf50007-6a47-4637-acea-9bafb707d429	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	R??o Verde	RVE	2025-10-25 23:43:24.277952
66e416a6-a7a4-47fb-861e-65e02f548b83	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	San Gregorio	SGR	2025-10-25 23:43:24.277952
f7da0a36-0163-4d7b-ab63-f576e929e1ee	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Cabo de Hornos	CDH	2025-10-25 23:43:24.277952
f6dd179a-cc3b-43fe-9d3a-15f4ac4fdad2	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Ant??rtica	ANTC	2025-10-25 23:43:24.277952
2f825da5-79df-40db-903c-837429c94315	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Porvenir	POR2	2025-10-25 23:43:24.277952
77ea965a-0bff-45ef-a7b6-99cdf4364466	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Primavera	PRI	2025-10-25 23:43:24.277952
43193af6-ad99-4141-b978-ee92f034cfd0	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Timaukel	TIM	2025-10-25 23:43:24.277952
31ef1db9-0edc-4ffa-8419-c83ff681e73a	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Puerto Natales	PNA	2025-10-25 23:43:24.277952
0266fa9d-b5b8-4b80-b191-7b1fd0e4ab8f	eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Torres del Paine	TDP	2025-10-25 23:43:24.277952
\.


--
-- Data for Name: cuenta_bancaria_profesional; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuenta_bancaria_profesional (id_cuenta_bancaria_profesional, rut_usuario, banco, tipo_cuenta, numero_cuenta, rut_titular, nombre_titular, email_contacto, prioridad, estado, creado_en, actualizado_en, es_principal) FROM stdin;
\.


--
-- Data for Name: cuenta_bancaria_servihogar; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuenta_bancaria_servihogar (id_cuenta_bancaria_servihogar, nombre_identificador, banco, tipo_cuenta, numero_cuenta, rut_titular, nombre_titular, email_contacto, prioridad, estado, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: dia_bloqueado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dia_bloqueado (id_dia_bloqueado, id_servicio_profesional, fecha, motivo, creado_en) FROM stdin;
36fb056b-9967-42b1-acd1-c0d94bb914f0	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-01		2025-10-27 21:47:15.555207
f4327acd-ae3a-463b-bd9f-c52c505715b4	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-02		2025-10-27 21:47:15.555207
96dfcde2-0d69-4cb3-af66-139cb39eb45f	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-03		2025-10-27 21:47:15.555207
e9c933ec-4e30-442f-9fd1-4231deb4d411	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-04		2025-10-27 21:47:15.555207
b5cbc34b-5224-42b8-a161-157a712dfd90	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-05		2025-10-27 21:47:15.555207
ebd79ecc-c82e-427b-8c14-1d5493a64995	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-06		2025-10-27 21:47:15.555207
e9b9513b-523b-4146-a283-ba617d2ba4fe	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-07		2025-10-27 21:47:15.555207
9834d7ee-bb79-4c48-95bc-145a8e4f0ffe	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-08		2025-10-27 21:47:15.555207
68684557-3bc9-4574-a776-17ceb603d39f	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-09		2025-10-27 21:47:15.555207
5178e22c-de4f-4b43-b0d3-6a2c7a0697b1	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-10		2025-10-27 21:47:15.555207
21c97bd9-fe35-4446-9c50-c184b829fd8c	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-11		2025-10-27 21:47:15.555207
288eaab9-b70b-4c77-a6c8-fc6e27180b1a	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-12		2025-10-27 21:47:15.555207
a59b13c6-b509-4d7e-9b5e-57e263926afd	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-13		2025-10-27 21:47:15.555207
160849b2-b8eb-43d4-a853-fd9b6e404403	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-14		2025-10-27 21:47:15.555207
e71bf192-5952-4f6e-a7df-d86a29c5b4ff	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-15		2025-10-27 21:47:15.555207
cfcdd076-9268-4bd8-bd21-f88afd05ce87	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-16		2025-10-27 21:47:15.555207
deaff25b-218a-42eb-9d47-5598bc3ecc47	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-17		2025-10-27 21:47:15.555207
1cce1786-6ccb-4bbb-bbf4-e07a2a91b7df	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-18		2025-10-27 21:47:15.555207
b77102fa-341d-4eb5-8dc0-08f2d6c2c0a1	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-19		2025-10-27 21:47:15.555207
2cd5398d-a074-4530-b1fc-e804df5a0565	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-20		2025-10-27 21:47:15.555207
7e43876a-8859-448c-948a-617bac87f1d1	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-21		2025-10-27 21:47:15.555207
0e0c05b0-489d-4e6e-bde9-5f825318ca84	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-22		2025-10-27 21:47:15.555207
13c47d5f-9aca-441c-a516-c0d0418cd1d5	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-23		2025-10-27 21:47:15.555207
1bf1aa24-e9b1-4b1d-bdfe-1b3aba0e6082	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-24		2025-10-27 21:47:15.555207
8aaf97ae-8103-4275-b4e8-b6cc60815cdd	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-25		2025-10-27 21:47:15.555207
8d7819d9-f135-4c38-a124-5069c5932dbb	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-26		2025-10-27 21:47:15.555207
f64ac873-5f7f-44ec-9fbe-af3f0bd73bde	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-27		2025-10-27 21:47:15.555207
3e5cbc95-e885-4f44-90fc-4f24b2e8b2a6	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-28		2025-10-27 21:47:15.555207
527d199b-f83d-4007-980c-dce093f9dba6	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-29		2025-10-27 21:47:15.555207
ca2b387a-105c-476b-a96c-b2dc4b347114	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-30		2025-10-27 21:47:15.555207
411cc573-be20-4396-b0cd-2f2fc577f53f	00aa1ee1-c1a2-4971-8b72-761de5fc9340	2025-10-31		2025-10-27 21:47:15.555207
\.


--
-- Data for Name: disputa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disputa (id_disputa, id_solicitud_servicio, rut_reportante, rut_reportado, tipo_disputa, descripcion, evidencia_url, estado, resolucion, rut_resuelto_por, resuelta_en, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	auth	user
5	contenttypes	contenttype
6	sessions	session
7	api	profile
8	api	serviceschedule
9	api	servicecustomperiod
10	api	serviceunavailability
11	api	categoriaservicio
12	api	documentoprofesional
13	api	perfilprofesional
14	api	servicioprofesional
15	api	usuariodominio
16	api	servicevisibility
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2025-10-18 03:21:38.992893+00
2	auth	0001_initial	2025-10-18 03:21:39.116517+00
3	admin	0001_initial	2025-10-18 03:21:39.153948+00
4	admin	0002_logentry_remove_auto_add	2025-10-18 03:21:39.161473+00
5	admin	0003_logentry_add_action_flag_choices	2025-10-18 03:21:39.169+00
6	api	0001_initial	2025-10-18 03:21:39.187558+00
7	api	0002_alter_profile_role	2025-10-18 03:21:39.194508+00
8	api	0003_schedule_models	2025-10-18 03:21:39.234854+00
9	api	0004_profile_avatar_url	2025-10-18 03:21:39.243242+00
10	api	0005_categoriaservicio_documentoprofesional_and_more	2025-10-18 03:21:39.252255+00
11	contenttypes	0002_remove_content_type_name	2025-10-18 03:21:39.270019+00
12	auth	0002_alter_permission_name_max_length	2025-10-18 03:21:39.278405+00
13	auth	0003_alter_user_email_max_length	2025-10-18 03:21:39.287292+00
14	auth	0004_alter_user_username_opts	2025-10-18 03:21:39.29523+00
15	auth	0005_alter_user_last_login_null	2025-10-18 03:21:39.306679+00
16	auth	0006_require_contenttypes_0002	2025-10-18 03:21:39.311574+00
17	auth	0007_alter_validators_add_error_messages	2025-10-18 03:21:39.321886+00
18	auth	0008_alter_user_username_max_length	2025-10-18 03:21:39.338954+00
19	auth	0009_alter_user_last_name_max_length	2025-10-18 03:21:39.346819+00
20	auth	0010_alter_group_name_max_length	2025-10-18 03:21:39.358914+00
21	auth	0011_update_proxy_permissions	2025-10-18 03:21:39.372518+00
22	auth	0012_alter_user_first_name_max_length	2025-10-18 03:21:39.382626+00
23	sessions	0001_initial	2025-10-18 03:21:39.397952+00
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
\.


--
-- Data for Name: documento_profesional; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documento_profesional (id_documento_profesional, rut_usuario, id_servicio_profesional, tipo_documento, url_archivo, tipo_mime, estado_verificacion, rut_verificador, verificado_en, razon_rechazo, subido_en) FROM stdin;
80b8d033-24d2-4a22-a1af-29a6264c1948	20.439.672-8	00aa1ee1-c1a2-4971-8b72-761de5fc9340	certificado_antecedentes	/media/uploads/profesionales/20.439.672-8/certificados/my-image%20(7).png	image/png	pendiente	\N	\N	\N	2025-10-27 01:53:00.662396
506a78b6-1c8a-4cb9-ae78-57a7258d0c38	20.439.672-8	00aa1ee1-c1a2-4971-8b72-761de5fc9340	certificado_experiencia	/media/uploads/profesionales/20.439.672-8/experiencia/Requerimientos_Funcionales_ServiHogar.pdf	application/pdf	pendiente	\N	\N	\N	2025-10-27 01:53:00.662396
\.


--
-- Data for Name: horario_profesional; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.horario_profesional (id_horario_profesional, id_servicio_profesional, dia_semana, hora_inicio, hora_fin, creado_en) FROM stdin;
\.


--
-- Data for Name: notificacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notificacion (id_notificacion, rut_usuario, tipo, titulo, mensaje, creado_en) FROM stdin;
\.


--
-- Data for Name: pago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pago (id_pago_mercadopago, id_solicitud_servicio, id_cuenta_destino_profesional, id_cuenta_origen_servihogar, monto, metodo_pago, estado, comision_plataforma, monto_profesional, liberado_al_profesional_en, reembolsado_en, monto_reembolso, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: pago_profesional; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pago_profesional (id_pago_profesional, id_retencion, id_pago_mercadopago, id_solicitud_servicio, rut_profesional, id_cuenta_profesional, monto_a_pagar, estado, metodo_pago, referencia_transaccion, comprobante_url, fecha_programada, fecha_procesado, fecha_pagado, motivo_fallo, notas, procesado_por, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: periodo_personalizado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.periodo_personalizado (id_periodo_personalizado, id_servicio_profesional, fecha_inicio, fecha_fin, hora_inicio, hora_fin, descripcion, creado_en) FROM stdin;
\.


--
-- Data for Name: region; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.region (id_region, nombre, codigo, creado_en) FROM stdin;
544b1326-255f-404d-ba30-e46b38ef1db8	Regi??n Metropolitana	RM	2025-10-25 20:51:41.213429
8aa6459b-5fe8-41df-a236-1f995d30bbed	Arica y Parinacota	XV	2025-10-25 20:51:41.213429
8e21a1a3-2c15-4510-af30-a136b1493cf8	Tarapac??	I	2025-10-25 20:51:41.213429
e75b12f6-9b5d-44d1-b103-69b4c921c9bc	Antofagasta	II	2025-10-25 20:51:41.213429
21810b5a-d8d0-4caa-94bf-76cfe39238ed	Atacama	III	2025-10-25 20:51:41.213429
9312d0b5-0c85-4ed7-b97c-1349ab24def6	Coquimbo	IV	2025-10-25 20:51:41.213429
a0616bd8-63c0-4282-8619-06ccf951897d	Valpara??so	V	2025-10-25 20:51:41.213429
bb25a914-158d-4f6c-b5e2-adc1697f5fa8	O'Higgins	VI	2025-10-25 20:51:41.213429
88b28e48-46d5-49bb-8b35-f2dc85ca9998	Maule	VII	2025-10-25 20:51:41.213429
a78bc36c-2633-42e4-ba60-eba26cdd1364	??uble	XVI	2025-10-25 20:51:41.213429
88459e42-8f39-434e-b466-ee4cbf3c3764	Biob??o	VIII	2025-10-25 20:51:41.213429
b41ac88c-44e5-4484-807a-2be4bc61513d	La Araucan??a	IX	2025-10-25 20:51:41.213429
aaeca420-285f-45c5-8387-8d1ac360c074	Los R??os	XIV	2025-10-25 20:51:41.213429
3fe42e2c-bdd8-4b8e-8999-bdf7a7573a65	Los Lagos	X	2025-10-25 20:51:41.213429
2ef34dc4-9193-4de5-8002-57524010ca44	Ays??n	XI	2025-10-25 20:51:41.213429
eebe1b36-2b2a-4aa5-b94d-577a8555cfe9	Magallanes y Ant??rtica Chilena	XII	2025-10-25 20:51:41.213429
\.


--
-- Data for Name: resena; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resena (id_resena, id_solicitud_servicio, rut_evaluador, rut_evaluado, comentario, calificacion_puntualidad, calificacion_calidad, calificacion_comunicacion, es_destacada, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: retencion_plataforma; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.retencion_plataforma (id_retencion, id_pago_mercadopago, id_solicitud_servicio, monto_total_pago, porcentaje_retencion, monto_retenido, monto_profesional, id_cuenta_destino_servihogar, retenido_en) FROM stdin;
\.


--
-- Data for Name: servicio_profesional; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.servicio_profesional (id_servicio_profesional, rut_usuario, id_categoria_servicio, anos_experiencia, descripcion, tipo_duracion, duracion_fija_minutos, duracion_minima_minutos, duracion_maxima_minutos, precio_fijo, estado_verificacion, rut_verificador, verificado_en, razon_rechazo, trabajos_completados, trabajos_cancelados, creado_en, actualizado_en) FROM stdin;
00aa1ee1-c1a2-4971-8b72-761de5fc9340	20.439.672-8	69ed82de-4e2c-43d7-8ae7-961d7afc9eaf	1	lmao2	fija	60	60	60	25000	aprobado	\N	2025-10-27 01:54:29.80727	\N	0	0	2025-10-27 01:53:00.662396	2025-10-27 01:54:29.807504
\.


--
-- Data for Name: solicitud_servicio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitud_servicio (id_solicitud_servicio, rut_cliente, rut_profesional, id_servicio_profesional, titulo, descripcion, fecha_programada, duracion_minutos, direccion_servicio, id_comuna_servicio, precio_total, estado, confirmado_en, iniciado_en, completado_en, cancelado_en, razon_cancelacion, creado_en, actualizado_en) FROM stdin;
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuario (rut, nombres, apellidos, email, telefono, genero, fecha_nacimiento, id_comuna, direccion, rol, foto_perfil_url, email_verificado, ultima_actividad, creado_en, actualizado_en, hash_contrasena, foto_perfil, foto_perfil_mime, foto_perfil_nombre, foto_perfil_tam) FROM stdin;
12.345.678-5	Test	User	testuser_001@example.com	+56912345678	masculino	1990-01-01	a9e247da-8984-42de-b889-3dbb9d3a23b5	Calle Falsa 123	cliente	\N	f	\N	2025-10-27 00:46:42.760039	2025-10-27 00:46:42.760045	\N	\N	\N	\N	\N
20.439.672-8	Matias Alejandro	Reuque Barros	sawrunner12@hotmail.com	+56 9 7812 3221	masculino	2000-11-19	51a410c8-ea06-4f0d-a765-34c80e1bca67	sdadasd	profesional	\N	t	\N	2025-10-27 00:51:33.99395	2025-10-27 01:54:29.812537	\N	\N	\N	\N	\N
\.


--
-- Name: api_profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.api_profile_id_seq', 13, true);


--
-- Name: api_service_custom_period_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.api_service_custom_period_id_seq', 1, false);


--
-- Name: api_service_unavailability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.api_service_unavailability_id_seq', 1, false);


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 64, true);


--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 1, false);


--
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 13, true);


--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 16, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 23, true);


--
-- Name: api_profile api_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_profile
    ADD CONSTRAINT api_profile_pkey PRIMARY KEY (id);


--
-- Name: api_profile api_profile_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_profile
    ADD CONSTRAINT api_profile_user_id_key UNIQUE (user_id);


--
-- Name: api_service_custom_period api_service_custom_period_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_service_custom_period
    ADD CONSTRAINT api_service_custom_period_pkey PRIMARY KEY (id);


--
-- Name: api_service_schedule api_service_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_service_schedule
    ADD CONSTRAINT api_service_schedule_pkey PRIMARY KEY (service_id);


--
-- Name: api_service_unavailability api_service_unavailability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_service_unavailability
    ADD CONSTRAINT api_service_unavailability_pkey PRIMARY KEY (id);


--
-- Name: api_service_visibility api_service_visibility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_service_visibility
    ADD CONSTRAINT api_service_visibility_pkey PRIMARY KEY (service_id);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: categoria_servicio categoria_servicio_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_servicio
    ADD CONSTRAINT categoria_servicio_nombre_key UNIQUE (nombre);


--
-- Name: categoria_servicio categoria_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_servicio
    ADD CONSTRAINT categoria_servicio_pkey PRIMARY KEY (id_categoria_servicio);


--
-- Name: categoria_servicio categoria_servicio_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_servicio
    ADD CONSTRAINT categoria_servicio_slug_key UNIQUE (slug);


--
-- Name: comuna comuna_id_region_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comuna
    ADD CONSTRAINT comuna_id_region_nombre_key UNIQUE (id_region, nombre);


--
-- Name: comuna comuna_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comuna
    ADD CONSTRAINT comuna_pkey PRIMARY KEY (id_comuna);


--
-- Name: cuenta_bancaria_profesional cuenta_bancaria_profesional_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_bancaria_profesional
    ADD CONSTRAINT cuenta_bancaria_profesional_pkey PRIMARY KEY (id_cuenta_bancaria_profesional);


--
-- Name: cuenta_bancaria_profesional cuenta_bancaria_profesional_rut_usuario_banco_numero_cuenta_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_bancaria_profesional
    ADD CONSTRAINT cuenta_bancaria_profesional_rut_usuario_banco_numero_cuenta_key UNIQUE (rut_usuario, banco, numero_cuenta);


--
-- Name: cuenta_bancaria_servihogar cuenta_bancaria_servihogar_nombre_identificador_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_bancaria_servihogar
    ADD CONSTRAINT cuenta_bancaria_servihogar_nombre_identificador_key UNIQUE (nombre_identificador);


--
-- Name: cuenta_bancaria_servihogar cuenta_bancaria_servihogar_numero_cuenta_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_bancaria_servihogar
    ADD CONSTRAINT cuenta_bancaria_servihogar_numero_cuenta_key UNIQUE (numero_cuenta);


--
-- Name: cuenta_bancaria_servihogar cuenta_bancaria_servihogar_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_bancaria_servihogar
    ADD CONSTRAINT cuenta_bancaria_servihogar_pkey PRIMARY KEY (id_cuenta_bancaria_servihogar);


--
-- Name: dia_bloqueado dia_bloqueado_id_servicio_profesional_fecha_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dia_bloqueado
    ADD CONSTRAINT dia_bloqueado_id_servicio_profesional_fecha_key UNIQUE (id_servicio_profesional, fecha);


--
-- Name: dia_bloqueado dia_bloqueado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dia_bloqueado
    ADD CONSTRAINT dia_bloqueado_pkey PRIMARY KEY (id_dia_bloqueado);


--
-- Name: disputa disputa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputa
    ADD CONSTRAINT disputa_pkey PRIMARY KEY (id_disputa);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: documento_profesional documento_profesional_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento_profesional
    ADD CONSTRAINT documento_profesional_pkey PRIMARY KEY (id_documento_profesional);


--
-- Name: horario_profesional horario_profesional_id_servicio_profesional_dia_semana_hora_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horario_profesional
    ADD CONSTRAINT horario_profesional_id_servicio_profesional_dia_semana_hora_key UNIQUE (id_servicio_profesional, dia_semana, hora_inicio);


--
-- Name: horario_profesional horario_profesional_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horario_profesional
    ADD CONSTRAINT horario_profesional_pkey PRIMARY KEY (id_horario_profesional);


--
-- Name: notificacion notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_pkey PRIMARY KEY (id_notificacion);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (id_pago_mercadopago);


--
-- Name: pago_profesional pago_profesional_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago_profesional
    ADD CONSTRAINT pago_profesional_pkey PRIMARY KEY (id_pago_profesional);


--
-- Name: periodo_personalizado periodo_personalizado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.periodo_personalizado
    ADD CONSTRAINT periodo_personalizado_pkey PRIMARY KEY (id_periodo_personalizado);


--
-- Name: region region_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_codigo_key UNIQUE (codigo);


--
-- Name: region region_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_nombre_key UNIQUE (nombre);


--
-- Name: region region_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_pkey PRIMARY KEY (id_region);


--
-- Name: resena resena_id_solicitud_servicio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resena
    ADD CONSTRAINT resena_id_solicitud_servicio_key UNIQUE (id_solicitud_servicio);


--
-- Name: resena resena_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resena
    ADD CONSTRAINT resena_pkey PRIMARY KEY (id_resena);


--
-- Name: retencion_plataforma retencion_plataforma_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retencion_plataforma
    ADD CONSTRAINT retencion_plataforma_pkey PRIMARY KEY (id_retencion);


--
-- Name: servicio_profesional servicio_profesional_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_profesional
    ADD CONSTRAINT servicio_profesional_pkey PRIMARY KEY (id_servicio_profesional);


--
-- Name: servicio_profesional servicio_profesional_rut_usuario_id_categoria_servicio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_profesional
    ADD CONSTRAINT servicio_profesional_rut_usuario_id_categoria_servicio_key UNIQUE (rut_usuario, id_categoria_servicio);


--
-- Name: solicitud_servicio solicitud_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_servicio
    ADD CONSTRAINT solicitud_servicio_pkey PRIMARY KEY (id_solicitud_servicio);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (rut);


--
-- Name: api_service_custom_period_schedule_id_6f64aeab; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX api_service_custom_period_schedule_id_6f64aeab ON public.api_service_custom_period USING btree (schedule_id);


--
-- Name: api_service_unavailability_schedule_id_ae0d71c0; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX api_service_unavailability_schedule_id_ae0d71c0 ON public.api_service_unavailability USING btree (schedule_id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: idx_notificacion_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacion_tipo ON public.notificacion USING btree (tipo);


--
-- Name: idx_notificacion_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notificacion_usuario ON public.notificacion USING btree (rut_usuario);


--
-- Name: idx_pago_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_estado ON public.pago USING btree (estado);


--
-- Name: idx_pago_prof_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_prof_estado ON public.pago_profesional USING btree (estado);


--
-- Name: idx_pago_prof_fecha_pagado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_prof_fecha_pagado ON public.pago_profesional USING btree (fecha_pagado);


--
-- Name: idx_pago_prof_fecha_programada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_prof_fecha_programada ON public.pago_profesional USING btree (fecha_programada);


--
-- Name: idx_pago_prof_profesional; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_prof_profesional ON public.pago_profesional USING btree (rut_profesional);


--
-- Name: idx_pago_prof_solicitud; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_prof_solicitud ON public.pago_profesional USING btree (id_solicitud_servicio);


--
-- Name: idx_pago_solicitud; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pago_solicitud ON public.pago USING btree (id_solicitud_servicio);


--
-- Name: idx_resena_destacada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resena_destacada ON public.resena USING btree (es_destacada);


--
-- Name: idx_resena_evaluado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resena_evaluado ON public.resena USING btree (rut_evaluado);


--
-- Name: idx_resena_evaluador; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resena_evaluador ON public.resena USING btree (rut_evaluador);


--
-- Name: idx_retencion_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_retencion_fecha ON public.retencion_plataforma USING btree (retenido_en);


--
-- Name: idx_retencion_pago; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_retencion_pago ON public.retencion_plataforma USING btree (id_pago_mercadopago);


--
-- Name: idx_retencion_solicitud; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_retencion_solicitud ON public.retencion_plataforma USING btree (id_solicitud_servicio);


--
-- Name: idx_servicio_profesional_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_servicio_profesional_categoria ON public.servicio_profesional USING btree (id_categoria_servicio);


--
-- Name: idx_servicio_profesional_rut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_servicio_profesional_rut ON public.servicio_profesional USING btree (rut_usuario);


--
-- Name: idx_servicio_profesional_verificacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_servicio_profesional_verificacion ON public.servicio_profesional USING btree (estado_verificacion);


--
-- Name: idx_solicitud_servicio_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_servicio_cliente ON public.solicitud_servicio USING btree (rut_cliente);


--
-- Name: idx_solicitud_servicio_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_servicio_estado ON public.solicitud_servicio USING btree (estado);


--
-- Name: idx_solicitud_servicio_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_servicio_fecha ON public.solicitud_servicio USING btree (fecha_programada);


--
-- Name: idx_solicitud_servicio_profesional; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitud_servicio_profesional ON public.solicitud_servicio USING btree (rut_profesional);


--
-- Name: idx_usuario_comuna; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_comuna ON public.usuario USING btree (id_comuna);


--
-- Name: idx_usuario_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_email ON public.usuario USING btree (email);


--
-- Name: idx_usuario_rol; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_rol ON public.usuario USING btree (rol);


--
-- Name: uq_cuenta_principal_por_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_cuenta_principal_por_usuario ON public.cuenta_bancaria_profesional USING btree (rut_usuario) WHERE (prioridad = 1);


--
-- Name: servicio_profesional trigger_actualizar_servicio_profesional; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_actualizar_servicio_profesional BEFORE UPDATE ON public.servicio_profesional FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();


--
-- Name: solicitud_servicio trigger_actualizar_solicitud_servicio; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_actualizar_solicitud_servicio BEFORE UPDATE ON public.solicitud_servicio FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();


--
-- Name: usuario trigger_actualizar_usuario; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_actualizar_usuario BEFORE UPDATE ON public.usuario FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp();


--
-- Name: servicio_profesional trigger_validar_max_servicios; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_validar_max_servicios BEFORE INSERT ON public.servicio_profesional FOR EACH ROW EXECUTE FUNCTION public.validar_max_servicios_profesional();


--
-- Name: api_profile api_profile_user_id_41309820_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_profile
    ADD CONSTRAINT api_profile_user_id_41309820_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: api_service_custom_period api_service_custom_p_schedule_id_6f64aeab_fk_api_servi; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_service_custom_period
    ADD CONSTRAINT api_service_custom_p_schedule_id_6f64aeab_fk_api_servi FOREIGN KEY (schedule_id) REFERENCES public.api_service_schedule(service_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: api_service_unavailability api_service_unavaila_schedule_id_ae0d71c0_fk_api_servi; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_service_unavailability
    ADD CONSTRAINT api_service_unavaila_schedule_id_ae0d71c0_fk_api_servi FOREIGN KEY (schedule_id) REFERENCES public.api_service_schedule(service_id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: comuna comuna_id_region_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comuna
    ADD CONSTRAINT comuna_id_region_fkey FOREIGN KEY (id_region) REFERENCES public.region(id_region) ON DELETE CASCADE;


--
-- Name: cuenta_bancaria_profesional cuenta_bancaria_profesional_rut_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_bancaria_profesional
    ADD CONSTRAINT cuenta_bancaria_profesional_rut_usuario_fkey FOREIGN KEY (rut_usuario) REFERENCES public.usuario(rut) ON DELETE CASCADE;


--
-- Name: dia_bloqueado dia_bloqueado_id_servicio_profesional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dia_bloqueado
    ADD CONSTRAINT dia_bloqueado_id_servicio_profesional_fkey FOREIGN KEY (id_servicio_profesional) REFERENCES public.servicio_profesional(id_servicio_profesional) ON DELETE CASCADE;


--
-- Name: disputa disputa_id_solicitud_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputa
    ADD CONSTRAINT disputa_id_solicitud_servicio_fkey FOREIGN KEY (id_solicitud_servicio) REFERENCES public.solicitud_servicio(id_solicitud_servicio);


--
-- Name: disputa disputa_rut_reportado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputa
    ADD CONSTRAINT disputa_rut_reportado_fkey FOREIGN KEY (rut_reportado) REFERENCES public.usuario(rut);


--
-- Name: disputa disputa_rut_reportante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputa
    ADD CONSTRAINT disputa_rut_reportante_fkey FOREIGN KEY (rut_reportante) REFERENCES public.usuario(rut);


--
-- Name: disputa disputa_rut_resuelto_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disputa
    ADD CONSTRAINT disputa_rut_resuelto_por_fkey FOREIGN KEY (rut_resuelto_por) REFERENCES public.usuario(rut);


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: documento_profesional documento_profesional_id_servicio_profesional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento_profesional
    ADD CONSTRAINT documento_profesional_id_servicio_profesional_fkey FOREIGN KEY (id_servicio_profesional) REFERENCES public.servicio_profesional(id_servicio_profesional) ON DELETE SET NULL;


--
-- Name: documento_profesional documento_profesional_rut_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento_profesional
    ADD CONSTRAINT documento_profesional_rut_usuario_fkey FOREIGN KEY (rut_usuario) REFERENCES public.usuario(rut) ON DELETE CASCADE;


--
-- Name: documento_profesional documento_profesional_rut_verificador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documento_profesional
    ADD CONSTRAINT documento_profesional_rut_verificador_fkey FOREIGN KEY (rut_verificador) REFERENCES public.usuario(rut);


--
-- Name: horario_profesional horario_profesional_id_servicio_profesional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.horario_profesional
    ADD CONSTRAINT horario_profesional_id_servicio_profesional_fkey FOREIGN KEY (id_servicio_profesional) REFERENCES public.servicio_profesional(id_servicio_profesional) ON DELETE CASCADE;


--
-- Name: notificacion notificacion_rut_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_rut_usuario_fkey FOREIGN KEY (rut_usuario) REFERENCES public.usuario(rut);


--
-- Name: pago pago_id_cuenta_destino_profesional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_id_cuenta_destino_profesional_fkey FOREIGN KEY (id_cuenta_destino_profesional) REFERENCES public.cuenta_bancaria_profesional(id_cuenta_bancaria_profesional);


--
-- Name: pago pago_id_cuenta_origen_servihogar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_id_cuenta_origen_servihogar_fkey FOREIGN KEY (id_cuenta_origen_servihogar) REFERENCES public.cuenta_bancaria_servihogar(id_cuenta_bancaria_servihogar);


--
-- Name: pago pago_id_solicitud_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_id_solicitud_servicio_fkey FOREIGN KEY (id_solicitud_servicio) REFERENCES public.solicitud_servicio(id_solicitud_servicio);


--
-- Name: pago_profesional pago_profesional_id_cuenta_profesional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago_profesional
    ADD CONSTRAINT pago_profesional_id_cuenta_profesional_fkey FOREIGN KEY (id_cuenta_profesional) REFERENCES public.cuenta_bancaria_profesional(id_cuenta_bancaria_profesional);


--
-- Name: pago_profesional pago_profesional_id_pago_mercadopago_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago_profesional
    ADD CONSTRAINT pago_profesional_id_pago_mercadopago_fkey FOREIGN KEY (id_pago_mercadopago) REFERENCES public.pago(id_pago_mercadopago);


--
-- Name: pago_profesional pago_profesional_id_retencion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago_profesional
    ADD CONSTRAINT pago_profesional_id_retencion_fkey FOREIGN KEY (id_retencion) REFERENCES public.retencion_plataforma(id_retencion);


--
-- Name: pago_profesional pago_profesional_id_solicitud_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago_profesional
    ADD CONSTRAINT pago_profesional_id_solicitud_servicio_fkey FOREIGN KEY (id_solicitud_servicio) REFERENCES public.solicitud_servicio(id_solicitud_servicio);


--
-- Name: pago_profesional pago_profesional_procesado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago_profesional
    ADD CONSTRAINT pago_profesional_procesado_por_fkey FOREIGN KEY (procesado_por) REFERENCES public.usuario(rut);


--
-- Name: pago_profesional pago_profesional_rut_profesional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pago_profesional
    ADD CONSTRAINT pago_profesional_rut_profesional_fkey FOREIGN KEY (rut_profesional) REFERENCES public.usuario(rut);


--
-- Name: periodo_personalizado periodo_personalizado_id_servicio_profesional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.periodo_personalizado
    ADD CONSTRAINT periodo_personalizado_id_servicio_profesional_fkey FOREIGN KEY (id_servicio_profesional) REFERENCES public.servicio_profesional(id_servicio_profesional) ON DELETE CASCADE;


--
-- Name: resena resena_id_solicitud_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resena
    ADD CONSTRAINT resena_id_solicitud_servicio_fkey FOREIGN KEY (id_solicitud_servicio) REFERENCES public.solicitud_servicio(id_solicitud_servicio);


--
-- Name: resena resena_rut_evaluado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resena
    ADD CONSTRAINT resena_rut_evaluado_fkey FOREIGN KEY (rut_evaluado) REFERENCES public.usuario(rut);


--
-- Name: resena resena_rut_evaluador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resena
    ADD CONSTRAINT resena_rut_evaluador_fkey FOREIGN KEY (rut_evaluador) REFERENCES public.usuario(rut);


--
-- Name: retencion_plataforma retencion_plataforma_id_cuenta_destino_servihogar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retencion_plataforma
    ADD CONSTRAINT retencion_plataforma_id_cuenta_destino_servihogar_fkey FOREIGN KEY (id_cuenta_destino_servihogar) REFERENCES public.cuenta_bancaria_servihogar(id_cuenta_bancaria_servihogar);


--
-- Name: retencion_plataforma retencion_plataforma_id_pago_mercadopago_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retencion_plataforma
    ADD CONSTRAINT retencion_plataforma_id_pago_mercadopago_fkey FOREIGN KEY (id_pago_mercadopago) REFERENCES public.pago(id_pago_mercadopago);


--
-- Name: retencion_plataforma retencion_plataforma_id_solicitud_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.retencion_plataforma
    ADD CONSTRAINT retencion_plataforma_id_solicitud_servicio_fkey FOREIGN KEY (id_solicitud_servicio) REFERENCES public.solicitud_servicio(id_solicitud_servicio);


--
-- Name: servicio_profesional servicio_profesional_id_categoria_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_profesional
    ADD CONSTRAINT servicio_profesional_id_categoria_servicio_fkey FOREIGN KEY (id_categoria_servicio) REFERENCES public.categoria_servicio(id_categoria_servicio);


--
-- Name: servicio_profesional servicio_profesional_rut_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_profesional
    ADD CONSTRAINT servicio_profesional_rut_usuario_fkey FOREIGN KEY (rut_usuario) REFERENCES public.usuario(rut) ON DELETE CASCADE;


--
-- Name: servicio_profesional servicio_profesional_rut_verificador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicio_profesional
    ADD CONSTRAINT servicio_profesional_rut_verificador_fkey FOREIGN KEY (rut_verificador) REFERENCES public.usuario(rut);


--
-- Name: solicitud_servicio solicitud_servicio_id_comuna_servicio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_servicio
    ADD CONSTRAINT solicitud_servicio_id_comuna_servicio_fkey FOREIGN KEY (id_comuna_servicio) REFERENCES public.comuna(id_comuna);


--
-- Name: solicitud_servicio solicitud_servicio_id_servicio_profesional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_servicio
    ADD CONSTRAINT solicitud_servicio_id_servicio_profesional_fkey FOREIGN KEY (id_servicio_profesional) REFERENCES public.servicio_profesional(id_servicio_profesional);


--
-- Name: solicitud_servicio solicitud_servicio_rut_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_servicio
    ADD CONSTRAINT solicitud_servicio_rut_cliente_fkey FOREIGN KEY (rut_cliente) REFERENCES public.usuario(rut);


--
-- Name: solicitud_servicio solicitud_servicio_rut_profesional_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitud_servicio
    ADD CONSTRAINT solicitud_servicio_rut_profesional_fkey FOREIGN KEY (rut_profesional) REFERENCES public.usuario(rut);


--
-- Name: usuario usuario_id_comuna_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_id_comuna_fkey FOREIGN KEY (id_comuna) REFERENCES public.comuna(id_comuna);


--
-- PostgreSQL database dump complete
--

\unrestrict dUJGciS1JwtTdq2tmeuciayNBUj0yd6SyK0n44ohS3vRLzkZViipcD8dgg18W2h

