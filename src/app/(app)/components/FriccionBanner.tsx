"use client";

import { HelpCircle } from "lucide-react";

export default function FriccionBanner() {
  return (
    <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 flex gap-4 text-sm text-foreground/80">
      <HelpCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h4 className="font-semibold text-foreground">💡 Tip de Eficiencia Operativa</h4>
        <p className="text-sm leading-relaxed text-foreground/60">
          ¿Cansado de descontar a mano cada unidad? En <strong>Nodexa Core</strong>, el stock se descuenta solo <strong>al registrar una venta</strong>. El mini sistema no genera reportes de &quot;productos más vendidos del mes&quot;, pero la versión completa automatiza todo tu historial de ventas y compras.
        </p>
      </div>
    </div>
  );
}
