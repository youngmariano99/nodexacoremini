"use client";

import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { registrarOnboardingAction } from "./onboardingActions";

interface FormularioOnboardingClientProps {
  userId: string;
  userEmail: string;
  opciones: Array<{ id: string; texto: string }>;
}

export default function FormularioOnboardingClient({
  userId,
  userEmail,
  opciones,
}: FormularioOnboardingClientProps) {
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [rubro, setRubro] = useState("");
  const [problemaId, setProblemaId] = useState<string>("");
  const [problemaOtro, setProblemaOtro] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const esOtro = problemaId === "otro";

    const resultado = await registrarOnboardingAction({
      nombre,
      email: userEmail,
      whatsapp,
      rubro,
      problema_stock_id: esOtro ? null : (problemaId || null),
      problema_stock_otro: esOtro ? problemaOtro : null,
    });

    if (resultado.ok) {
      window.location.href = "/";
    } else {
      setError(resultado.error);
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-critical/10 border border-critical/20 rounded-lg text-critical text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-foreground/80">
          Tu Nombre Completo
        </label>
        <input
          type="text"
          id="nombre"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Juan Pérez"
          className="mt-1 w-full bg-background border border-border rounded-lg text-foreground focus:border-brand py-2 px-3 outline-none"
        />
      </div>

      <div>
        <label htmlFor="whatsapp" className="block text-sm font-medium text-foreground/80">
          Número de WhatsApp (con código de país)
        </label>
        <input
          type="tel"
          id="whatsapp"
          required
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="Ej: +5491122334455"
          className="mt-1 w-full bg-background border border-border rounded-lg text-foreground focus:border-brand py-2 px-3 outline-none"
        />
      </div>

      <div>
        <label htmlFor="rubro" className="block text-sm font-medium text-foreground/80">
          Rubro / Tipo de Tienda
        </label>
        <input
          type="text"
          id="rubro"
          required
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          placeholder="Ej: Indumentaria, Kiosco, Ferretería"
          className="mt-1 w-full bg-background border border-border rounded-lg text-foreground focus:border-brand py-2 px-3 outline-none"
        />
      </div>

      <div>
        <label htmlFor="problema" className="block text-sm font-medium text-foreground/80">
          ¿Cuál es tu mayor problema de stock hoy?
        </label>
        <select
          id="problema"
          required
          value={problemaId}
          onChange={(e) => setProblemaId(e.target.value)}
          className="mt-1 w-full bg-background border border-border rounded-lg text-foreground focus:border-brand py-2 px-3 outline-none"
        >
          <option value="">Seleccionar una opción...</option>
          {opciones.map((opc) => (
            <option key={opc.id} value={opc.id}>
              {opc.texto}
            </option>
          ))}
          <option value="otro">Otro (describir abajo)</option>
        </select>
      </div>

      {problemaId === "otro" && (
        <div>
          <label htmlFor="otro_texto" className="block text-sm font-medium text-foreground/80">
            Describí brevemente tu dolor de stock
          </label>
          <textarea
            id="otro_texto"
            required
            rows={3}
            value={problemaOtro}
            onChange={(e) => setProblemaOtro(e.target.value)}
            placeholder="Ej: Mis proveedores tardan mucho y no sé cuánto stock de seguridad guardar..."
            className="mt-1 w-full bg-background border border-border rounded-lg text-foreground focus:border-brand py-2 px-3 outline-none resize-none"
          />
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={cargando}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-background bg-brand hover:bg-brand/90 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cargando ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Finalizar Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
