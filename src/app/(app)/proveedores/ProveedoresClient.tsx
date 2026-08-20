"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Loader2 } from "lucide-react";
import { Proveedor } from "@/repositories/proveedoresRepository";
import { crearProveedorAction, actualizarProveedorAction, eliminarProveedorAction } from "./proveedoresActions";

interface ProveedoresClientProps {
  proveedoresIniciales: Proveedor[];
}

export default function ProveedoresClient({ proveedoresIniciales }: ProveedoresClientProps) {
  const [nombre, setNombre] = useState("");
  const [diasDemora, setDiasDemora] = useState<number>(0);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNombre("");
    setDiasDemora(0);
    setEditandoId(null);
    setError(null);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const payload = { nombre, dias_demora: diasDemora };
    let resultado;

    if (editandoId) {
      resultado = await actualizarProveedorAction(editandoId, payload);
    } else {
      resultado = await crearProveedorAction(payload);
    }

    if (resultado.ok) {
      resetForm();
    } else {
      setError(resultado.error);
    }
    setCargando(false);
  };

  const handleEdit = (p: Proveedor) => {
    setEditandoId(p.id);
    setNombre(p.nombre);
    setDiasDemora(p.dias_demora);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este proveedor? Esto fallará si tiene productos vinculados.")) return;
    setCargando(true);
    const resultado = await eliminarProveedorAction(id);
    if (!resultado.ok) {
      setError(resultado.error);
    }
    setCargando(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulario */}
      <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 h-fit space-y-6">
        <h3 className="text-lg font-semibold text-foreground">
          {editandoId ? "Editar Proveedor" : "Nuevo Proveedor"}
        </h3>

        {error && (
          <div className="p-3 bg-critical/10 border border-critical/20 rounded-lg text-critical text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label htmlFor="nombreProv" className="block text-xs font-medium text-foreground/50 uppercase tracking-wider">
              Nombre / Razón Social
            </label>
            <input
              type="text"
              id="nombreProv"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Distribuidora Central"
              className="mt-1.5 w-full bg-background border border-border rounded-lg text-foreground focus:border-brand py-2 px-3 outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="demoraProv" className="block text-xs font-medium text-foreground/50 uppercase tracking-wider">
              Días de Demora de Entrega
            </label>
            <input
              type="number"
              id="demoraProv"
              required
              min={0}
              value={diasDemora}
              onChange={(e) => setDiasDemora(Number(e.target.value))}
              className="mt-1.5 w-full bg-background border border-border rounded-lg text-foreground focus:border-brand py-2 px-3 outline-none text-sm numbers-mono"
            />
            <p className="mt-1 text-xs text-foreground/40">
              ¿Cuánto tarda el proveedor desde que hacés el pedido hasta que llega?
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-background bg-brand hover:bg-brand/90 focus:outline-none transition-all disabled:opacity-50"
            >
              {cargando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editandoId ? "Guardar" : "Agregar"}</span>
                </>
              )}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center justify-center p-2 border border-border rounded-lg text-foreground/75 hover:bg-surface-hover transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Listado */}
      <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 overflow-hidden">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Proveedores Registrados
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">
                <th className="pb-3 pt-2">Nombre</th>
                <th className="pb-3 pt-2 text-right">Días de Demora</th>
                <th className="pb-3 pt-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proveedoresIniciales.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-foreground/40">
                    No hay proveedores registrados aún.
                  </td>
                </tr>
              ) : (
                proveedoresIniciales.map((prov) => (
                  <tr key={prov.id} className="hover:bg-surface-hover/30 transition-all">
                    <td className="py-3.5 font-medium text-foreground">{prov.nombre}</td>
                    <td className="py-3.5 text-right numbers-mono font-medium">{prov.dias_demora} días</td>
                    <td className="py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleEdit(prov)}
                        className="p-1.5 hover:bg-border rounded text-foreground/60 hover:text-brand transition-all inline-flex"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEliminar(prov.id)}
                        className="p-1.5 hover:bg-border rounded text-foreground/60 hover:text-critical transition-all inline-flex"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
