import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResultadoRepositorio } from "./base/tipos";

export interface FilaProductoCalculado {
  producto_id: string;
  user_id: string;
  producto_nombre: string;
  stock_actual: number;
  stock_minimo: number;
  consumo_diario: number;
  proveedor_id: string;
  proveedor_nombre: string;
  dias_demora: number;
  punto_pedido: number;
  estado: "normal" | "alerta" | "critico";
}

export interface DatosNuevoProducto {
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  consumo_diario: number;
  proveedor_id: string;
}

export async function obtenerProductosCalculados(
  supabase: SupabaseClient
): Promise<ResultadoRepositorio<FilaProductoCalculado[]>> {
  const { data, error } = await supabase
    .from("vista_productos_puntos_pedido")
    .select("*")
    .order("producto_nombre", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: data as FilaProductoCalculado[] || [] };
}

export async function crearProducto(
  supabase: SupabaseClient,
  userId: string,
  datos: DatosNuevoProducto
): Promise<ResultadoRepositorio<void>> {
  const { error } = await supabase
    .from("productos")
    .insert({
      user_id: userId,
      nombre: datos.nombre,
      stock_actual: datos.stock_actual,
      stock_minimo: datos.stock_minimo,
      consumo_diario: datos.consumo_diario,
      proveedor_id: datos.proveedor_id,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}

export async function actualizarProducto(
  supabase: SupabaseClient,
  id: string,
  datos: Omit<DatosNuevoProducto, "stock_actual"> // El stock actual se actualiza a través de movimientos de stock rápidos
): Promise<ResultadoRepositorio<void>> {
  const { error } = await supabase
    .from("productos")
    .update({
      nombre: datos.nombre,
      stock_minimo: datos.stock_minimo,
      consumo_diario: datos.consumo_diario,
      proveedor_id: datos.proveedor_id,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}

export async function eliminarProducto(
  supabase: SupabaseClient,
  id: string
): Promise<ResultadoRepositorio<void>> {
  const { error } = await supabase
    .from("productos")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}

export async function registrarMovimientoStock(
  supabase: SupabaseClient,
  userId: string,
  datos: { producto_id: string; tipo: "entrada" | "salida"; cantidad: number }
): Promise<ResultadoRepositorio<void>> {
  // Nota: El trigger de la base de datos (detectar_quiebre_evitado) actualizará automáticamente
  // el stock actual en la tabla productos y registrará si se evitó un quiebre.
  const { error } = await supabase
    .from("movimientos_stock")
    .insert({
      user_id: userId,
      producto_id: datos.producto_id,
      tipo: datos.tipo,
      cantidad: datos.cantidad,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}
