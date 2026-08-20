"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Download, HelpCircle, Loader2, ArrowRight, ShieldCheck, Scale, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { FilaProductoCalculado } from "@/repositories/productosRepository";
import { Proveedor } from "@/repositories/proveedoresRepository";
import { crearProductoAction, actualizarProductoAction, eliminarProductoAction, registrarMovimientoStockAction } from "./productosActions";
import { crearProveedorAction } from "./proveedores/proveedoresActions";
import Link from "next/link";

interface PlanillaStockClientProps {
  productosIniciales: FilaProductoCalculado[];
  proveedores: Proveedor[];
}

export default function PlanillaStockClient({
  productosIniciales,
  proveedores: proveedoresIniciales,
}: PlanillaStockClientProps) {
  // Manejo de lista local de proveedores para permitir agregados rápidos sin refrescar
  const [listaProveedores, setListaProveedores] = useState<Proveedor[]>(proveedoresIniciales);

  // Estados de visualización y filtrado
  const [busqueda, setBusqueda] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Estados de formulario de Producto
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [stockActual, setStockActual] = useState<number>(0);
  const [stockMinimo, setStockMinimo] = useState<number>(0);
  const [consumoDiario, setConsumoDiario] = useState<number>(0);
  const [proveedorId, setProveedorId] = useState("");

  // Creador rápido de proveedor
  const [mostrandoFormProv, setMostrandoFormProv] = useState(false);
  const [nuevoProvNombre, setNuevoProvNombre] = useState("");
  const [nuevoProvDemora, setNuevoProvDemora] = useState<number>(3);
  const [cargandoProv, setCargandoProv] = useState(false);

  // Estados del modal de Movimiento de Stock
  const [productoMovimiento, setProductoMovimiento] = useState<FilaProductoCalculado | null>(null);
  const [movTipo, setMovTipo] = useState<"entrada" | "salida">("entrada");
  const [movCantidad, setMovCantidad] = useState<number>(1);
  const [movProveedorId, setMovProveedorId] = useState("");
  const [cargandoMov, setCargandoMov] = useState(false);

  // Estados globales de UI
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNombre("");
    setStockActual(0);
    setStockMinimo(0);
    setConsumoDiario(0);
    setProveedorId("");
    setEditandoId(null);
    setMostrarForm(false);
    setMostrandoFormProv(false);
    setNuevoProvNombre("");
    setNuevoProvDemora(3);
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

  // Creación rápida de Proveedor dentro del formulario
  const handleCrearProveedorRapido = async (contexto: "producto" | "movimiento" = "producto") => {
    if (!nuevoProvNombre.trim()) return;
    setCargandoProv(true);
    const res = await crearProveedorAction({
      nombre: nuevoProvNombre,
      dias_demora: nuevoProvDemora,
    });

    if (res.ok) {
      // Agregar el nuevo proveedor creado a la lista local
      setListaProveedores(prev => [...prev, res.data]);
      // Vincularlo automáticamente al selector correspondiente
      if (contexto === "movimiento") {
        setMovProveedorId(res.data.id);
      } else {
        setProveedorId(res.data.id);
      }
      // Resetear subformulario
      setNuevoProvNombre("");
      setNuevoProvDemora(3);
      setMostrandoFormProv(false);
    } else {
      alert("Error al crear proveedor: " + (res.error || ""));
    }
    setCargandoProv(false);
  };

  const cerrarMovimientoModal = () => {
    setProductoMovimiento(null);
    setMovCantidad(1);
    setMovProveedorId("");
    setMostrandoFormProv(false);
    setNuevoProvNombre("");
    setNuevoProvDemora(3);
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

  // Guardar un movimiento específico tipeado
  const handleGuardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoMovimiento) return;
    setCargandoMov(true);

    const res = await registrarMovimientoStockAction({
      producto_id: productoMovimiento.producto_id,
      tipo: movTipo,
      cantidad: movCantidad,
      proveedor_id: movProveedorId || null,
    });

    if (res.ok) {
      cerrarMovimientoModal();
    } else {
      alert("Error al registrar movimiento: " + res.error);
    }
    setCargandoMov(false);
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
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-background hover:bg-brand/90 font-bold rounded-lg text-xs tracking-wide transition-all shrink-0"
        >
          <span>Ir al Panel Admin</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

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
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="bg-surface border border-border text-sm py-2 px-3 rounded-lg"
            >
              <option value="">Todos los Proveedores</option>
              {listaProveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>

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

      {/* Modal Formulario Producto */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-5 shadow-2xl relative">
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
                  placeholder="Ej: Harina Integran 1kg"
                  className="mt-1.5 w-full bg-background text-sm"
                />
              </div>

              {/* Selector de Proveedor + Creador rápido */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Proveedor</label>
                  <button
                    type="button"
                    onClick={() => setMostrandoFormProv(!mostrandoFormProv)}
                    className="text-xs text-brand hover:underline font-semibold"
                  >
                    {mostrandoFormProv ? "- Cancelar" : "+ Crear Proveedor Rápido"}
                  </button>
                </div>

                {mostrandoFormProv ? (
                  <div className="p-3 bg-background border border-border rounded-lg space-y-3">
                    <span className="block text-xs font-bold text-foreground/70">Dar de alta proveedor:</span>
                    <input
                      type="text"
                      placeholder="Nombre del Proveedor"
                      value={nuevoProvNombre}
                      onChange={(e) => setNuevoProvNombre(e.target.value)}
                      className="w-full text-xs py-1.5 px-2.5 bg-surface border border-border rounded"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-foreground/50 uppercase shrink-0">Demora (días):</label>
                      <input
                        type="number"
                        min={0}
                        value={nuevoProvDemora}
                        onChange={(e) => setNuevoProvDemora(Number(e.target.value))}
                        className="w-16 text-xs py-1 px-2 bg-surface border border-border rounded numbers-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleCrearProveedorRapido("producto")}
                        disabled={cargandoProv || !nuevoProvNombre.trim()}
                        className="ml-auto py-1 px-3 bg-brand text-background text-xs font-bold rounded flex items-center gap-1 disabled:opacity-50"
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
                    className="mt-1 w-full bg-background text-sm"
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
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stockActual}
                    onChange={(e) => setStockActual(Number(e.target.value))}
                    className="mt-1.5 w-full bg-background text-sm font-mono"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(Number(e.target.value))}
                    className="mt-1.5 w-full bg-background text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Consumo Diario</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={consumoDiario}
                    onChange={(e) => setConsumoDiario(Number(e.target.value))}
                    className="mt-1.5 w-full bg-background text-sm font-mono"
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

      {/* Modal para Registrar Movimiento de Stock con Cantidad e Input exacto */}
      {productoMovimiento && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
            <button
              onClick={cerrarMovimientoModal}
              className="absolute top-4 right-4 text-foreground/50 hover:text-foreground inline-flex"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-foreground">
              Registrar Movimiento de Stock
            </h3>
            <p className="text-xs text-foreground/50">
              Registrá una entrada o salida exacta sobre el producto: <strong className="text-foreground">{productoMovimiento.producto_nombre}</strong>.
            </p>

            <form onSubmit={handleGuardarMovimiento} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                {/* Tipo de Movimiento */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Tipo</label>
                  <select
                    value={movTipo}
                    onChange={(e) => setMovTipo(e.target.value as "entrada" | "salida")}
                    className="mt-1.5 w-full bg-background text-sm"
                  >
                    <option value="entrada">Entrada (+)</option>
                    <option value="salida">Salida (-)</option>
                  </select>
                </div>
                {/* Cantidad Exacta */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Cantidad</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={movCantidad}
                    onChange={(e) => setMovCantidad(Number(e.target.value))}
                    className="mt-1.5 w-full bg-background text-sm font-mono numbers-mono"
                  />
                </div>
              </div>

              {/* Proveedor de Origen con creación rápida */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-foreground/50 uppercase">Proveedor de Origen / Destino</label>
                  <button
                    type="button"
                    onClick={() => setMostrandoFormProv(!mostrandoFormProv)}
                    className="text-xs text-brand hover:underline font-semibold"
                  >
                    {mostrandoFormProv ? "- Cancelar" : "+ Crear Proveedor Rápido"}
                  </button>
                </div>

                {mostrandoFormProv ? (
                  <div className="p-3 bg-background border border-border rounded-lg space-y-3">
                    <span className="block text-xs font-bold text-foreground/70">Dar de alta proveedor:</span>
                    <input
                      type="text"
                      placeholder="Nombre del Proveedor"
                      value={nuevoProvNombre}
                      onChange={(e) => setNuevoProvNombre(e.target.value)}
                      className="w-full text-xs py-1.5 px-2.5 bg-surface border border-border rounded"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-foreground/50 uppercase shrink-0">Demora (días):</label>
                      <input
                        type="number"
                        min={0}
                        value={nuevoProvDemora}
                        onChange={(e) => setNuevoProvDemora(Number(e.target.value))}
                        className="w-16 text-xs py-1 px-2 bg-surface border border-border rounded numbers-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleCrearProveedorRapido("movimiento")}
                        disabled={cargandoProv || !nuevoProvNombre.trim()}
                        className="ml-auto py-1 px-3 bg-brand text-background text-xs font-bold rounded flex items-center gap-1 disabled:opacity-50"
                      >
                        {cargandoProv ? <Loader2 className="w-3 h-3 animate-spin" /> : "Crear"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={movProveedorId}
                    onChange={(e) => setMovProveedorId(e.target.value)}
                    className="mt-1.5 w-full bg-background text-sm"
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
                  onClick={cerrarMovimientoModal}
                  className="flex-1 py-2 px-4 border border-border rounded-lg text-sm text-foreground/85 hover:bg-surface-hover transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargandoMov}
                  className="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-lg text-sm font-semibold text-background bg-brand hover:bg-brand/90 transition-all disabled:opacity-50"
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

                    {/* Visualizador de Stock Actual con el nuevo botón de movimiento tipeado */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-bold text-base font-mono numbers-mono text-foreground">
                          {p.stock_actual}
                        </span>
                        <button
                          onClick={() => {
                            setProductoMovimiento(p);
                            setMovCantidad(1);
                            // Preseleccionar proveedor por defecto
                            setMovProveedorId(p.proveedor_id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-border hover:border-brand hover:text-brand bg-background/50 hover:bg-background rounded transition-all select-none text-foreground/70"
                        >
                          <Scale className="w-3 h-3 text-brand" />
                          <span>Movimiento</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
