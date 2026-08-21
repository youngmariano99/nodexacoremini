"use client";

import { Loader2, Play, ShieldCheck, RotateCcw } from "lucide-react";

interface ControlesSimulacionProps {
  cargandoAccion: string | null;
  onSimulacion: (key: string, fn: () => Promise<any>) => Promise<void>;
  sembrarDatosSimulacionAction: () => Promise<any>;
  simularQuiebreEvitadoAction: () => Promise<any>;
  resetearDatosAction: () => Promise<any>;
}

export default function ControlesSimulacion({
  cargandoAccion,
  onSimulacion,
  sembrarDatosSimulacionAction,
  simularQuiebreEvitadoAction,
  resetearDatosAction,
}: ControlesSimulacionProps) {
  return (
    <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Centro de Control de Simulación (TikTok / Reels Ready)</h3>
        <p className="text-sm text-foreground/50">
          Usá estos controles rápidos para poblar tu cuenta de prueba con datos simulados interesantes y hacer demostraciones en video.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Sembrar Datos */}
        <button
          onClick={() => onSimulacion("sembrar", sembrarDatosSimulacionAction)}
          disabled={cargandoAccion !== null}
          className="flex items-center justify-center gap-3 p-4 bg-brand/5 hover:bg-brand/10 border border-brand/20 hover:border-brand/35 text-brand rounded-xl font-semibold text-sm transition-all disabled:opacity-50 text-center min-h-[44px]"
        >
          {cargandoAccion === "sembrar" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <div className="text-left">
            <span className="block font-bold">Sembrar Demo PLG</span>
            <span className="block text-xs font-normal opacity-75">3 provs, 6 prods y 12 movs</span>
          </div>
        </button>

        {/* Simular Quiebre Evitado */}
        <button
          onClick={() => onSimulacion("quiebre", simularQuiebreEvitadoAction)}
          disabled={cargandoAccion !== null}
          className="flex items-center justify-center gap-3 p-4 bg-brand/5 hover:bg-brand/10 border border-brand/20 hover:border-brand/35 text-brand rounded-xl font-semibold text-sm transition-all disabled:opacity-50 text-center min-h-[44px]"
        >
          {cargandoAccion === "quiebre" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-brand" />
          )}
          <div className="text-left">
            <span className="block font-bold">Simular Reposición Rápida</span>
            <span className="block text-xs font-normal text-foreground/50">Evita un quiebre de stock (+15 min)</span>
          </div>
        </button>

        {/* Resetear Base de Datos */}
        <button
          onClick={() => onSimulacion("resetear", resetearDatosAction)}
          disabled={cargandoAccion !== null}
          className="flex items-center justify-center gap-3 p-4 bg-critical/5 hover:bg-critical/10 border border-critical/20 hover:border-critical/30 text-critical rounded-xl font-semibold text-sm transition-all disabled:opacity-50 text-center min-h-[44px]"
        >
          {cargandoAccion === "resetear" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RotateCcw className="w-5 h-5" />
          )}
          <div className="text-left">
            <span className="block font-bold">Limpiar Base de Datos</span>
            <span className="block text-xs font-normal opacity-75">Borra tus proveedores y productos</span>
          </div>
        </button>
      </div>
    </section>
  );
}
