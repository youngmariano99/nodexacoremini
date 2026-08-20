import { redirect } from "next/navigation";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { obtenerOpcionesOnboarding, verificarPerfilOnboardingCompletado } from "@/repositories/onboardingRepository";
import FormularioOnboardingClient from "./FormularioOnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await crearClienteSupabaseServidor();

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Verificar si ya completó el perfil
  const yaCompletadoRes = await verificarPerfilOnboardingCompletado(supabase, user.id);
  if (yaCompletadoRes.ok && yaCompletadoRes.data) {
    redirect("/");
  }

  // Obtener opciones para la pregunta clave de onboarding
  const opcionesRes = await obtenerOpcionesOnboarding(supabase);
  const opciones = opcionesRes.ok ? opcionesRes.data : [];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          Configurá tu perfil de negocio
        </h2>
        <p className="mt-2 text-sm text-foreground/60 max-w-sm mx-auto">
          Completá estos datos mínimos para configurar tu planilla inteligente de Punto de Pedido.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10">
        <div className="bg-surface py-8 px-6 border border-border shadow-xl rounded-xl sm:px-10">
          <FormularioOnboardingClient 
            userId={user.id} 
            userEmail={user.email || ""} 
            opciones={opciones} 
          />
        </div>
      </div>
    </div>
  );
}
