"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, ArrowUpRight, ArrowDownRight, Download, Filter, HelpCircle, Loader2 } from "lucide-react";
import { FilaProductoCalculado } from "@/repositories/productosRepository";
import { Proveedor } from "@/repositories/proveedoresRepository";
import { crearProductoAction, actualizarProductoAction, eliminarProductoAction, registrarMovimientoStockAction } from "./productosActions";

interface PlanillaStockClientProps {
  productosIniciales: FilaProductoCalculado[];
  proveedores: Proveedor[];
}

export default function PlanillaStockClient({
  productosIniciales,
  proveedores,
}: PlanillaStockClientProps) {
  // Estados de visualización y filtrado
  const [busqueda, setBusqueda] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Estados de formularios
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [stockActual, setStockActual] = useState<number>(0);
  const [stockMinimo, setStockMinimo] = useState<number>(0);
  const [consumoDiario, setConsumoDiario] = useState<number>(0);
  const [proveedorId, setProveedorId] = useState("");

  // Estados globales de UI
  const [cargando, setCargando] = useState(false);
  const [cargandoStockId, setCargandoStockId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNombre("");
    setStockActual(0);
    setStockMinimo(0);
    setConsumoDiario(0);
    setProveedorId("");
    setEditandoId(null);
    setMostrarForm(false);
    setError(null);
  };

  const handleEdit = (p: FilaProductoCalculado) => {
    setEditandoId(p.producto_id);
    setNombre(p.producto_nombre);
    setStockMinimo(p.stock_minimo);
    setConsumoDiario(p.consumo_diario);
    setProveedorId(p.proveedor_id);
    setMostrarForm(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const payload = {
      nombre,
      stock_actual: stockActual,
      stock_minimo: stockMinimo,
      consumo_diario: consumoDiario,
      proveedor_id: proveedorId,
    };

    let resultado;
    if (editandoId) {
      resultado = await actualizarProductoAction(editandoId, {
        nombre,
        stock_minimo: stockMinimo,
        consumo_diario: consumoDiario,
        proveedor_id: proveedorId,
      });
    } else {
      resultado = await crearProductoAction(payload);
    }

    if (resultado.ok) {
      resetForm();
    } else {
      setError(resultado.error);
    }
    setCargando(false);
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

  // Mutación rápida de stock (+1 o -1)
  const handleAjustarStock = async (productoId: string, tipo: "entrada" | "salida", stockActual: number) => {
    if (tipo === "salida" && stockActual <= 0) return; // Evitar stock negativo
    setCargandoStockId(`${productoId}-${tipo}`);
    
    await registrarMovimientoStockAction({
      producto_id: productoId,
      tipo,
      cantidad: 1,
    });
    
    setCargandoStockId(null);
  };

  // Exportar datos a CSV
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

  // Filtrar productos
  const productosFiltrados = productosIniciales.filter((p) => {
    const matchesBusqueda = p.producto_nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchesProveedor = filtroProveedor ? p.proveedor_id === filtroProveedor : true;
    const matchesEstado = filtroEstado ? p.estado === filtroEstado : true;
    return matchesBusqueda && matchesProveedor && matchesEstado;
  });

  return (
    <div className="space-y-6">
      {/* Caja de alertas / Explicación del sistema */}
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

      {/* Cabecera y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-surface border border-border text-sm py-2 px-3 rounded-lg w-full sm:w-64"
          />

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Filtro Proveedor */}
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="bg-surface border border-border text-sm py-2 px-3 rounded-lg"
            >
              <option value="">Todos los Proveedores</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>

            {/* Filtro Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-surface border border-border text-sm py-2 px-3 rounded-lg"
            >
              <option value="">Todos los Estados</option>
              <option value="normal">Normal (Verde)</option>
              <option value="alerta">Alerta de Pedido (Amarillo)</option>
              <option value="critico">Crítico (Rojo)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-lg text-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setMostrarForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-background hover:bg-brand/90 font-semibold rounded-lg text-sm transition-all shadow-lg shadow-brand/10"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Modal / Sidebar Formulario Producto */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-6 shadow-2xl relative">
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 text-foreground/50 hover:text-foreground inline-flex"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-semibold text-foreground">
              {editandoId ? "Editar Producto" : "Nuevo Producto"}
            </h3>

            {error && (
              <div className="p-3 bg-critical/10 border border-critical/20 rounded-lg text-critical text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/50 uppercase">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Zapatillas Deportivas Run 1.0"
                  className="mt-1 w-full bg-background text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/50 uppercase">Proveedor</label>
                <select
                  required
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  className="mt-1 w-full bg-background text-sm"
                >
                  <option value="">Seleccionar Proveedor...</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.dias_demora} días demora)</option>
                  ))}
                </select>
              </div>

              {!editandoId && (
                <div>
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stockActual}
                    onChange={(e) => setStockActual(Number(e.target.value))}
                    className="mt-1 w-full bg-background text-sm font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Stock Mínimo (Seguridad)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(Number(e.target.value))}
                    className="mt-1 w-full bg-background text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Consumo Diario Estimado</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={consumoDiario}
                    onChange={(e) => setConsumoDiario(Number(e.target.value))}
                    className="mt-1 w-full bg-background text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 px-4 border border-border rounded-lg text-sm text-foreground/80 hover:bg-surface-hover hover:text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg text-sm font-semibold text-background bg-brand hover:bg-brand/90 transition-all disabled:opacity-50"
                >
                  {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    No se encontraron productos. {proveedores.length === 0 && "Primero debés registrar al menos un proveedor."}
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((p) => {
                  const cargandoMas = cargandoStockId === `${p.producto_id}-entrada`;
                  const cargandoMenos = cargandoStockId === `${p.producto_id}-salida`;
                  
                  return (
                    <tr
                      key={p.producto_id}
                      className={`hover:bg-surface-hover/20 transition-all ${
                        p.estado === "critico"
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
                      
                      {/* Controladores Rápidos de Stock */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleAjustarStock(p.producto_id, "salida", p.stock_actual)}
                            disabled={p.stock_actual <= 0 || cargandoMenos || cargandoMas}
                            className="w-7 h-7 flex items-center justify-center border border-border hover:border-critical hover:text-critical disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground bg-background rounded-md transition-all select-none font-bold"
                          >
                            {cargandoMenos ? <Loader2 className="w-3 h-3 animate-spin" /> : "-"}
                          </button>
                          <span className="w-12 text-center font-bold text-base font-mono numbers-mono text-foreground">
                            {p.stock_actual}
                          </span>
                          <button
                            onClick={() => handleAjustarStock(p.producto_id, "entrada", p.stock_actual)}
                            disabled={cargandoMenos || cargandoMas}
                            className="w-7 h-7 flex items-center justify-center border border-border hover:border-brand hover:text-brand bg-background rounded-md transition-all select-none font-bold"
                          >
                            {cargandoMas ? <Loader2 className="w-3 h-3 animate-spin" /> : "+"}
                          </button>
                        </div>
                      </td>

                      {/* Estado Visual */}
                      <td className="px-6 py-4">
                        {p.estado === "critico" && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-critical/30 bg-critical/10 text-critical text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-critical animate-pulse" />
                            CRÍTICO
                          </div>
                        )}
                        {p.estado === "alerta" && (
                          <div className="inline-flex flex-col gap-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-alert/30 bg-alert/10 text-alert text-xs font-semibold w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-alert animate-pulse" />
                              REABASTECER
                            </div>
                            <span className="text-[10px] text-alert/80 font-medium">
                              Emitir orden al proveedor
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
                          className="p-2 hover:bg-border rounded text-foreground/60 hover:text-brand transition-all inline-flex"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(p.producto_id)}
                          className="p-2 hover:bg-border rounded text-foreground/60 hover:text-critical transition-all inline-flex"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
