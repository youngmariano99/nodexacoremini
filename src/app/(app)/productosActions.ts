"use server";

import { revalidatePath } from "next/cache";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { productoSchema, movimientoStockSchema } from "@/lib/validaciones";
import { crearProducto, actualizarProducto, eliminarProducto, registrarMovimientoStock } from "@/repositories/productosRepository";

export async function crearProductoAction(formData: {
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  consumo_diario: number;
  proveedor_id: string;
}) {
  try {
    const validado = productoSchema.parse(formData);
    const supabase = await crearClienteSupabaseServidor();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "No autenticado" };

    const resultado = await crearProducto(supabase, user.id, validado);
    if (resultado.ok) {
      revalidatePath("/");
    }
    return resultado;
  } catch (error: any) {
    if (error.errors) return { ok: false, error: error.errors[0]?.message || "Datos inválidos" };
    return { ok: false, error: error.message || "Error al procesar" };
  }
}

export async function actualizarProductoAction(
  id: string,
  formData: {
    nombre: string;
    stock_minimo: number;
    consumo_diario: number;
    proveedor_id: string;
  }
) {
  try {
    // Para actualización, no enviamos stock_actual (se valida por separado en Zod)
    const validado = productoSchema.omit({ stock_actual: true }).parse(formData);
    const supabase = await crearClienteSupabaseServidor();

    const resultado = await actualizarProducto(supabase, id, {
      ...validado,
      stock_actual: 0, // Dummie stock_actual requerido por tipo de repositorio pero no actualizado
    });
    if (resultado.ok) {
      revalidatePath("/");
    }
    return resultado;
  } catch (error: any) {
    if (error.errors) return { ok: false, error: error.errors[0]?.message || "Datos inválidos" };
    return { ok: false, error: error.message || "Error al procesar" };
  }
}

export async function eliminarProductoAction(id: string) {
  try {
    const supabase = await crearClienteSupabaseServidor();
    const resultado = await eliminarProducto(supabase, id);
    if (resultado.ok) {
      revalidatePath("/");
    }
    return resultado;
  } catch (error: any) {
    return { ok: false, error: error.message || "Error al procesar" };
  }
}

export async function registrarMovimientoStockAction(formData: {
  producto_id: string;
  tipo: "entrada" | "salida";
  cantidad: number;
}) {
  try {
    const validado = movimientoStockSchema.parse(formData);
    const supabase = await crearClienteSupabaseServidor();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "No autenticado" };

    const resultado = await registrarMovimientoStock(supabase, user.id, validado);
    if (resultado.ok) {
      revalidatePath("/");
      revalidatePath("/dashboard"); // Actualizar las métricas PLG de quiebres evitados
    }
    return resultado;
  } catch (error: any) {
    if (error.errors) return { ok: false, error: error.errors[0]?.message || "Datos inválidos" };
    return { ok: false, error: error.message || "Error al procesar" };
  }
}
