-- ====================================================================
-- SCRIPT SQL PARA CREAR LAS TABLAS DEL GRUPO DE CRECIMIENTO
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase
-- ====================================================================

-- 1. Tabla de Personas (asistentes al GC)
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  edad INTEGER,
  categoria TEXT, -- Jóvenes, Mujeres, Adultos
  primera_vez BOOLEAN DEFAULT true,
  veces INTEGER DEFAULT 0,
  contenida BOOLEAN DEFAULT false,
  primera_visita DATE,
  cumple DATE,
  encuentro BOOLEAN DEFAULT false,
  bautismo BOOLEAN DEFAULT false,
  discipulado BOOLEAN DEFAULT false,
  escuela BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Eventos (evangelizaciones, ágapes, caminatas de oración, etc.)
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT, -- Evangelización, Ágape, Caminata de Oración, etc.
  fecha DATE NOT NULL,
  hora TIME,
  lugar TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla de Reuniones (organización de roles del GC)
CREATE TABLE IF NOT EXISTS reuniones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tema TEXT,
  bienvenida TEXT,
  ora_bienvenida TEXT,
  sillas_vacias TEXT,
  palabra TEXT,
  ora_alabanza TEXT,
  ora_palabra TEXT,
  ora_misiones TEXT,
  ora_ofrenda TEXT,
  ora_necesidades TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- Esto asegura que cada líder o usuario de la app vea solo sus datos.
-- ====================================================================

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reuniones ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla "personas"
CREATE POLICY "Permitir CRUD completo a dueños" ON personas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para la tabla "eventos"
CREATE POLICY "Permitir CRUD completo a dueños" ON eventos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para la tabla "reuniones"
CREATE POLICY "Permitir CRUD completo a dueños" ON reuniones
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
