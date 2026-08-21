"use server";

import { revalidatePath } from "next/cache";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { productoSchema, movimientoStockSchema } from "@/lib/validaciones";
import { crearProducto, actualizarProducto, eliminarProducto } from "@/repositories/productosRepository";

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

    // Validar límite operativo de 100 SKUs activos en plan gratuito
    const { count, error: countError } = await supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) throw countError;
    if (count !== null && count >= 100) {
      return { ok: false, error: "Límite operativo alcanzado: El plan gratuito tiene un límite máximo de 100 productos (SKUs). Para gestionar hasta 1.000 SKUs con carga masiva, migrá a Nodexa Core." };
    }

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
    const validado = productoSchema.omit({ stock_actual: true }).parse(formData);
    const supabase = await crearClienteSupabaseServidor();

    // Reemplazar: pasamos directamente 'validado' sin stock_actual
    const resultado = await actualizarProducto(supabase, id, validado);
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

// Nueva Acción para registrar movimientos transaccionales específicos con Proveedor
export async function registrarMovimientoStockAction(formData: {
  producto_id: string;
  tipo: "entrada" | "salida";
  cantidad: number;
  proveedor_id?: string | null;
}) {
  try {
    const supabase = await crearClienteSupabaseServidor();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "No autenticado" };

    // Registramos en base de datos incluyendo el proveedor de origen/destino
    const { error } = await supabase
      .from("movimientos_stock")
      .insert({
        user_id: user.id,
        producto_id: formData.producto_id,
        tipo: formData.tipo,
        cantidad: formData.cantidad,
        proveedor_id: formData.proveedor_id || null,
      });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error: any) {
    return { ok: false, error: error.message || "Error al procesar" };
  }
}
