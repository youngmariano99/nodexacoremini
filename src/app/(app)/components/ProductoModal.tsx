"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { FilaProductoCalculado } from "@/repositories/productosRepository";
import { Proveedor } from "@/repositories/proveedoresRepository";

interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  editandoId: string | null;
  productoInitial?: FilaProductoCalculado | null;
  listaProveedores: Proveedor[];
  onCrearProveedorRapido: (nombre: string, demora: number) => Promise<string | null>;
  onGuardar: (data: {
    id?: string;
    nombre: string;
    proveedorId: string;
    stockActual: number;
    stockMinimo: number;
    consumoDiario: number;
  }) => Promise<boolean>;
}

export default function ProductoModal({
  isOpen,
  onClose,
  editandoId,
  productoInitial,
  listaProveedores,
  onCrearProveedorRapido,
  onGuardar,
}: ProductoModalProps) {
  const [nombre, setNombre] = useState(productoInitial?.producto_nombre || "");
  const [stockActual, setStockActual] = useState<number>(0);
  const [stockMinimo, setStockMinimo] = useState<number>(productoInitial?.stock_minimo || 0);
  const [consumoDiario, setConsumoDiario] = useState<number>(productoInitial?.consumo_diario || 0);
  const [proveedorId, setProveedorId] = useState(productoInitial?.proveedor_id || "");

  // Creador rápido de proveedor
  const [mostrandoFormProv, setMostrandoFormProv] = useState(false);
  const [nuevoProvNombre, setNuevoProvNombre] = useState("");
  const [nuevoProvDemora, setNuevoProvDemora] = useState<number>(3);
  const [cargandoProv, setCargandoProv] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCrearProveedor = async () => {
    if (!nuevoProvNombre.trim()) return;
    setCargandoProv(true);
    setError(null);
    try {
      const pId = await onCrearProveedorRapido(nuevoProvNombre, nuevoProvDemora);
      if (pId) {
        setProveedorId(pId);
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
    if (!nombre.trim() || !proveedorId) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }
    setCargando(true);
    setError(null);

    try {
      const success = await onGuardar({
        id: editandoId || undefined,
        nombre,
        proveedorId,
        stockActual,
        stockMinimo,
        consumoDiario,
      });
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar el producto.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/50 hover:text-foreground inline-flex min-touch-target"
          type="button"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold text-foreground">
          {editandoId ? "Editar Producto" : "Nuevo Producto"}
        </h3>

        {error && (
          <div className="p-3 bg-critical/10 border border-critical/20 rounded-lg text-critical text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground/50 uppercase">Nombre del Producto *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Harina Integral 1kg"
              className="mt-1.5 w-full bg-background text-sm min-h-[44px]"
            />
          </div>

          {/* Selector de Proveedor + Creador rápido */}
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <label className="block text-sm font-semibold text-foreground/50 uppercase">Proveedor *</label>
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
                required
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="mt-1 w-full bg-background text-sm min-h-[44px]"
              >
                <option value="">Seleccionar Proveedor...</option>
                {listaProveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.dias_demora} días demora)</option>
                ))}
              </select>
            )}
          </div>

          {!editandoId && (
            <div>
              <label className="block text-sm font-semibold text-foreground/50 uppercase">Stock Inicial</label>
              <input
                type="number"
                required
                min={0}
                value={stockActual}
                onChange={(e) => setStockActual(Number(e.target.value))}
                className="mt-1.5 w-full bg-background text-sm font-mono min-h-[44px]"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground/50 uppercase">Stock Mínimo</label>
              <input
                type="number"
                required
                min={0}
                value={stockMinimo}
                onChange={(e) => setStockMinimo(Number(e.target.value))}
                className="mt-1.5 w-full bg-background text-sm font-mono min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground/50 uppercase">Consumo Diario</label>
              <input
                type="number"
                required
                min={0}
                value={consumoDiario}
                onChange={(e) => setConsumoDiario(Number(e.target.value))}
                className="mt-1.5 w-full bg-background text-sm font-mono min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-border rounded-lg text-sm text-foreground/80 hover:bg-surface-hover hover:text-foreground transition-all min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg text-sm font-semibold text-background bg-brand hover:bg-brand/90 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
