import { z } from "zod";

// Validación de Registro rápido / Onboarding
export const onboardingSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "Nombre demasiado largo"),
  email: z.string().email("Debe ser un correo electrónico válido").max(150),
  whatsapp: z.string().min(8, "Ingresá un número de WhatsApp válido").max(30),
  rubro: z.string().min(2, "El rubro debe tener al menos 2 caracteres").max(100),
  problema_stock_id: z.string().uuid().nullable().optional(),
  problema_stock_otro: z.string().max(500, "El texto es demasiado largo").nullable().optional(),
}).refine(data => {
  // Si no hay problema_stock_id (es decir, eligió "Otro"), problema_stock_otro es requerido
  if (!data.problema_stock_id && !data.problema_stock_otro?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Por favor describí tu problema si elegiste 'Otro'",
  path: ["problema_stock_otro"],
});

// Validación de Proveedor
export const proveedorSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(150),
  dias_demora: z.number().int().min(0, "Los días de demora no pueden ser negativos"),
});

// Validación de Producto
export const productoSchema = z.object({
  nombre: z.string().min(2, "El nombre del producto debe tener al menos 2 caracteres").max(200),
  stock_actual: z.number().min(0, "El stock actual no puede ser negativo"),
  stock_minimo: z.number().min(0, "El stock de seguridad mínimo no puede ser negativo"),
  consumo_diario: z.number().min(0, "El consumo diario estimado no puede ser negativo"),
  proveedor_id: z.string().uuid("Debes seleccionar un proveedor válido"),
});

// Validación de Movimiento de Stock Rápido
export const movimientoStockSchema = z.object({
  producto_id: z.string().uuid(),
  tipo: z.enum(["entrada", "salida"]),
  cantidad: z.number().positive("La cantidad debe ser mayor a cero"),
});
