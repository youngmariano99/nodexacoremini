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
  consumo_estimado?: number;
  ultima_estimacion?: string;
  es_autocalculado?: boolean;
}

export interface DatosNuevoProducto {
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  consumo_diario: number;
  proveedor_id: string;
}

export async function obtenerProductosCalculados(
  supabase: SupabaseClient,
  userId: string
): Promise<ResultadoRepositorio<FilaProductoCalculado[]>> {
  const { data: productos, error } = await supabase
    .from("vista_productos_puntos_pedido")
    .select("*")
    .eq("user_id", userId)
    .order("producto_nombre", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!productos || productos.length === 0) {
    return { ok: true, data: [] };
  }

  // Obtener salidas de stock en los últimos 30 días para automatizar consumo_diario
  const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: movimientos } = await supabase
    .from("movimientos_stock")
    .select("producto_id, tipo, cantidad, creado_en")
    .eq("tipo", "salida")
    .gte("creado_en", fechaLimite);

  // Mapear consumo estimado
  const productosMapeados = productos.map((p: any) => {
    const movsDelProducto = movimientos?.filter((m: any) => m.producto_id === p.producto_id) || [];
    const totalSalidas = movsDelProducto.reduce((sum: number, m: any) => sum + Number(m.cantidad), 0);
    
    // Si hay salidas de stock registradas, promediar sobre 30 días
    const tieneMovimientos = movsDelProducto.length > 0;
    const consumoEstimado = tieneMovimientos ? Number((totalSalidas / 30).toFixed(2)) : p.consumo_diario;
    
    // Recalcular Punto de Pedido y Estado en memoria basado en el consumo estimado/autocalculado
    const puntoPedido = Number((p.stock_minimo + (consumoEstimado * p.dias_demora)).toFixed(2));
    let estado: "normal" | "alerta" | "critico" = "normal";
    if (p.stock_actual <= p.stock_minimo) {
      estado = "critico";
    } else if (p.stock_actual <= puntoPedido) {
      estado = "alerta";
    }

    const timestampEstimacion = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fechaEstimacion = new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit' });

    return {
      ...p,
      consumo_diario: consumoEstimado,
      punto_pedido: puntoPedido,
      estado,
      consumo_estimado: consumoEstimado,
      ultima_estimacion: `${fechaEstimacion} ${timestampEstimacion}`,
      es_autocalculado: tieneMovimientos,
    } as FilaProductoCalculado;
  });

  return { ok: true, data: productosMapeados };
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
