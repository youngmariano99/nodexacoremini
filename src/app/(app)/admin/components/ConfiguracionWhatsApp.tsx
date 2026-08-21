"use client";

import { Loader2, Phone, Save } from "lucide-react";

interface ConfiguracionWhatsAppProps {
  supportWhatsApp: string;
  setSupportWhatsApp: (val: string) => void;
  guardandoWhatsApp: boolean;
  onGuardarWhatsApp: (e: React.FormEvent) => void;
}

export default function ConfiguracionWhatsApp({
  supportWhatsApp,
  setSupportWhatsApp,
  guardandoWhatsApp,
  onGuardarWhatsApp,
}: ConfiguracionWhatsAppProps) {
  return (
    <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Phone className="w-5 h-5 text-brand" />
          Configuración de WhatsApp de Soporte / Venta
        </h3>
        <p className="text-sm text-foreground/50">
          Definí el número de WhatsApp al cual redirigir a los usuarios del plan gratuito cuando hagan clic en el botón &quot;[Probar Nodexa Core]&quot;.
        </p>
      </div>

      <form onSubmit={onGuardarWhatsApp} className="max-w-md space-y-3 pt-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej: 5491122334455 (código de país sin símbolos)"
            value={supportWhatsApp}
            onChange={(e) => setSupportWhatsApp(e.target.value)}
            className="bg-background text-sm py-2 px-3 rounded-lg border border-border flex-1 font-mono text-foreground outline-none focus:border-brand min-h-[44px]"
          />
          <button
            type="submit"
            disabled={guardandoWhatsApp}
            className="px-4 py-2 bg-brand text-background hover:bg-brand/90 font-semibold rounded-lg text-sm flex items-center gap-1.5 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {guardandoWhatsApp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </>
            )}
          </button>
        </div>
        <span className="block text-xs text-foreground/45">
          Nota: Recordá ingresar el código de país (ej. 54 para Argentina) seguido del número completo, sin &quot;+&quot; ni espacios.
        </span>
      </form>
    </section>
  );
}
