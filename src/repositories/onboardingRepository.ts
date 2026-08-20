import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResultadoRepositorio } from "./base/tipos";

export interface OpcionOnboarding {
  id: string;
  texto: string;
}

export interface RegistroOnboarding {
  nombre: string;
  email: string;
  whatsapp: string;
  rubro: string;
  problema_stock_id?: string | null;
  problema_stock_otro?: string | null;
}

export async function obtenerOpcionesOnboarding(
  supabase: SupabaseClient
): Promise<ResultadoRepositorio<OpcionOnboarding[]>> {
  const { data, error } = await supabase
    .from("problemas_onboarding_opciones")
    .select("id, texto")
    .eq("activo", true);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: data || [] };
}

export async function verificarPerfilOnboardingCompletado(
  supabase: SupabaseClient,
  userId: string
): Promise<ResultadoRepositorio<boolean>> {
  const { data, error } = await supabase
    .from("perfiles_onboarding")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: !!data };
}

export async function registrarPerfilOnboarding(
  supabase: SupabaseClient,
  userId: string,
  registro: RegistroOnboarding
): Promise<ResultadoRepositorio<void>> {
  const { error } = await supabase
    .from("perfiles_onboarding")
    .insert({
      id: userId,
      nombre: registro.nombre,
      email: registro.email,
      whatsapp: registro.whatsapp,
      rubro: registro.rubro,
      problema_stock_id: registro.problema_stock_id || null,
      problema_stock_otro: registro.problema_stock_otro || null,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: undefined };
}
