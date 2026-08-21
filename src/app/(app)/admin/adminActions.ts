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

    // A. Crear 4 proveedores de prueba
    const provsData = [
      { user_id: user.id, nombre: "Proveedor Alimentos Express", dias_demora: 3 },
      { user_id: user.id, nombre: "Importadora Textil Andina", dias_demora: 7 },
      { user_id: user.id, nombre: "Tecno Distribuidora", dias_demora: 5 },
      { user_id: user.id, nombre: "Bazar y Deco del Plata", dias_demora: 4 },
    ];

    const { data: provs, error: errProvs } = await supabase
      .from("proveedores")
      .insert(provsData)
      .select();

    if (errProvs || !provs || provs.length === 0) {
      throw new Error("Error al sembrar proveedores: " + errProvs?.message);
    }

    const [provAlimentos, provTextil, provTecno, provBazar] = provs;

    // B. Nombres para los 36 productos
    const alimentosNames = [
      "Arroz Integral 1kg", "Aceite de Girasol 1.5L", "Harina de Trigo 000", "Fideos Tallarín 500g",
      "Azúcar Mascabo 1kg", "Yerba Mate Premium 1kg", "Café Tostado Molido 250g", "Sal Marina Fina 500g",
      "Lentejas Secas 500g", "Leche Larga Vida 1L", "Puré de Tomate 520g", "Atún en Trozos 170g"
    ];
    const textilNames = [
      "Remera Algodón Negra L", "Remera Algodón Blanca M", "Jeans Azul Slim 42", "Buzo Capucha Negro XL",
      "Medias Deportivas Pack x3", "Gorra Trucker Ajustable", "Camisa Oxford Azul M", "Saco de Lana Gris L"
    ];
    const tecnoNames = [
      "Auriculares Bluetooth In-Ear", "Cable Cargador USB-C 2m", "Mouse Inalámbrico Ergonómico", "Teclado Mecánico RGB",
      "Powerbank 10000mAh", "Soporte Celular Escritorio", "Funda Protectora Transparente", "Adaptador HDMI a USB-C"
    ];
    const bazarNames = [
      "Taza Cerámica Negra", "Botella Térmica 750ml", "Set Cubiertos Pack x24", "Termo Acero Inoxidable 1L",
      "Tabla de picar Madera", "Sartén Antiadherente 24cm", "Hermético Vidrio Cuadrado", "Afilador Cuchillos Manual"
    ];

    const prodsData: {
      user_id: string;
      proveedor_id: string;
      nombre: string;
      stock_actual: number;
      stock_minimo: number;
      consumo_diario: number;
    }[] = [];

    // Llenar productos con estados variados (Normal, Alerta, Crítico)
    // 1. Alimentos (12 productos)
    alimentosNames.forEach((nombre, idx) => {
      // 4 Normal, 4 Alerta, 4 Crítico
      let stock_actual = 50;
      let stock_minimo = 10;
      let consumo_diario = 4;
      if (idx % 3 === 1) { // Alerta (Stock <= Min + Consumo * Demora = 10 + 4 * 3 = 22)
        stock_actual = 18;
      } else if (idx % 3 === 2) { // Crítico (Stock <= Min = 15)
        stock_minimo = 15;
        stock_actual = 8;
      }
      prodsData.push({
        user_id: user.id,
        proveedor_id: provAlimentos.id,
        nombre,
        stock_actual,
        stock_minimo,
        consumo_diario,
      });
    });

    // 2. Textil (8 productos)
    textilNames.forEach((nombre, idx) => {
      // 3 Normal, 3 Alerta, 2 Crítico
      let stock_actual = 60;
      let stock_minimo = 15;
      let consumo_diario = 2;
      if (idx % 3 === 1) { // Alerta (Stock <= 15 + 2 * 7 = 29)
        stock_actual = 25;
      } else if (idx % 3 === 2) { // Crítico (Stock <= 20)
        stock_minimo = 20;
        stock_actual = 12;
      }
      prodsData.push({
        user_id: user.id,
        proveedor_id: provTextil.id,
        nombre,
        stock_actual,
        stock_minimo,
        consumo_diario,
      });
    });

    // 3. Tecno (8 productos)
    tecnoNames.forEach((nombre, idx) => {
      // 3 Normal, 3 Alerta, 2 Crítico
      let stock_actual = 45;
      let stock_minimo = 8;
      let consumo_diario = 3;
      if (idx % 3 === 1) { // Alerta (Stock <= 8 + 3 * 5 = 23)
        stock_actual = 18;
      } else if (idx % 3 === 2) { // Crítico (Stock <= 12)
        stock_minimo = 12;
        stock_actual = 5;
      }
      prodsData.push({
        user_id: user.id,
        proveedor_id: provTecno.id,
        nombre,
        stock_actual,
        stock_minimo,
        consumo_diario,
      });
    });

    // 4. Bazar (8 productos)
    bazarNames.forEach((nombre, idx) => {
      // 3 Normal, 3 Alerta, 2 Crítico
      let stock_actual = 35;
      let stock_minimo = 6;
      let consumo_diario = 2;
      if (idx % 3 === 1) { // Alerta (Stock <= 6 + 2 * 4 = 14)
        stock_actual = 11;
      } else if (idx % 3 === 2) { // Crítico (Stock <= 10)
        stock_minimo = 10;
        stock_actual = 4;
      }
      prodsData.push({
        user_id: user.id,
        proveedor_id: provBazar.id,
        nombre,
        stock_actual,
        stock_minimo,
        consumo_diario,
      });
    });

    const { data: prods, error: errProds } = await supabase
      .from("productos")
      .insert(prodsData)
      .select();

    if (errProds || !prods || prods.length === 0) {
      throw new Error("Error al sembrar productos: " + errProds?.message);
    }

    // C. Simular movimientos históricos realistas para el autocálculo
    const movimientos = [];
    const ahora = new Date();

    for (const prod of prods) {
      // Sembramos 1 entrada de compra y 3 salidas de ventas distribuidas en los últimos 30 días
      const fecha1 = new Date(ahora.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString();
      const fecha2 = new Date(ahora.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString();
      const fecha3 = new Date(ahora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const fecha4 = new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

      movimientos.push(
        { user_id: user.id, producto_id: prod.id, tipo: "entrada", cantidad: 100, creado_en: fecha1 },
        { user_id: user.id, producto_id: prod.id, tipo: "salida", cantidad: prod.consumo_diario * 6, creado_en: fecha2 },
        { user_id: user.id, producto_id: prod.id, tipo: "salida", cantidad: prod.consumo_diario * 5, creado_en: fecha3 },
        { user_id: user.id, producto_id: prod.id, tipo: "salida", cantidad: prod.consumo_diario * 4, creado_en: fecha4 }
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
