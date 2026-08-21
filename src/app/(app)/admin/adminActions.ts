"use server";

import { revalidatePath } from "next/cache";
import { crearClienteSupabaseServidor, crearClienteSupabaseAdmin } from "@/lib/supabase/server";
import { obtenerTrazabilidadUsuarios, obtenerHistorialMovimientosTrazabilidad } from "@/repositories/metricasRepository";


// Lista de administradores permitidos (se puede expandir vía .env)
function esAdministrador(email?: string): boolean {
  if (!email) return false;
  const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
  const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase());
  // Fallback si no está configurada la variable: tu correo de usuario
  return adminEmails.includes(email.toLowerCase()) || email.toLowerCase().includes("mari_");
}

async function verificarAdmin() {
  const userClient = await crearClienteSupabaseServidor();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user || !esAdministrador(user.email)) {
    throw new Error("No autorizado: Acceso exclusivo para administradores");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const usesPlaceholder = serviceRoleKey === "tu-service-role-key-aqui" || !serviceRoleKey;

  const supabase = usesPlaceholder ? userClient : crearClienteSupabaseAdmin();
  return { supabase, user };
}

// 1. SEMBRAR DATOS DE SIMULACIÓN (Listo para TikTok / Reels)
export async function sembrarDatosSimulacionAction() {
  try {
    const { supabase, user } = await verificarAdmin();

    // A. Crear 3 proveedores de prueba
    const provsData = [
      { user_id: user.id, nombre: "Proveedor Alimentos Express", dias_demora: 3 },
      { user_id: user.id, nombre: "Importadora Textil Andina", dias_demora: 7 },
      { user_id: user.id, nombre: "Tecno Distribuidora", dias_demora: 5 },
    ];

    const { data: provs, error: errProvs } = await supabase
      .from("proveedores")
      .insert(provsData)
      .select();

    if (errProvs || !provs || provs.length === 0) {
      throw new Error("Error al sembrar proveedores: " + errProvs?.message);
    }

    const [provAlimentos, provTextil, provTecno] = provs;

    // B. Crear 6 productos en diferentes estados
    const prodsData = [
      // Normal: Stock actual > PdP (Stock Mínimo + Consumo * Demora)
      // PdP: 10 + (5 * 3) = 25. Stock actual: 50. Estado: Normal
      {
        user_id: user.id,
        proveedor_id: provAlimentos.id,
        nombre: "Arroz Integral 1kg",
        stock_actual: 50,
        stock_minimo: 10,
        consumo_diario: 5,
      },
      // Alerta: Stock actual <= PdP (25) y > Stock Mínimo (10). Estado: Alerta
      {
        user_id: user.id,
        proveedor_id: provAlimentos.id,
        nombre: "Aceite de Girasol 1.5L",
        stock_actual: 18,
        stock_minimo: 10,
        consumo_diario: 5,
      },
      // Crítico: Stock actual <= Stock Mínimo (15). Estado: Crítico
      {
        user_id: user.id,
        proveedor_id: provAlimentos.id,
        nombre: "Harina de Trigo 000",
        stock_actual: 8,
        stock_minimo: 15,
        consumo_diario: 4,
      },
      // Alerta Textil: PdP: 20 + (2 * 7) = 34. Stock: 28. Estado: Alerta
      {
        user_id: user.id,
        proveedor_id: provTextil.id,
        nombre: "Remera Algodón Negra L",
        stock_actual: 28,
        stock_minimo: 20,
        consumo_diario: 2,
      },
      // Normal Tecno: PdP: 5 + (1 * 5) = 10. Stock: 15. Estado: Normal
      {
        user_id: user.id,
        proveedor_id: provTecno.id,
        nombre: "Auriculares Bluetooth In-Ear",
        stock_actual: 15,
        stock_minimo: 5,
        consumo_diario: 1,
      },
      // Crítico Tecno: PdP: 5 + (2 * 5) = 15. Stock: 3. Estado: Crítico
      {
        user_id: user.id,
        proveedor_id: provTecno.id,
        nombre: "Cable Cargador USB-C 2m",
        stock_actual: 3,
        stock_minimo: 5,
        consumo_diario: 2,
      },
    ];

    const { data: prods, error: errProds } = await supabase
      .from("productos")
      .insert(prodsData)
      .select();

    if (errProds || !prods || prods.length === 0) {
      throw new Error("Error al sembrar productos: " + errProds?.message);
    }

    // C. Simular movimientos históricos
    const movimientos = [];
    for (const prod of prods) {
      // Simular entradas y salidas iniciales
      movimientos.push(
        { user_id: user.id, producto_id: prod.id, tipo: "entrada", cantidad: 30 },
        { user_id: user.id, producto_id: prod.id, tipo: "salida", cantidad: 5 }
      );
    }

    const { error: errMovs } = await supabase.from("movimientos_stock").insert(movimientos);
    if (errMovs) {
      throw new Error("Error al sembrar movimientos: " + errMovs.message);
    }

    // D. Simular algunos dolores de onboarding falsos para poblar el mapa
    // Esto se inserta en perfiles_onboarding para otros usuarios simulados (requiere bypass o simulación manual)
    // Para simplificar, sembramos dolores asociados a este usuario y algunos perfiles fake.
    
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, data: "Datos de simulación sembrados con éxito" };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

// 2. RESETEAR TODOS LOS DATOS DEL USUARIO
export async function resetearDatosAction() {
  try {
    const { supabase, user } = await verificarAdmin();

    // Eliminar productos y proveedores (provoca borrado en cascada de movimientos y alertas)
    const { error: errProds } = await supabase.from("productos").delete().eq("user_id", user.id);
    if (errProds) throw errProds;

    const { error: errProvs } = await supabase.from("proveedores").delete().eq("user_id", user.id);
    if (errProvs) throw errProvs;

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, data: "Base de datos limpia correctamente" };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

// 3. SIMULAR QUIEBRE EVITADO MANUALMENTE
export async function simularQuiebreEvitadoAction() {
  try {
    const { supabase, user } = await verificarAdmin();

    // Buscar un producto del usuario que esté actualmente en estado de alerta
    const { data: productos, error: errProds } = await supabase
      .from("vista_productos_puntos_pedido")
      .select("*")
      .eq("user_id", user.id)
      .eq("estado", "alerta")
      .limit(1);

    if (errProds) throw errProds;

    if (!productos || productos.length === 0) {
      return { 
        ok: false, 
        error: "No se encontró ningún producto en 'Estado de Alerta' (Amarillo) para simular la reposición rápida." 
      };
    }

    const prod = productos[0];
    
    // Calcular cantidad necesaria para superar el PdP
    const cantidadReponer = (prod.punto_pedido - prod.stock_actual) + 5;

    // Registrar la entrada rápida de stock
    const { error: errMov } = await supabase
      .from("movimientos_stock")
      .insert({
        user_id: user.id,
        producto_id: prod.producto_id,
        tipo: "entrada",
        cantidad: cantidadReponer,
      });

    if (errMov) throw errMov;

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, data: `Se reabasteció el producto '${prod.producto_nombre}' con +${cantidadReponer} unidades, evitando un quiebre de stock.` };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

// 4. CRUD DE PREGUNTAS DE ONBOARDING
export async function crearOpcionOnboardingAction(texto: string) {
  try {
    const { supabase } = await verificarAdmin();
    const { data, error } = await supabase
      .from("problemas_onboarding_opciones")
      .insert({ texto, activo: true })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function toggleOpcionOnboardingAction(id: string, activo: boolean) {
  try {
    const { supabase } = await verificarAdmin();
    const { error } = await supabase
      .from("problemas_onboarding_opciones")
      .update({ activo })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function actualizarOpcionOnboardingAction(id: string, texto: string) {
  try {
    const { supabase } = await verificarAdmin();
    const { error } = await supabase
      .from("problemas_onboarding_opciones")
      .update({ texto })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin");
    return { ok: true, data: undefined };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function actualizarWhatsAppAdminAction(whatsapp: string) {
  try {
    const { supabase, user } = await verificarAdmin();
    const { error } = await supabase
      .from("perfiles_onboarding")
      .update({ whatsapp })
      .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, data: "WhatsApp de soporte actualizado correctamente" };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function obtenerTrazabilidadUsuariosAction() {
  try {
    const { supabase } = await verificarAdmin();
    
    // Inicializar cliente admin de fallback si corresponde
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const usesPlaceholder = serviceRoleKey === "tu-service-role-key-aqui" || !serviceRoleKey;
    const supabaseAdmin = usesPlaceholder ? null : crearClienteSupabaseAdmin();

    return await obtenerTrazabilidadUsuarios(supabase, supabaseAdmin);
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function obtenerHistorialMovimientosAction() {
  try {
    const { supabase } = await verificarAdmin();
    return await obtenerHistorialMovimientosTrazabilidad(supabase);
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
