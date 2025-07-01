-- Tabla para registrar datos de acudientes
CREATE TABLE IF NOT EXISTS public.acudientes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo text NOT NULL,
    email text,
    telefono text,
    perfil_relacion text,
    documento_identidad text,
    created_at timestamp with time zone DEFAULT now()
);

-- Relacion opcional con la tabla de solicitudes
ALTER TABLE public.solicitudes
    ADD COLUMN IF NOT EXISTS acudiente_id uuid REFERENCES public.acudientes(id);
