import { HelpCircle } from "lucide-react";

export default function FriccionBanner() {
  return (
    <div className="bg-brand/5 border border-brand/20 rounded-xl p-5 flex gap-4 text-sm md:text-base text-foreground/80">
      <HelpCircle className="w-6 h-6 text-brand shrink-0 mt-0.5" />
      <div className="space-y-1.5">
        <h4 className="font-bold text-base md:text-lg text-foreground">💡 Consejo para ahorrar tiempo</h4>
        <p className="leading-relaxed text-foreground/75">
          ¿Cansado de restar a mano cada producto de tu planilla? En la versión completa **Nodexa Core**, tu stock se descuenta automáticamente cada vez que registrás una venta. Este mini-sistema gratuito sirve para anotar el stock diario de forma manual, pero la versión completa automatiza todo tu historial de ventas y compras sin esfuerzo.
        </p>
      </div>
    </div>
  );
}
