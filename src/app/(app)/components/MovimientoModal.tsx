"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check, AlertTriangle } from "lucide-react";
import { FilaProductoCalculado } from "@/repositories/productosRepository";
import { Proveedor } from "@/repositories/proveedoresRepository";

interface MovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  productoMovimiento: FilaProductoCalculado | null;
  listaProveedores: Proveedor[];
  onCrearProveedorRapido: (nombre: string, demora: number) => Promise<string | null>;
  onGuardarMovimiento: (data: {
    producto_id: string;
    tipo: "entrada" | "salida";
    cantidad: number;
    proveedor_id: string;
  }) => Promise<boolean>;
}

export default function MovimientoModal({
  isOpen,
  onClose,
  productoMovimiento,
  listaProveedores,
  onCrearProveedorRapido,
  onGuardarMovimiento,
}: MovimientoModalProps) {
  const [movTipo, setMovTipo] = useState<"entrada" | "salida">("entrada");
  const [movCantidad, setMovCantidad] = useState<number>(1);
  const [movProveedorId, setMovProveedorId] = useState(productoMovimiento?.proveedor_id || "");

  // Creador rápido de proveedor
  const [mostrandoFormProv, setMostrandoFormProv] = useState(false);
  const [nuevoProvNombre, setNuevoProvNombre] = useState("");
  const [nuevoProvDemora, setNuevoProvDemora] = useState<number>(3);
  const [cargandoProv, setCargandoProv] = useState(false);

  const [cargandoMov, setCargandoMov] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !productoMovimiento) return null;

  const handleCrearProveedor = async () => {
    if (!nuevoProvNombre.trim()) return;
    setCargandoProv(true);
    setError(null);
    try {
      const pId = await onCrearProveedorRapido(nuevoProvNombre, nuevoProvDemora);
      if (pId) {
        setMovProveedorId(pId);
        setMostrandoFormProv(false);
        setNuevoProvNombre("");
        setNuevoProvDemora(3);
      } else {
        setError("No se pudo crear el proveedor");
      }
    } catch (err: any) {
      setError(err.message || "Error al crear proveedor");
    } finally {
      setCargandoProv(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (movCantidad <= 0) {
      setError("La cantidad debe ser mayor a 0.");
      return;
    }
    setCargandoMov(true);
    setError(null);

    try {
      const success = await onGuardarMovimiento({
        producto_id: productoMovimiento.producto_id,
        tipo: movTipo,
        cantidad: movCantidad,
        proveedor_id: movProveedorId || productoMovimiento.proveedor_id,
      });
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al registrar el movimiento.");
    } finally {
      setCargandoMov(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/50 hover:text-foreground inline-flex min-touch-target"
          type="button"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold text-foreground">
          Registrar Movimiento de Stock
        </h3>
        <p className="text-sm text-foreground/50">
          Registrá una entrada o salida exacta sobre el producto: <strong className="text-foreground">{productoMovimiento.producto_nombre}</strong>.
        </p>

        {error && (
          <div className="p-3 bg-critical/10 border border-critical/20 rounded-lg text-critical text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            {/* Tipo de Movimiento */}
            <div>
              <label className="block text-sm font-semibold text-foreground/50 uppercase">Tipo</label>
              <select
                value={movTipo}
                onChange={(e) => setMovTipo(e.target.value as "entrada" | "salida")}
                className="mt-1.5 w-full bg-background text-sm min-h-[44px]"
              >
                <option value="entrada">Entrada (+)</option>
                <option value="salida">Salida (-)</option>
              </select>
            </div>
            {/* Cantidad Exacta */}
            <div>
              <label className="block text-sm font-semibold text-foreground/50 uppercase">Cantidad</label>
              <input
                type="number"
                required
                min={1}
                value={movCantidad}
                onChange={(e) => setMovCantidad(Number(e.target.value))}
                className="mt-1.5 w-full bg-background text-sm font-mono numbers-mono min-h-[44px]"
              />
            </div>
          </div>

          {/* Proveedor de Origen con creación rápida */}
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <label className="block text-sm font-semibold text-foreground/50 uppercase">Proveedor de Origen / Destino</label>
              <button
                type="button"
                onClick={() => setMostrandoFormProv(!mostrandoFormProv)}
                className="text-sm text-brand hover:underline font-semibold min-touch-target"
              >
                {mostrandoFormProv ? "- Cancelar" : "+ Crear Rápido"}
              </button>
            </div>

            {mostrandoFormProv ? (
              <div className="p-3 bg-background border border-border rounded-lg space-y-3">
                <span className="block text-sm font-bold text-foreground/70">Dar de alta proveedor:</span>
                <input
                  type="text"
                  placeholder="Nombre del Proveedor"
                  value={nuevoProvNombre}
                  onChange={(e) => setNuevoProvNombre(e.target.value)}
                  className="w-full text-sm py-1.5 px-2.5 bg-surface border border-border rounded min-h-[44px]"
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-foreground/50 uppercase shrink-0">Demora (días):</label>
                    <input
                      type="number"
                      min={0}
                      value={nuevoProvDemora}
                      onChange={(e) => setNuevoProvDemora(Number(e.target.value))}
                      className="w-16 text-sm py-1 px-2 bg-surface border border-border rounded numbers-mono min-h-[44px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCrearProveedor}
                    disabled={cargandoProv || !nuevoProvNombre.trim()}
                    className="py-1 px-3 bg-brand text-background text-sm font-bold rounded flex items-center gap-1 disabled:opacity-50 min-h-[44px] min-touch-target"
                  >
                    {cargandoProv ? <Loader2 className="w-3 h-3 animate-spin" /> : "Crear"}
                  </button>
                </div>
              </div>
            ) : (
              <select
                value={movProveedorId}
                onChange={(e) => setMovProveedorId(e.target.value)}
                className="mt-1.5 w-full bg-background text-sm min-h-[44px]"
              >
                <option value="">Proveedor por Defecto ({productoMovimiento.proveedor_nombre})</option>
                {listaProveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-border rounded-lg text-sm text-foreground/85 hover:bg-surface-hover transition-all min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargandoMov}
              className="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg text-sm font-semibold text-background bg-brand hover:bg-brand/90 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {cargandoMov ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
