"use server";

import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validaciones";
import { registrarPerfilOnboarding } from "@/repositories/onboardingRepository";

export async function registrarOnboardingAction(formData: {
  nombre: string;
  email: string;
  whatsapp: string;
  rubro: string;
  problema_stock_id?: string | null;
  problema_stock_otro?: string | null;
}) {
  try {
    // Validar con Zod
    const validado = onboardingSchema.parse(formData);

    const supabase = await crearClienteSupabaseServidor();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Usuario no autenticado" };
    }

    const resultado = await registrarPerfilOnboarding(supabase, user.id, {
      nombre: validado.nombre,
      email: validado.email,
      whatsapp: validado.whatsapp,
      rubro: validado.rubro,
      problema_stock_id: validado.problema_stock_id,
      problema_stock_otro: validado.problema_stock_otro,
    });

    return resultado;
  } catch (error: any) {
    if (error.errors) {
      return { ok: false, error: error.errors[0]?.message || "Datos inválidos" };
    }
    return { ok: false, error: error.message || "Error al guardar el perfil" };
  }
}
