import { redirect } from "next/navigation";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { verificarPerfilOnboardingCompletado } from "@/repositories/onboardingRepository";
import { obtenerProductosCalculados } from "@/repositories/productosRepository";
import { obtenerProveedores } from "@/repositories/proveedoresRepository";
import Navbar from "@/components/layout/Navbar";
import CTA from "@/components/layout/CTA";
import PlanillaStockClient from "./PlanillaStockClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await crearClienteSupabaseServidor();

  // Validar sesión del usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Validar si completó el onboarding profile
  const onboardingRes = await verificarPerfilOnboardingCompletado(supabase, user.id);
  if (!onboardingRes.ok || !onboardingRes.data) {
    redirect("/onboarding");
  }

  // Cargar datos en paralelo para mejorar rendimiento y obtener WhatsApp del administrador
  const [productosRes, proveedoresRes, adminPerfilRes] = await Promise.all([
    obtenerProductosCalculados(supabase, user.id),
    obtenerProveedores(supabase),
    supabase.from("perfiles_onboarding").select("whatsapp, email"),
  ]);

  const productos = productosRes.ok ? productosRes.data : [];
  const proveedores = proveedoresRes.ok ? proveedoresRes.data : [];

  const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
  const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase());
  const adminProfile = adminPerfilRes.data?.find(p => 
    adminEmails.includes(p.email.toLowerCase()) || p.email.toLowerCase().includes("mari_")
  );
  const adminWhatsApp = adminProfile ? adminProfile.whatsapp : "";
  const userEmail = user.email || "";
  const esAdmin = userEmail ? (adminEmails.includes(userEmail.toLowerCase()) || userEmail.toLowerCase().includes("mari_")) : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Barra de Navegación */}
      <Navbar userEmail={userEmail} esAdmin={esAdmin} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Cabecera Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Control de Inventario Inteligente
            </h1>
            <p className="text-sm text-foreground/50 mt-1">
              Monitoreá tus niveles de stock en tiempo real y anticipá las compras a tus proveedores.
            </p>
          </div>
        </div>

        {/* Planilla de Stock Interactiva */}
        <PlanillaStockClient 
          productosIniciales={productos} 
          proveedores={proveedores} 
          esAdmin={esAdmin}
        />

        {/* Banner CTA para conversión de Marketing */}
        <CTA adminWhatsApp={adminWhatsApp} />
      </main>
    </div>
  );
}
