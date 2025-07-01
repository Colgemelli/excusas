-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.archivos_adjuntos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id uuid NOT NULL,
  nombre_archivo character varying NOT NULL,
  nombre_original character varying NOT NULL,
  tipo_archivo character varying NOT NULL,
  mime_type character varying NOT NULL,
  tamaño_bytes bigint NOT NULL,
  ruta_archivo text NOT NULL,
  checksum_md5 character varying,
  subido_por_ip inet,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT archivos_adjuntos_pkey PRIMARY KEY (id),
  CONSTRAINT archivos_adjuntos_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id)
);

CREATE TABLE public.configuracion_sistema (
  id integer NOT NULL DEFAULT nextval('configuracion_sistema_id_seq'::regclass),
  clave character varying NOT NULL UNIQUE,
  valor text NOT NULL,
  descripcion text,
  tipo_dato character varying DEFAULT 'string'::character varying,
  categoria character varying DEFAULT 'general'::character varying,
  updated_by_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT configuracion_sistema_pkey PRIMARY KEY (id),
  CONSTRAINT configuracion_sistema_updated_by_id_fkey FOREIGN KEY (updated_by_id) REFERENCES public.usuarios(id)
);

CREATE TABLE public.estadisticas_cache (
  id integer NOT NULL DEFAULT nextval('estadisticas_cache_id_seq'::regclass),
  fecha_estadistica date NOT NULL,
  tipo_estadistica character varying NOT NULL,
  datos_json jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT estadisticas_cache_pkey PRIMARY KEY (id)
);

CREATE TABLE public.estados_solicitud (
  id integer NOT NULL DEFAULT nextval('estados_solicitud_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  orden_flujo integer NOT NULL,
  color_estado character varying DEFAULT '#6366f1'::character varying,
  es_final boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT estados_solicitud_pkey PRIMARY KEY (id)
);

CREATE TABLE public.estudiantes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  codigo character varying NOT NULL UNIQUE,
  nombres character varying NOT NULL,
  apellidos character varying NOT NULL,
  grado_id integer NOT NULL,
  activo boolean DEFAULT true,
  fecha_ingreso date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT estudiantes_pkey PRIMARY KEY (id),
  CONSTRAINT estudiantes_grado_id_fkey FOREIGN KEY (grado_id) REFERENCES public.grados(id)
);

CREATE TABLE public.grados (
  id integer NOT NULL DEFAULT nextval('grados_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  nivel character varying NOT NULL,
  orden_academico integer NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT grados_pkey PRIMARY KEY (id)
);

CREATE TABLE public.historial_estados (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  solicitud_id uuid NOT NULL,
  estado_anterior_id integer,
  estado_nuevo_id integer NOT NULL,
  usuario_id uuid,
  motivo_cambio text,
  observaciones text,
  fecha_cambio timestamp with time zone DEFAULT now(),
  CONSTRAINT historial_estados_pkey PRIMARY KEY (id),
  CONSTRAINT historial_estados_solicitud_id_fkey FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id),
  CONSTRAINT historial_estados_estado_anterior_id_fkey FOREIGN KEY (estado_anterior_id) REFERENCES public.estados_solicitud(id),
  CONSTRAINT historial_estados_estado_nuevo_id_fkey FOREIGN KEY (estado_nuevo_id) REFERENCES public.estados_solicitud(id),
  CONSTRAINT historial_estados_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

CREATE TABLE public.logs_auditoria (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tabla_afectada character varying NOT NULL,
  registro_id uuid,
  accion character varying NOT NULL,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  usuario_id uuid,
  ip_origen inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT logs_auditoria_pkey PRIMARY KEY (id),
  CONSTRAINT logs_auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

CREATE TABLE public.solicitudes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  radicado character varying NOT NULL UNIQUE,
  tipo_solicitud_id integer NOT NULL,
  estado_actual_id integer NOT NULL DEFAULT 1,
  nombre_estudiante character varying NOT NULL,
  grado_id integer NOT NULL,
  fecha_solicitud timestamp with time zone DEFAULT now(),
  motivo text NOT NULL,
  observaciones text,
  datos_formulario jsonb NOT NULL DEFAULT '{}'::jsonb,
  nombre_padre_acudiente character varying NOT NULL,
  telefono_contacto character varying,
  email_contacto character varying,
  tiene_certificado_medico boolean DEFAULT false,
  tiene_incapacidad boolean DEFAULT false,
  fecha_aprobacion timestamp with time zone,
  aprobado_por_id uuid,
  fecha_rechazo timestamp with time zone,
  rechazado_por_id uuid,
  fecha_validacion timestamp with time zone,
  validado_por_id uuid,
  ip_origen inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  acudiente_id uuid,
  CONSTRAINT solicitudes_pkey PRIMARY KEY (id),
  CONSTRAINT solicitudes_tipo_solicitud_id_fkey FOREIGN KEY (tipo_solicitud_id) REFERENCES public.tipos_solicitud(id),
  CONSTRAINT solicitudes_estado_actual_id_fkey FOREIGN KEY (estado_actual_id) REFERENCES public.estados_solicitud(id),
  CONSTRAINT solicitudes_grado_id_fkey FOREIGN KEY (grado_id) REFERENCES public.grados(id),
  CONSTRAINT solicitudes_aprobado_por_id_fkey FOREIGN KEY (aprobado_por_id) REFERENCES public.usuarios(id),
  CONSTRAINT solicitudes_rechazado_por_id_fkey FOREIGN KEY (rechazado_por_id) REFERENCES public.usuarios(id),
  CONSTRAINT solicitudes_validado_por_id_fkey FOREIGN KEY (validado_por_id) REFERENCES public.usuarios(id)
);

CREATE TABLE public.tipos_solicitud (
  id integer NOT NULL DEFAULT nextval('tipos_solicitud_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  requiere_documento boolean DEFAULT false,
  plantilla_formulario jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tipos_solicitud_pkey PRIMARY KEY (id)
);

CREATE TABLE public.tipos_usuario (
  id integer NOT NULL DEFAULT nextval('tipos_usuario_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  permisos jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tipos_usuario_pkey PRIMARY KEY (id)
);

CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  usuario character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  nombre character varying NOT NULL,
  email character varying,
  telefono character varying,
  tipo_usuario_id integer NOT NULL,
  grado_asignado character varying,
  activo boolean DEFAULT true,
  ultimo_acceso timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_tipo_usuario_id_fkey FOREIGN KEY (tipo_usuario_id) REFERENCES public.tipos_usuario(id)
);
