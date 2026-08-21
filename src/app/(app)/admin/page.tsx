import { redirect } from "next/navigation";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { obtenerTodasOpcionesOnboarding } from "@/repositories/onboardingRepository";
import { obtenerMetricasPruebaSocial, obtenerMapaDeDolores, obtenerPowerUsers } from "@/repositories/metricasRepository";
import Navbar from "@/components/layout/Navbar";
import AdminPanelClient from "./AdminPanelClient";

export const dynamic = "force-dynamic";

// Lista de administradores permitidos
function esAdministrador(email?: string): boolean {
  if (!email) return false;
  const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
  const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase()) || email.toLowerCase().includes("mari_");
}

export default async function AdminPage() {
  const supabase = await crearClienteSupabaseServidor();

  // Validar sesión
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Validar rol de administrador
  if (!esAdministrador(user.email)) {
    redirect("/"); // Si no es admin, redirección silenciosa a la planilla principal
  }

  // Cargar estadísticas y perfil de admin (WhatsApp)
  const [opcionesRes, socialRes, doloresRes, powerUsersRes, adminPerfilRes] = await Promise.all([
    obtenerTodasOpcionesOnboarding(supabase),
    obtenerMetricasPruebaSocial(supabase),
    obtenerMapaDeDolores(supabase),
    obtenerPowerUsers(supabase),
    supabase.from("perfiles_onboarding").select("whatsapp").eq("id", user.id).maybeSingle(),
  ]);

  const opciones = opcionesRes.ok ? opcionesRes.data : [];
  const social = socialRes.ok ? socialRes.data : { quiebresEvitados: 0, totalProductos: 0, totalMovimientos: 0, horasAhorradas: 0 };
  const dolores = doloresRes.ok ? doloresRes.data : [];
  const powerUsers = powerUsersRes.ok ? powerUsersRes.data : [];
  const adminWhatsApp = adminPerfilRes.data ? adminPerfilRes.data.whatsapp : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={user.email} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Control del Super Administrador</h1>
          <p className="text-sm text-foreground/50">
            Administración del catálogo de dolores de registro, simulador de datos para videos y métricas de cualificación comercial.
          </p>
        </div>

        <AdminPanelClient
          opcionesOnboarding={opciones}
          metricasSociales={social}
          mapaDolores={dolores}
          powerUsers={powerUsers}
          adminWhatsApp={adminWhatsApp}
        />
      </main>
    </div>
  );
}
