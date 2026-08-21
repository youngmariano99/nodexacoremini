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

export interface UsuarioTrazabilidad {
  userId: string;
  nombre: string;
  email: string;
  whatsapp: string;
  rubro: string;
  creadoEn: string;
  productosCount: number;
  proveedoresCount: number;
  movimientosCount: number;
  lastSignInAt: string | null;
}

export interface MovimientoTrazabilidad {
  id: string;
  userId: string;
  userNombre: string;
  userEmail: string;
  productoNombre: string;
  tipo: "entrada" | "salida";
  cantidad: number;
  creadoEn: string;
}

export async function obtenerTrazabilidadUsuarios(
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient | null
): Promise<ResultadoRepositorio<UsuarioTrazabilidad[]>> {
  try {
    // 1. Obtener todos los perfiles de onboarding
    const { data: perfiles, error: errPerfiles } = await supabase
      .from("perfiles_onboarding")
      .select("id, nombre, email, whatsapp, rubro, creado_en")
      .order("creado_en", { ascending: false });

    if (errPerfiles) {
      return { ok: false, error: errPerfiles.message };
    }

    // 2. Obtener conteo de productos, proveedores y movimientos en paralelo
    const [productosRes, proveedoresRes, movimientosRes] = await Promise.all([
      supabase.from("productos").select("id, user_id"),
      supabase.from("proveedores").select("id, user_id"),
      supabase.from("movimientos_stock").select("id, user_id"),
    ]);

    const prodCounts: Record<string, number> = {};
    const provCounts: Record<string, number> = {};
    const movCounts: Record<string, number> = {};

    productosRes.data?.forEach((p) => {
      prodCounts[p.user_id] = (prodCounts[p.user_id] || 0) + 1;
    });
    proveedoresRes.data?.forEach((p) => {
      provCounts[p.user_id] = (provCounts[p.user_id] || 0) + 1;
    });
    movimientosRes.data?.forEach((m) => {
      movCounts[m.user_id] = (movCounts[m.user_id] || 0) + 1;
    });

    // 3. Consultar última conexión de auth.users si el cliente admin está disponible
    const lastSignInMap: Record<string, string | null> = {};
    if (supabaseAdmin) {
      try {
        const { data, error: errAdmin } = await supabaseAdmin.auth.admin.listUsers();
        if (!errAdmin && data?.users) {
          data.users.forEach((u) => {
            lastSignInMap[u.id] = u.last_sign_in_at || null;
          });
        }
      } catch (e) {
        console.error("Error al obtener listUsers de admin: ", e);
      }
    }

    const dataTrazabilidad: UsuarioTrazabilidad[] = (perfiles || []).map((p) => ({
      userId: p.id,
      nombre: p.nombre,
      email: p.email,
      whatsapp: p.whatsapp,
      rubro: p.rubro,
      creadoEn: p.creado_en,
      productosCount: prodCounts[p.id] || 0,
      proveedoresCount: provCounts[p.id] || 0,
      movimientosCount: movCounts[p.id] || 0,
      lastSignInAt: lastSignInMap[p.id] || null,
    }));

    return { ok: true, data: dataTrazabilidad };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error al obtener trazabilidad de usuarios" };
  }
}

export async function obtenerHistorialMovimientosTrazabilidad(
  supabase: SupabaseClient
): Promise<ResultadoRepositorio<MovimientoTrazabilidad[]>> {
  try {
    // 1. Obtener movimientos ordenados por fecha descendente
    const { data: movimientos, error: errMov } = await supabase
      .from("movimientos_stock")
      .select("id, user_id, producto_id, tipo, cantidad, creado_en")
      .order("creado_en", { ascending: false });

    if (errMov) {
      return { ok: false, error: errMov.message };
    }

    // 2. Obtener productos y perfiles para cruzar en memoria
    const [productosRes, perfilesRes] = await Promise.all([
      supabase.from("productos").select("id, nombre"),
      supabase.from("perfiles_onboarding").select("id, nombre, email"),
    ]);

    const prodMap: Record<string, string> = {};
    productosRes.data?.forEach((p) => {
      prodMap[p.id] = p.nombre;
    });

    const perfMap: Record<string, { nombre: string; email: string }> = {};
    perfilesRes.data?.forEach((p) => {
      perfMap[p.id] = { nombre: p.nombre, email: p.email };
    });

    const historial: MovimientoTrazabilidad[] = (movimientos || []).map((m) => {
      const user = perfMap[m.user_id] || { nombre: "Usuario eliminado", email: "desconocido" };
      return {
        id: m.id,
        userId: m.user_id,
        userNombre: user.nombre,
        userEmail: user.email,
        productoNombre: prodMap[m.producto_id] || "Producto eliminado",
        tipo: m.tipo as "entrada" | "salida",
        cantidad: Number(m.cantidad),
        creadoEn: m.creado_en,
      };
    });

    return { ok: true, data: historial };
  } catch (err: any) {
    return { ok: false, error: err.message || "Error al obtener historial de movimientos" };
  }
}
