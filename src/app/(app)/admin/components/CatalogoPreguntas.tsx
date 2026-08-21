"use client";

import { Loader2, Plus, Edit2, Check, X, Eye, EyeOff, MessageSquarePlus } from "lucide-react";
import { OpcionOnboarding } from "@/repositories/onboardingRepository";

interface CatalogoPreguntasProps {
  opcionesOnboarding: (OpcionOnboarding & { activo: boolean })[];
  nuevaOpcion: string;
  setNuevaOpcion: (val: string) => void;
  cargandoAccion: string | null;
  editandoOpcId: string | null;
  setEditandoOpcId: (val: string | null) => void;
  editandoOpcTexto: string;
  setEditandoOpcTexto: (val: string) => void;
  handleCrearOpcion: (e: React.FormEvent) => void;
  handleToggleOpcion: (id: string, activoActual: boolean) => void;
  handleGuardarOpcionEditada: (id: string) => void;
}

export default function CatalogoPreguntas({
  opcionesOnboarding,
  nuevaOpcion,
  setNuevaOpcion,
  cargandoAccion,
  editandoOpcId,
  setEditandoOpcId,
  editandoOpcTexto,
  setEditandoOpcTexto,
  handleCrearOpcion,
  handleToggleOpcion,
  handleGuardarOpcionEditada,
}: CatalogoPreguntasProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Crear Nueva Opción */}
      <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 space-y-4 h-fit">
        <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
          <MessageSquarePlus className="w-4 h-4 text-brand" />
          Nueva Opción de Onboarding
        </h4>
        <form onSubmit={handleCrearOpcion} className="space-y-4">
          <div>
            <label htmlFor="textoPregunta" className="block text-sm font-semibold text-foreground/50 uppercase">Texto de la Opción</label>
            <textarea
              id="textoPregunta"
              required
              rows={3}
              placeholder="Ej: Pierdo mucho tiempo revisando qué stock tengo"
              value={nuevaOpcion}
              onChange={(e) => setNuevaOpcion(e.target.value)}
              className="mt-1.5 w-full bg-background text-sm resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={cargandoAccion === "crear_opcion" || !nuevaOpcion.trim()}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-brand text-background hover:bg-brand/90 font-semibold rounded-lg text-sm transition-all disabled:opacity-50 min-h-[44px]"
          >
            {cargandoAccion === "crear_opcion" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Agregar Pregunta</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Catálogo de dolores (CRUD inline) */}
      <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Catálogo de Opciones (Preguntas de Registro)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                <th className="pb-3">Pregunta / Dolor Opcional</th>
                <th className="pb-3 text-right">Visibilidad en Onboarding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {opcionesOnboarding.length === 0 ? (
                <tr key="no-opc">
                  <td colSpan={2} className="py-4 text-center text-foreground/40">No hay opciones cargadas en catálogo.</td>
                </tr>
              ) : (
                opcionesOnboarding.map((opc, idx) => {
                  const cargandoToggle = cargandoAccion === `toggle_${opc.id}`;
                  const cargandoEdit = cargandoAccion === `edit_${opc.id}`;
                  const esEditando = editandoOpcId === opc.id;

                  return (
                    <tr key={opc.id || `opc-${idx}`} className="hover:bg-surface-hover/30 transition-all text-sm">
                      <td className="py-3 text-foreground">
                        {esEditando ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editandoOpcTexto}
                              onChange={(e) => setEditandoOpcTexto(e.target.value)}
                              className="bg-background text-sm py-1.5 px-3 rounded border border-border flex-1 focus:border-brand outline-none min-h-[44px]"
                            />
                            <button
                              onClick={() => handleGuardarOpcionEditada(opc.id)}
                              disabled={cargandoEdit || !editandoOpcTexto.trim()}
                              className="p-1.5 text-brand hover:bg-brand/10 rounded transition-all min-touch-target"
                              title="Guardar"
                            >
                              {cargandoEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditandoOpcId(null)}
                              disabled={cargandoEdit}
                              className="p-1.5 text-foreground/40 hover:bg-surface-hover rounded transition-all min-touch-target"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pr-4 gap-2">
                            <span>{opc.texto}</span>
                            <button
                              onClick={() => {
                                setEditandoOpcId(opc.id);
                                setEditandoOpcTexto(opc.texto);
                              }}
                              className="p-1 text-brand hover:bg-brand/10 rounded transition-all shrink-0 min-touch-target"
                              title="Editar texto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleToggleOpcion(opc.id, opc.activo)}
                          disabled={cargandoToggle}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-semibold border transition-all min-touch-target ${opc.activo
                              ? "bg-brand/10 border-brand/30 text-brand"
                              : "bg-border/30 border-border text-foreground/40"
                            }`}
                        >
                          {cargandoToggle ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : opc.activo ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Activo (Visible)</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Oculto</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
