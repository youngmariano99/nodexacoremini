-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE OPCIONES DE ONBOARDING
CREATE TABLE IF NOT EXISTS public.problemas_onboarding_opciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    texto TEXT NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en opciones de onboarding (Lectura pública, escritura de admin)
ALTER TABLE public.problemas_onboarding_opciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública de opciones activas" 
    ON public.problemas_onboarding_opciones FOR SELECT 
    USING (activo = true);

-- 2. TABLA DE PERFILES DE ONBOARDING
CREATE TABLE IF NOT EXISTS public.perfiles_onboarding (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    whatsapp VARCHAR(30) NOT NULL,
    rubro VARCHAR(100) NOT NULL,
    problema_stock_id UUID REFERENCES public.problemas_onboarding_opciones(id) ON DELETE SET NULL,
    problema_stock_otro TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.perfiles_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden leer su propio perfil onboarding" 
    ON public.perfiles_onboarding FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil onboarding" 
    ON public.perfiles_onboarding FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil onboarding" 
    ON public.perfiles_onboarding FOR UPDATE 
    USING (auth.uid() = id);

-- 3. TABLA DE PROVEEDORES
CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    dias_demora INTEGER NOT NULL CHECK (dias_demora >= 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proveedores_user ON public.proveedores(user_id);

ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aislamiento de proveedores por usuario" 
    ON public.proveedores FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE RESTRICT,
    nombre VARCHAR(200) NOT NULL,
    stock_actual NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (stock_actual >= 0),
    stock_minimo NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (stock_minimo >= 0),
    consumo_diario NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (consumo_diario >= 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_user ON public.productos(user_id);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON public.productos(proveedor_id);

ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aislamiento de productos por usuario" 
    ON public.productos FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. TABLA DE MOVIMIENTOS DE STOCK
CREATE TABLE IF NOT EXISTS public.movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    cantidad NUMERIC(12, 2) NOT NULL CHECK (cantidad > 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_user_fecha ON public.movimientos_stock(user_id, creado_en DESC);

ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aislamiento de movimientos por usuario" 
    ON public.movimientos_stock FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. REGISTRO DE ALERTAS EVITADAS (Métrica PLG)
CREATE TABLE IF NOT EXISTS public.registro_alertas_evitadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alertas_evitadas_user ON public.registro_alertas_evitadas(user_id);

ALTER TABLE public.registro_alertas_evitadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aislamiento de alertas evitadas por usuario" 
    ON public.registro_alertas_evitadas FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. VISTA PARA CÁLCULO DE PUNTO DE PEDIDO Y ESTADOS VISUALES
CREATE OR REPLACE VIEW public.vista_productos_puntos_pedido AS
SELECT 
    p.id AS producto_id,
    p.user_id,
    p.nombre AS producto_nombre,
    p.stock_actual,
    p.stock_minimo,
    p.consumo_diario,
    prov.id AS proveedor_id,
    prov.nombre AS proveedor_nombre,
    prov.dias_demora,
    -- FÓRMULA DE CÁLCULO: Stock Mínimo + (Consumo Diario * Días de Demora)
    (p.stock_minimo + (p.consumo_diario * prov.dias_demora))::NUMERIC(12, 2) AS punto_pedido,
    -- ASIGNACIÓN DE ESTADO VISUAL
    CASE 
        WHEN p.stock_actual <= p.stock_minimo THEN 'critico'
        WHEN p.stock_actual <= (p.stock_minimo + (p.consumo_diario * prov.dias_demora)) THEN 'alerta'
        ELSE 'normal'
    END AS estado
FROM 
    public.productos p
JOIN 
    public.proveedores prov ON p.proveedor_id = prov.id;

-- 8. TRIGGER DE DETECCIÓN DE QUIEBRE DE STOCK EVITADO Y ACTUALIZACIÓN DE STOCK
CREATE OR REPLACE FUNCTION public.detectar_quiebre_evitado()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_anterior NUMERIC(12, 2);
    v_stock_nuevo NUMERIC(12, 2);
    v_stock_minimo NUMERIC(12, 2);
    v_punto_pedido NUMERIC(12, 2);
    v_dias_demora INTEGER;
    v_consumo_diario NUMERIC(12, 2);
    v_user_id UUID;
BEGIN
    -- Solo nos interesan las entradas de stock
    IF NEW.tipo <> 'entrada' THEN
        -- Si es salida, restamos y salimos
        UPDATE public.productos
        SET stock_actual = GREATEST(0, stock_actual - NEW.cantidad),
            actualizado_en = now()
        WHERE id = NEW.producto_id;
        RETURN NEW;
    END IF;

    -- Obtener datos del producto y su proveedor asociado antes de aplicar el movimiento
    SELECT 
        p.user_id, p.stock_actual, p.stock_minimo, p.consumo_diario, prov.dias_demora
    INTO 
        v_user_id, v_stock_anterior, v_stock_minimo, v_consumo_diario, v_dias_demora
    FROM 
        public.productos p
    JOIN 
        public.proveedores prov ON p.proveedor_id = prov.id
    WHERE 
        p.id = NEW.producto_id;

    -- Calcular el punto de pedido
    v_punto_pedido := v_stock_minimo + (v_consumo_diario * v_dias_demora);

    -- Determinar nuevo stock simulado tras el movimiento
    v_stock_nuevo := v_stock_anterior + NEW.cantidad;

    -- Condición de Quiebre Evitado:
    -- Estaba en estado de Alerta (<= PdP pero mayor que Stock Mínimo)
    -- Y ahora supera el PdP (Estado Normal)
    IF v_stock_anterior <= v_punto_pedido 
       AND v_stock_anterior > v_stock_minimo 
       AND v_stock_nuevo > v_punto_pedido 
    THEN
        INSERT INTO public.registro_alertas_evitadas (user_id, producto_id)
        VALUES (v_user_id, NEW.producto_id);
    END IF;

    -- Actualizar el stock_actual en la tabla de productos (operación principal)
    UPDATE public.productos
    SET stock_actual = stock_actual + NEW.cantidad,
        actualizado_en = now()
    WHERE id = NEW.producto_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger si ya existe para evitar errores en reinicios
DROP TRIGGER IF EXISTS trg_movimiento_stock_insercion ON public.movimientos_stock;

CREATE TRIGGER trg_movimiento_stock_insercion
BEFORE INSERT ON public.movimientos_stock
FOR EACH ROW
EXECUTE FUNCTION public.detectar_quiebre_evitado();

-- 9. SEMILLAS (OPCIONES PRE-ESTABLECIDAS DE DOLOR DE STOCK)
INSERT INTO public.problemas_onboarding_opciones (texto) VALUES
('Me quedo sin mercadería seguido y pierdo ventas'),
('Tengo demasiado capital inmovilizado en stock que no rota'),
('Me toma mucho tiempo calcular qué comprarle a mis proveedores'),
('Tengo diferencias constantes entre lo que dice el sistema y lo real')
ON CONFLICT (texto) DO NOTHING;

-- 10. RPC PARA POWER USERS (MÉTRICAS DE CUALIFICACIÓN)
CREATE OR REPLACE FUNCTION public.obtener_conteos_movimientos_usuarios()
RETURNS TABLE (
    userId UUID,
    nombre VARCHAR,
    whatsapp VARCHAR,
    rubro VARCHAR,
    movimientosCount BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS userId,
        p.nombre,
        p.whatsapp,
        p.rubro,
        COUNT(m.id) AS movimientosCount
    FROM 
        public.perfiles_onboarding p
    LEFT JOIN 
        public.movimientos_stock m ON p.id = m.user_id
    GROUP BY 
        p.id, p.nombre, p.whatsapp, p.rubro
    ORDER BY 
        movimientosCount DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

