import { redirect } from "next/navigation";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { obtenerProveedores } from "@/repositories/proveedoresRepository";
import Navbar from "@/components/layout/Navbar";
import ProveedoresClient from "./ProveedoresClient";

export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  const supabase = await crearClienteSupabaseServidor();

  // Validar auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const proveedoresRes = await obtenerProveedores(supabase);
  const proveedores = proveedoresRes.ok ? proveedoresRes.data : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar userEmail={user.email} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Proveedores</h1>
          <p className="text-sm text-foreground/50">
            Administrá los días de demora de cada proveedor para asegurar el cálculo automático del punto de pedido.
          </p>
        </div>

        <ProveedoresClient proveedoresIniciales={proveedores} />
      </main>
    </div>
  );
}
