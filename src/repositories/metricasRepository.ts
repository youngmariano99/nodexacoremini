import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResultadoRepositorio } from "./base/tipos";

export interface MetricasPruebaSocial {
  quiebresEvitados: number;
  totalProductos: number;
  totalMovimientos: number;
  horasAhorradas: number; // quiebresEvitados * 15 / 60
}

export interface MetricaDolor {
  problemaTexto: string;
  cantidad: number;
}

export interface PowerUser {
  userId: string;
  nombre: string;
  whatsapp: string;
  rubro: string;
  movimientosCount: number;
}

export async function obtenerMetricasPruebaSocial(
  supabase: SupabaseClient
): Promise<ResultadoRepositorio<MetricasPruebaSocial>> {
  // Realizar conteos en paralelo
  const [conteoEvitados, conteoProductos, conteoMovimientos] = await Promise.all([
    supabase.from("registro_alertas_evitadas").select("id", { count: "exact", head: true }),
    supabase.from("productos").select("id", { count: "exact", head: true }),
    supabase.from("movimientos_stock").select("id", { count: "exact", head: true }),
  ]);

  if (conteoEvitados.error || conteoProductos.error || conteoMovimientos.error) {
    return { ok: false, error: "Error consultando estadísticas de prueba social" };
  }

  const quiebresEvitados = conteoEvitados.count || 0;
  const totalProductos = conteoProductos.count || 0;
  const totalMovimientos = conteoMovimientos.count || 0;
  
  // Cálculo de tiempo ahorrado: Cada quiebre de stock evitado o movimiento de agrupación ahorra 15 mins (0.25 horas)
  const horasAhorradas = Number((quiebresEvitados * 0.25).toFixed(2));

  return {
    ok: true,
    data: {
      quiebresEvitados,
      totalProductos,
      totalMovimientos,
      horasAhorradas,
    },
  };
}

export async function obtenerMapaDeDolores(
  supabase: SupabaseClient
): Promise<ResultadoRepositorio<MetricaDolor[]>> {
  // Hacemos una agregación para contar problemas elegidos
  const { data, error } = await supabase
    .from("perfiles_onboarding")
    .select(`
      problema_stock_id,
      problema_stock_otro,
      problemas_onboarding_opciones ( texto )
    `);

  if (error) {
    return { ok: false, error: error.message };
  }

  const agrupacion: Record<string, number> = {};

  data?.forEach(perfil => {
    // Si tiene opción preestablecida
    if (perfil.problemas_onboarding_opciones) {
      const texto = (perfil.problemas_onboarding_opciones as any).texto;
      agrupacion[texto] = (agrupacion[texto] || 0) + 1;
    } else if (perfil.problema_stock_otro) {
      // Si escribió otra cosa
      const texto = "Otros: " + (perfil.problema_stock_otro.length > 30 
        ? perfil.problema_stock_otro.substring(0, 30) + "..." 
        : perfil.problema_stock_otro);
      agrupacion[texto] = (agrupacion[texto] || 0) + 1;
    } else {
      agrupacion["Sin especificar"] = (agrupacion["Sin especificar"] || 0) + 1;
    }
  });

  const result: MetricaDolor[] = Object.entries(agrupacion).map(([problemaTexto, cantidad]) => ({
    problemaTexto,
    cantidad,
  })).sort((a, b) => b.cantidad - a.cantidad);

  return { ok: true, data: result };
}

export async function obtenerPowerUsers(
  supabase: SupabaseClient
): Promise<ResultadoRepositorio<PowerUser[]>> {
  // 1. Obtener la cantidad de movimientos agrupados por user_id
  const { data: conteoMovimientos, error: errorMov } = await supabase
    .rpc("obtener_conteos_movimientos_usuarios"); // Utilizaremos una RPC para agrupar de manera ultra-eficiente

  if (errorMov) {
    // Fallback si la RPC no existe aún: consultar perfiles y movimientos (simulación simple en código para no fallar)
    // Pero implementaremos la RPC en el SQL para garantizar escalabilidad.
    return obtenerPowerUsersFallback(supabase);
  }

  return { ok: true, data: conteoMovimientos || [] };
}

async function obtenerPowerUsersFallback(supabase: SupabaseClient): Promise<ResultadoRepositorio<PowerUser[]>> {
  // Query simple a perfiles
  const { data: perfiles, error: errPerf } = await supabase
    .from("perfiles_onboarding")
    .select("id, nombre, whatsapp, rubro");

  if (errPerf) {
    return { ok: false, error: errPerf.message };
  }

  // Query conteo de movimientos grupal
  const { data: movimientos, error: errMov } = await supabase
    .from("movimientos_stock")
    .select("user_id");

  if (errMov) {
    return { ok: false, error: errMov.message };
  }

  const counts: Record<string, number> = {};
  movimientos?.forEach(m => {
    counts[m.user_id] = (counts[m.user_id] || 0) + 1;
  });

  const users: PowerUser[] = perfiles?.map(p => ({
    userId: p.id,
    nombre: p.nombre,
    whatsapp: p.whatsapp,
    rubro: p.rubro,
    movimientosCount: counts[p.id] || 0,
  }))
  .sort((a, b) => b.movimientosCount - a.movimientosCount)
  .slice(0, 10) || [];

  return { ok: true, data: users };
}
