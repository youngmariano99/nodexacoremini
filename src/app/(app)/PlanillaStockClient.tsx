"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Download, HelpCircle, Loader2, ArrowRight, ShieldCheck, Scale } from "lucide-react";
import { FilaProductoCalculado } from "@/repositories/productosRepository";
import { Proveedor } from "@/repositories/proveedoresRepository";
import { crearProductoAction, actualizarProductoAction, eliminarProductoAction, registrarMovimientoStockAction } from "./productosActions";
import { crearProveedorAction } from "./proveedores/proveedoresActions";
import Link from "next/link";
import FriccionBanner from "./components/FriccionBanner";
import ProductoModal from "./components/ProductoModal";
import MovimientoModal from "./components/MovimientoModal";

interface PlanillaStockClientProps {
  productosIniciales: FilaProductoCalculado[];
  proveedores: Proveedor[];
  esAdmin: boolean;
}

export default function PlanillaStockClient({
  productosIniciales,
  proveedores: proveedoresIniciales,
  esAdmin,
}: PlanillaStockClientProps) {
  // Manejo de lista local de proveedores para permitir agregados rápidos sin refrescar
  const [listaProveedores, setListaProveedores] = useState<Proveedor[]>(proveedoresIniciales);

  // Estados de visualización y filtrado
  const [busqueda, setBusqueda] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Modales
  const [mostrarProductoModal, setMostrarProductoModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<FilaProductoCalculado | null>(null);

  const [productoMovimiento, setProductoMovimiento] = useState<FilaProductoCalculado | null>(null);

  // Estados globales de UI
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNuevoProducto = () => {
    setEditandoId(null);
    setProductoSeleccionado(null);
    setMostrarProductoModal(true);
  };

  const handleEdit = (p: FilaProductoCalculado) => {
    setEditandoId(p.producto_id);
    setProductoSeleccionado(p);
    setMostrarProductoModal(true);
  };

  const handleCrearProveedorRapido = async (nombre: string, demora: number): Promise<string | null> => {
    const res = await crearProveedorAction({
      nombre,
      dias_demora: demora,
    });

    if (res.ok) {
      setListaProveedores((prev) => [...prev, res.data]);
      return res.data.id;
    } else {
      throw new Error(res.error || "Error al crear proveedor");
    }
  };

  const handleGuardarProducto = async (data: {
    id?: string;
    nombre: string;
    proveedorId: string;
    stockActual: number;
    stockMinimo: number;
    consumoDiario: number;
  }): Promise<boolean> => {
    let resultado;
    if (data.id) {
      resultado = await actualizarProductoAction(data.id, {
        nombre: data.nombre,
        stock_minimo: data.stockMinimo,
        consumo_diario: data.consumoDiario,
        proveedor_id: data.proveedorId,
      });
    } else {
      resultado = await crearProductoAction({
        nombre: data.nombre,
        stock_actual: data.stockActual,
        stock_minimo: data.stockMinimo,
        consumo_diario: data.consumoDiario,
        proveedor_id: data.proveedorId,
      });
    }

    if (resultado.ok) {
      setMostrarProductoModal(false);
      return true;
    } else {
      throw new Error(resultado.error || "Error al guardar el producto");
    }
  };

  const handleGuardarMovimiento = async (data: {
    producto_id: string;
    tipo: "entrada" | "salida";
    shadow_quantity?: number;
    cantidad: number;
    proveedor_id: string;
  }): Promise<boolean> => {
    const res = await registrarMovimientoStockAction({
      producto_id: data.producto_id,
      tipo: data.tipo,
      cantidad: data.cantidad,
      proveedor_id: data.proveedor_id || null,
    });

    if (res.ok) {
      setProductoMovimiento(null);
      return true;
    } else {
      throw new Error(res.error || "Error al registrar movimiento");
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro de eliminar este producto?")) return;
    setCargando(true);
    const resultado = await eliminarProductoAction(id);
    if (!resultado.ok) {
      setError(resultado.error);
    }
    setCargando(false);
  };

  const exportarCSV = () => {
    const encabezados = "Producto,Proveedor,Dias Demora,Consumo Diario,Stock Minimo,Punto de Pedido,Stock Actual,Estado\n";
    const filas = productosIniciales.map(p =>
      `"${p.producto_nombre}","${p.proveedor_nombre}",${p.dias_demora},${p.consumo_diario},${p.stock_minimo},${p.punto_pedido},${p.stock_actual},"${p.estado}"`
    ).join("\n");

    const blob = new Blob([encabezados + filas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "reporte_punto_de_pedido.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const productosFiltrados = productosIniciales.filter((p) => {
    const matchesBusqueda = p.producto_nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchesProveedor = filtroProveedor ? p.proveedor_id === filtroProveedor : true;
    const matchesEstado = filtroEstado ? p.estado === filtroEstado : true;
    return matchesBusqueda && matchesProveedor && matchesEstado;
  });

  return (
    <div className="space-y-6">
      {/* Banner de Acceso Admin si el correo cumple la regla */}
      {esAdmin && (
        <div className="bg-brand/10 border border-brand/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3 items-center">
            <ShieldCheck className="w-5 h-5 text-brand shrink-0" />
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-foreground">Modo Super Administrador Activo</span>
              <span className="block text-xs text-foreground/50">Tenes acceso al panel de métricas de tracción PLG y simulaciones.</span>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-background hover:bg-brand/90 font-bold rounded-lg text-xs tracking-wide transition-all shrink-0 min-touch-target"
          >
            <span>Ir al Panel Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Explicación del PdP */}
      <div className="bg-surface border border-border rounded-xl p-4 flex gap-4 text-sm text-foreground/80">
        <HelpCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-foreground">¿Cómo funciona la Planilla Inteligente?</h4>
          <p className="text-xs leading-relaxed text-foreground/60">
            Calculamos tu <strong className="text-foreground">Punto de Pedido (PdP)</strong> usando la fórmula:
            <code className="bg-background px-1.5 py-0.5 rounded text-brand font-mono ml-1">Stock Mínimo + (Consumo Diario * Demora del Proveedor)</code>.
            Cuando tu stock cae por debajo de este punto, el estado cambiará a <span className="text-alert font-bold">Alerta (Amarillo)</span> para que emitas una orden al proveedor. Si cae por debajo del Stock Mínimo de seguridad, entrará en <span className="text-critical font-bold">Estado Crítico (Rojo)</span>.
          </p>
        </div>
      </div>

      {/* Banner de Fricción / Upsell Educativo */}
      <FriccionBanner />

      {/* Cabecera y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-surface text-sm border border-border py-2 px-3 rounded-lg text-foreground focus:border-brand outline-none w-full sm:w-48 font-medium"
          />

          <select
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="bg-surface text-sm border border-border py-2 px-3 rounded-lg text-foreground focus:border-brand outline-none"
          >
            <option value="">Todos los Proveedores</option>
            {listaProveedores.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-surface text-sm border border-border py-2 px-3 rounded-lg text-foreground focus:border-brand outline-none"
          >
            <option value="">Todos los Estados</option>
            <option value="normal">Normal</option>
            <option value="alerta">Reabastecer</option>
            <option value="critico">Crítico</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-lg text-sm transition-all min-touch-target"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handleNuevoProducto}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-background hover:bg-brand/90 font-semibold rounded-lg text-sm transition-all shadow-lg shadow-brand/10 min-touch-target"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Planilla / Tabla Principal */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider bg-background/40">
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Proveedor (Demora)</th>
                <th className="px-6 py-4 text-right">Consumo Diario</th>
                <th className="px-6 py-4 text-right">Stock Mínimo</th>
                <th className="px-6 py-4 text-right">Punto de Pedido</th>
                <th className="px-6 py-4 text-center">Stock Actual</th>
                <th className="px-6 py-4">Estado / Alerta</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-foreground/40">
                    No se encontraron productos. {listaProveedores.length === 0 && "Primero debés registrar al menos un proveedor."}
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((p) => (
                  <tr
                    key={p.producto_id}
                    className={`hover:bg-surface-hover/20 transition-all ${p.estado === "critico"
                      ? "bg-critical/5 border-l-2 border-l-critical"
                      : p.estado === "alerta"
                        ? "bg-alert/5 border-l-2 border-l-alert"
                        : ""
                      }`}
                  >
                    <td className="px-6 py-4 font-semibold text-foreground">{p.producto_nombre}</td>
                    <td className="px-6 py-4">
                      <span className="text-foreground/90 block font-medium">{p.proveedor_nombre}</span>
                      <span className="text-xs text-foreground/40 block font-mono">({p.dias_demora} días demora)</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium numbers-mono">{p.consumo_diario}</td>
                    <td className="px-6 py-4 text-right font-medium text-foreground/60 numbers-mono">{p.stock_minimo}</td>
                    <td className="px-6 py-4 text-right font-bold text-brand numbers-mono">{p.punto_pedido}</td>

                    {/* Visualizador de Stock Actual con botones rápidos y el botón de movimiento tipeado */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (cargando) return;
                              setCargando(true);
                              await registrarMovimientoStockAction({
                                producto_id: p.producto_id,
                                tipo: "salida",
                                cantidad: 1,
                                proveedor_id: p.proveedor_id
                              });
                              setCargando(false);
                            }}
                            disabled={p.stock_actual <= 0 || cargando}
                            className="w-6 h-6 flex items-center justify-center text-xs font-bold border border-border hover:border-critical hover:text-critical bg-background/50 hover:bg-background rounded transition-all select-none disabled:opacity-30 min-touch-target"
                            title="Descontar 1 unidad (Salida manual)"
                          >
                            -
                          </button>
                          <span className="font-bold text-base font-mono numbers-mono text-foreground w-12 text-center">
                            {p.stock_actual}
                          </span>
                          <button
                            onClick={async () => {
                              if (cargando) return;
                              setCargando(true);
                              await registrarMovimientoStockAction({
                                producto_id: p.producto_id,
                                tipo: "entrada",
                                cantidad: 1,
                                proveedor_id: p.proveedor_id
                              });
                              setCargando(false);
                            }}
                            disabled={cargando}
                            className="w-6 h-6 flex items-center justify-center text-xs font-bold border border-border hover:border-brand hover:text-brand bg-background/50 hover:bg-background rounded transition-all select-none min-touch-target"
                            title="Sumar 1 unidad (Entrada manual)"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setProductoMovimiento(p);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold border border-border hover:border-brand hover:text-brand bg-background/50 hover:bg-background rounded transition-all select-none text-foreground/60 mt-1 min-touch-target"
                        >
                          <Scale className="w-2.5 h-2.5 text-brand" />
                          <span>Exacto</span>
                        </button>
                      </div>
                    </td>

                    {/* Estado Visual */}
                    <td className="px-6 py-4">
                      {p.estado === "critico" && (
                        <div className="inline-flex flex-col gap-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-critical/30 bg-critical/10 text-critical text-xs font-bold w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse" />
                            CRÍTICO
                          </div>
                          <span className="text-xs text-critical/80 font-semibold uppercase tracking-wider block">
                            Stock crítico / Quiebre
                          </span>
                        </div>
                      )}
                      {p.estado === "alerta" && (
                        <div className="inline-flex flex-col gap-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-alert/30 bg-alert/10 text-alert text-xs font-semibold w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-alert animate-pulse" />
                            REABASTECER
                          </div>
                          <span className="text-xs text-alert/90 font-medium">
                            Emitir orden. Tarda {p.dias_demora} días en llegar.
                          </span>
                        </div>
                      )}
                      {p.estado === "normal" && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-brand/30 bg-brand/10 text-brand text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                          NORMAL
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 hover:bg-border rounded text-foreground/60 hover:text-brand transition-all inline-flex min-touch-target"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminar(p.producto_id)}
                        className="p-2 hover:bg-border rounded text-foreground/60 hover:text-critical transition-all inline-flex min-touch-target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Alta/Editar Producto */}
      {mostrarProductoModal && (
        <ProductoModal
          key={editandoId ? `edit-${editandoId}` : "new-product"}
          isOpen={mostrarProductoModal}
          onClose={() => setMostrarProductoModal(false)}
          editandoId={editandoId}
          productoInitial={productoSeleccionado}
          listaProveedores={listaProveedores}
          onCrearProveedorRapido={handleCrearProveedorRapido}
          onGuardar={handleGuardarProducto}
        />
      )}

      {/* Modal Registrar Movimiento */}
      {productoMovimiento && (
        <MovimientoModal
          key={`mov-${productoMovimiento.producto_id}`}
          isOpen={productoMovimiento !== null}
          onClose={() => setProductoMovimiento(null)}
          productoMovimiento={productoMovimiento}
          listaProveedores={listaProveedores}
          onCrearProveedorRapido={handleCrearProveedorRapido}
          onGuardarMovimiento={handleGuardarMovimiento}
        />
      )}
    </div>
  );
}
