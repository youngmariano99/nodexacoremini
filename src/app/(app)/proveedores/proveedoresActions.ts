"use server";

import { revalidatePath } from "next/cache";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { proveedorSchema } from "@/lib/validaciones";
import { crearProveedor, actualizarProveedor, eliminarProveedor, Proveedor } from "@/repositories/proveedoresRepository";
import type { ResultadoRepositorio } from "@/repositories/base/tipos";

export async function crearProveedorAction(formData: {
  nombre: string;
  dias_demora: number;
}): Promise<ResultadoRepositorio<Proveedor>> {
  try {
    const validado = proveedorSchema.parse(formData);
    const supabase = await crearClienteSupabaseServidor();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "No autenticado" };

    return await crearProveedor(supabase, user.id, validado);
  } catch (error: any) {
    if (error.errors) return { ok: false, error: error.errors[0]?.message || "Datos inválidos" };
    return { ok: false, error: error.message || "Error al procesar" };
  }
}

export async function actualizarProveedorAction(
  id: string,
  formData: { nombre: string; dias_demora: number }
): Promise<ResultadoRepositorio<Proveedor>> {
  try {
    const validado = proveedorSchema.parse(formData);
    const supabase = await crearClienteSupabaseServidor();

    const resultado = await actualizarProveedor(supabase, id, validado);
    if (resultado.ok) {
      revalidatePath("/proveedores");
      revalidatePath("/");
    }
    return resultado;
  } catch (error: any) {
    if (error.errors) return { ok: false, error: error.errors[0]?.message || "Datos inválidos" };
    return { ok: false, error: error.message || "Error al procesar" };
  }
}

export async function eliminarProveedorAction(id: string): Promise<ResultadoRepositorio<void>> {
  try {
    const supabase = await crearClienteSupabaseServidor();
    const resultado = await eliminarProveedor(supabase, id);
    if (resultado.ok) {
      revalidatePath("/proveedores");
      revalidatePath("/");
    }
    return resultado;
  } catch (error: any) {
    return { ok: false, error: error.message || "Error al procesar" };
  }
}
