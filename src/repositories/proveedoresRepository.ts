import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResultadoRepositorio } from "./base/tipos";

export interface Proveedor {
  id: string;
  nombre: string;
  dias_demora: number;
  creado_en: string;
}

export async function obtenerProveedores(
  supabase: SupabaseClient
): Promise<ResultadoRepositorio<Proveedor[]>> {
  const { data, error } = await supabase
    .from("proveedores")
    .select("id, nombre, dias_demora, creado_en")
    .order("nombre", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: data || [] };
}

export async function crearProveedor(
  supabase: SupabaseClient,
  userId: string,
  datos: { nombre: string; dias_demora: number }
): Promise<ResultadoRepositorio<Proveedor>> {
  const { data, error } = await supabase
    .from("proveedores")
    .insert({
      user_id: userId,
      nombre: datos.nombre,
      dias_demora: datos.dias_demora,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function actualizarProveedor(
  supabase: SupabaseClient,
  id: string,
  datos: { nombre: string; dias_demora: number }
): Promise<ResultadoRepositorio<Proveedor>> {
  const { data, error } = await supabase
    .from("proveedores")
    .update({
      nombre: datos.nombre,
      dias_demora: datos.dias_demora,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data };
}

export async function eliminarProveedor(
  supabase: SupabaseClient,
  id: string
): Promise<ResultadoRepositorio<void>> {
  const { error } = await supabase
    .from("proveedores")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}
