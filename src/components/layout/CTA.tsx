"use client";

interface CTAProps {
  adminWhatsApp?: string;
}

export default function CTA({ adminWhatsApp }: CTAProps) {
  const cleanNumber = adminWhatsApp ? adminWhatsApp.replace(/[^0-9]/g, "") : "";
  const whatsappUrl = cleanNumber
    ? `https://wa.me/${cleanNumber}?text=Hola!%20Vengo%20del%20Mini%20Sistema%20y%20quiero%20probar%20Nodexa%20Core`
    : "https://nodexa.com/comenzar";

  return (
    <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
      {/* Luz ambiental sutil verde */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="space-y-2 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand text-xs font-semibold">
          Nodexa Core SaaS
        </div>
        <h3 className="text-xl font-bold text-foreground">
          ¿Tu negocio está creciendo? Migrá a la versión completa
        </h3>
        <p className="text-sm text-foreground/75 max-w-2xl">
          El Mini Sistema te dice cuándo pedir. Con <strong>Nodexa Core</strong> podés además gestionar múltiples depósitos, facturación automática, escaneo de códigos de barra, historial de precios y generar órdenes de compra automáticas en 1 clic.
        </p>
      </div>

      <div className="flex items-center gap-4 z-10 shrink-0">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 bg-brand text-background hover:bg-brand/90 transition-all font-semibold rounded-lg text-sm text-center shadow-lg shadow-brand/10"
        >
          Probar Nodexa Core
        </a>
      </div>
    </div>
  );
}
