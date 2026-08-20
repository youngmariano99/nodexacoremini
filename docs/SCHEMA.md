# Esquema Físico de Base de Datos - Mini Sistema PLG

Este documento describe la estructura relacional, índices y triggers del Mini-Sistema de cálculo de **Punto de Pedido**.

---

## 1. Modelo de Entidades y Relaciones

El sistema almacena datos relativos al onboarding, proveedores, productos de inventario y movimientos transaccionales para calcular la prueba social en tiempo real.

```
+------------------------------+
| problemas_onboarding_opcion |
+------------------------------+
| id (UUID, PK)                |
| texto (TEXT, UNIQUE)         |
| activo (BOOLEAN)             |
+------------------------------+
               | 1
               |
               | 0..*
+------------------------------+
| perfiles_onboarding          |
+------------------------------+
| id (UUID, PK -> auth.users)  |
| nombre (VARCHAR)             |
| email (VARCHAR, UNIQUE)      |
| whatsapp (VARCHAR)           |
| rubro (VARCHAR)              |
| problema_stock_id (FK)       |
| problema_stock_otro (TEXT)   |
+------------------------------+

+------------------------------+
| proveedores                  |
+------------------------------+
| id (UUID, PK)                |
| user_id (UUID, FK)           |
| nombre (VARCHAR)             |
| dias_demora (INTEGER)        |
+------------------------------+
               | 1
               |
               | 0..*
+------------------------------+
| productos                    |
+------------------------------+
| id (UUID, PK)                |
| user_id (UUID, FK)           |
| proveedor_id (FK)            |
| nombre (VARCHAR)             |
| stock_actual (NUMERIC)       |
| stock_minimo (NUMERIC)       |
| consumo_diario (NUMERIC)     |
+------------------------------+
        | 1            | 1
        |              |
        | 0..*         | 0..*
+--------------------+ +------------------------------+
| movimientos_stock  | | registro_alertas_evitadas    |
+--------------------+ +------------------------------+
| id (UUID, PK)      | | id (UUID, PK)                |
| user_id (UUID)     | | user_id (UUID)               |
| producto_id (FK)   | | producto_id (FK)             |
| tipo (entrada/sal) | | creado_en (TIMESTAMPTZ)      |
| cantidad (NUMERIC) | +------------------------------+
+--------------------+
```

---

## 2. Vista Calculada: `vista_productos_puntos_pedido`

Para unificar la lógica de negocio y evitar duplicidad en frontend/backend, el **Punto de Pedido (PdP)** y el **Estado Visual** son calculados dinámicamente mediante una vista PostgreSQL:

Fórmula:
$$\text{punto\_pedido} = \text{stock\_minimo} + (\text{consumo\_diario} \times \text{dias\_demora})$$

```sql
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
    (p.stock_minimo + (p.consumo_diario * prov.dias_demora))::NUMERIC(12, 2) AS punto_pedido,
    CASE 
        WHEN p.stock_actual <= p.stock_minimo THEN 'critico'
        WHEN p.stock_actual <= (p.stock_minimo + (p.consumo_diario * prov.dias_demora)) THEN 'alerta'
        ELSE 'normal'
    END AS estado
FROM 
    public.productos p
JOIN 
    public.proveedores prov ON p.proveedor_id = prov.id;
```

---

## 3. Automatización de Quiebres Evitados (Trigger PLG)

El trigger `trg_movimiento_stock_insercion` evalúa las inserciones en `movimientos_stock`:
* Si el `tipo` es `'entrada'`.
* Si el stock anterior del producto era menor o igual al **PdP** (Estado Amarillo de Alerta) y mayor que el **Stock Mínimo**.
* Si el nuevo stock (stock anterior + cantidad entrada) supera el **PdP** (retorna a Estado Verde Normal).
* En ese caso, inserta un registro de auditoría en `registro_alertas_evitadas` que alimenta la métrica de tiempo ahorrado y quiebres prevenidos.
* Además, actualiza automáticamente el valor de `stock_actual` en la tabla `productos`.
