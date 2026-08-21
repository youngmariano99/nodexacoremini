"use client";

import { useState } from "react";
import { Play, RotateCcw, ShieldCheck, Plus, Check, EyeOff, Eye, Loader2, MessageSquarePlus, Phone, User, Store, AlertTriangle, Edit2, X, Save, TrendingUp, Activity } from "lucide-react";
import { OpcionOnboarding } from "@/repositories/onboardingRepository";
import { MetricasPruebaSocial, MetricaDolor, PowerUser, UsuarioTrazabilidad, MovimientoTrazabilidad } from "@/repositories/metricasRepository";
import {
  sembrarDatosSimulacionAction,
  resetearDatosAction,
  simularQuiebreEvitadoAction,
  crearOpcionOnboardingAction,
  toggleOpcionOnboardingAction,
  actualizarOpcionOnboardingAction,
  actualizarWhatsAppAdminAction
} from "./adminActions";

interface AdminPanelClientProps {
  opcionesOnboarding: (OpcionOnboarding & { activo: boolean })[];
  metricasSociales: MetricasPruebaSocial;
  mapaDolores: MetricaDolor[];
  powerUsers: PowerUser[];
  adminWhatsApp: string;
  trazabilidadUsuarios: UsuarioTrazabilidad[];
  historialMovimientos: MovimientoTrazabilidad[];
}

export default function AdminPanelClient({
  opcionesOnboarding,
  metricasSociales,
  mapaDolores,
  powerUsers,
  adminWhatsApp,
  trazabilidadUsuarios,
  historialMovimientos,
}: AdminPanelClientProps) {
  const [nuevaOpcion, setNuevaOpcion] = useState("");
  const [cargandoAccion, setCargandoAccion] = useState<string | null>(null);
  const [resultadoMsg, setResultadoMsg] = useState<{ texto: string; error?: boolean } | null>(null);

  // Estados para la edición de opciones
  const [editandoOpcId, setEditandoOpcId] = useState<string | null>(null);
  const [editandoOpcTexto, setEditandoOpcTexto] = useState("");

  // Estado para WhatsApp
  const [supportWhatsApp, setSupportWhatsApp] = useState(adminWhatsApp);
  const [guardandoWhatsApp, setGuardandoWhatsApp] = useState(false);

  // Estados de Trazabilidad
  const [pestanaActiva, setPestanaActiva] = useState<"dashboard" | "trazabilidad">("dashboard");
  const [filtroUsuario, setFiltroUsuario] = useState<string>("todos");
  const [buscarUsuario, setBuscarUsuario] = useState<string>("");

  // Filtrado de usuarios
  const usuariosFiltrados = trazabilidadUsuarios.filter((u) => {
    const keyword = buscarUsuario.toLowerCase().trim();
    if (!keyword) return true;
    return u.nombre.toLowerCase().includes(keyword) || u.email.toLowerCase().includes(keyword);
  });

  // Filtrado de movimientos
  const movimientosFiltrados = historialMovimientos.filter((m) => {
    if (filtroUsuario === "todos") return true;
    return m.userId === filtroUsuario;
  });

  const handleSimulacion = async (key: string, fn: () => Promise<any>) => {
    setCargandoAccion(key);
    setResultadoMsg(null);
    const res = await fn();
    if (res.ok) {
      setResultadoMsg({ texto: res.data || "Operación realizada con éxito" });
    } else {
      setResultadoMsg({ texto: res.error || "Ocurrió un error", error: true });
    }
    setCargandoAccion(null);
  };

  const handleCrearOpcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaOpcion.trim()) return;
    setCargandoAccion("crear_opcion");
    const res = await crearOpcionOnboardingAction(nuevaOpcion);
    if (res.ok) {
      setNuevaOpcion("");
      setResultadoMsg({ texto: "Opción agregada al catálogo de onboarding" });
    } else {
      setResultadoMsg({ texto: res.error, error: true });
    }
    setCargandoAccion(null);
  };

  const handleToggleOpcion = async (id: string, activoActual: boolean) => {
    setCargandoAccion(`toggle_${id}`);
    const res = await toggleOpcionOnboardingAction(id, !activoActual);
    if (!res.ok) {
      setResultadoMsg({ texto: res.error, error: true });
    }
    setCargandoAccion(null);
  };

  const handleGuardarOpcionEditada = async (id: string) => {
    if (!editandoOpcTexto.trim()) return;
    setCargandoAccion(`edit_${id}`);
    const res = await actualizarOpcionOnboardingAction(id, editandoOpcTexto);
    if (res.ok) {
      setEditandoOpcId(null);
      setResultadoMsg({ texto: "Texto de la opción actualizado correctamente" });
    } else {
      setResultadoMsg({ texto: res.error, error: true });
    }
    setCargandoAccion(null);
  };

  const handleGuardarWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoWhatsApp(true);
    setResultadoMsg(null);
    const res = await actualizarWhatsAppAdminAction(supportWhatsApp);
    if (res.ok) {
      setResultadoMsg({ texto: res.data || "WhatsApp de soporte actualizado" });
    } else {
      setResultadoMsg({ texto: res.error || "Error al actualizar", error: true });
    }
    setGuardandoWhatsApp(false);
  };

  return (
    <div className="space-y-8">
      {/* Sistema de Solapas (Tabs) */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setPestanaActiva("dashboard")}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            pestanaActiva === "dashboard"
              ? "border-brand text-brand"
              : "border-transparent text-foreground/50 hover:text-foreground"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard y Configuración</span>
        </button>
        <button
          onClick={() => setPestanaActiva("trazabilidad")}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            pestanaActiva === "trazabilidad"
              ? "border-brand text-brand"
              : "border-transparent text-foreground/50 hover:text-foreground"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Trazabilidad de Usuarios</span>
        </button>
      </div>

      {/* Mensaje de Estado / Feedback */}
      {resultadoMsg && (
        <div className={`p-4 rounded-xl border text-sm ${resultadoMsg.error
            ? "bg-critical/10 border-critical/20 text-critical"
            : "bg-brand/10 border-brand/20 text-brand"
          }`}>
          {resultadoMsg.texto}
        </div>
      )}

      {pestanaActiva === "dashboard" && (
        <>

      {/* 1. SECCIÓN DE OPERACIONES MOCK & SIMULACIONES */}
      <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Centro de Control de Simulación (TikTok / Reels Ready)</h3>
          <p className="text-xs text-foreground/50">
            Usá estos controles rápidos para poblar tu cuenta de prueba con datos simulados interesantes y hacer demostraciones en video.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Sembrar Datos */}
          <button
            onClick={() => handleSimulacion("sembrar", sembrarDatosSimulacionAction)}
            disabled={cargandoAccion !== null}
            className="flex items-center justify-center gap-3 p-4 bg-brand/10 hover:bg-brand/20 border border-brand/30 hover:border-brand/40 text-brand rounded-xl font-semibold text-sm transition-all disabled:opacity-50 text-center"
          >
            {cargandoAccion === "sembrar" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            <div className="text-left">
              <span className="block font-bold">Sembrar Datos de Demo</span>
              <span className="block text-[10px] font-normal opacity-75">3 provs, 6 prods y 12 movs</span>
            </div>
          </button>

          {/* Simular Quiebre Evitado */}
          <button
            onClick={() => handleSimulacion("quiebre", simularQuiebreEvitadoAction)}
            disabled={cargandoAccion !== null}
            className="flex items-center justify-center gap-3 p-4 bg-surface hover:bg-surface-hover border border-border rounded-xl text-foreground font-semibold text-sm transition-all disabled:opacity-50 text-center"
          >
            {cargandoAccion === "quiebre" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-brand" />
            )}
            <div className="text-left">
              <span className="block font-bold">Simular Reposición Rápida</span>
              <span className="block text-[10px] font-normal text-foreground/50">Evita un quiebre de stock (+15 min)</span>
            </div>
          </button>

          {/* Resetear Base de Datos */}
          <button
            onClick={() => handleSimulacion("resetear", resetearDatosAction)}
            disabled={cargandoAccion !== null}
            className="flex items-center justify-center gap-3 p-4 bg-critical/5 hover:bg-critical/10 border border-critical/20 hover:border-critical/30 text-critical rounded-xl font-semibold text-sm transition-all disabled:opacity-50 text-center"
          >
            {cargandoAccion === "resetear" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RotateCcw className="w-5 h-5" />
            )}
            <div className="text-left">
              <span className="block font-bold">Limpiar Base de Datos</span>
              <span className="block text-[10px] font-normal opacity-75">Borra tus proveedores y productos</span>
            </div>
          </button>
        </div>
      </section>

      {/* 2. TABLERO DE MÉTRICAS PLG (EXCLUSIVO ADMIN) */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">Tablero de Trazabilidad PLG</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">Quiebres Evitados</span>
            <span className="text-4xl font-extrabold text-brand block mt-2 numbers-mono">{metricasSociales.quiebresEvitados}</span>
          </div>
          <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">Horas Ahorradas PyMEs</span>
            <span className="text-4xl font-extrabold text-brand block mt-2 numbers-mono">{metricasSociales.horasAhorradas}h</span>
          </div>
          <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">Movimientos Totales</span>
            <span className="text-4xl font-extrabold text-foreground block mt-2 numbers-mono">{metricasSociales.totalMovimientos}</span>
          </div>
          <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider block">Productos Totales</span>
            <span className="text-4xl font-extrabold text-foreground block mt-2 numbers-mono">{metricasSociales.totalProductos}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mapa de dolores */}
          <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <AlertTriangle className="w-4 h-4 text-alert" />
              Dolores Detectados
            </h4>
            <div className="space-y-4">
              {mapaDolores.length === 0 ? (
                <p key="no-dolores" className="text-xs text-foreground/40 text-center py-4">Sin datos de dolor.</p>
              ) : (
                mapaDolores.map((dolor, idx) => (
                  <div key={`dolor-${idx}-${dolor.problemaTexto}`} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-foreground">
                      <span className="truncate max-w-[200px]" title={dolor.problemaTexto}>{dolor.problemaTexto}</span>
                      <span className="numbers-mono font-bold">{dolor.cantidad}</span>
                    </div>
                    <div className="w-full h-1 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand"
                        style={{ width: `${Math.min(100, (dolor.cantidad / Math.max(1, ...mapaDolores.map(d => d.cantidad))) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Power Users */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <User className="w-4 h-4 text-brand" />
              Power Users (WhatsApp Outreach)
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-xs">
                <thead>
                  <tr className="text-left text-foreground/50 font-semibold uppercase">
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Rubro</th>
                    <th className="pb-3">WhatsApp</th>
                    <th className="pb-3 text-right">Movimientos</th>
                    <th className="pb-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {powerUsers.length === 0 ? (
                    <tr key="no-power-users">
                      <td colSpan={5} className="py-4 text-center text-foreground/45">No hay movimientos.</td>
                    </tr>
                  ) : (
                    powerUsers.map((u, idx) => (
                      <tr key={u.userId || `user-${idx}`}>
                        <td className="py-2.5 font-medium">{u.nombre}</td>
                        <td className="py-2.5">{u.rubro}</td>
                        <td className="py-2.5 font-mono">{u.whatsapp}</td>
                        <td className="py-2.5 text-right font-bold text-brand numbers-mono">{u.movimientosCount}</td>
                        <td className="py-2.5 text-right">
                          <a
                            href={`https://wa.me/${u.whatsapp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-brand text-background hover:bg-brand/90 font-bold rounded"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Outreach</span>
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CRUD DE PREGUNTAS DE ONBOARDING */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 h-fit space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-brand" />
            Nueva Pregunta de Onboarding
          </h3>
          <form onSubmit={handleCrearOpcion} className="space-y-4">
            <div>
              <label htmlFor="textoPregunta" className="block text-xs font-semibold text-foreground/50 uppercase">Texto de la Opción</label>
              <textarea
                id="textoPregunta"
                required
                rows={2}
                value={nuevaOpcion}
                onChange={(e) => setNuevaOpcion(e.target.value)}
                placeholder="Ej: Pierdo mucho tiempo revisando qué stock tengo"
                className="mt-1 w-full bg-background text-sm resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={cargandoAccion === "crear_opcion"}
              className="w-full py-2 bg-brand text-background hover:bg-brand/90 font-semibold rounded-lg text-sm flex justify-center items-center gap-2 disabled:opacity-50"
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

        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Catálogo de Opciones (Preguntas de Registro)</h3>
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
                                className="bg-background text-sm py-1.5 px-3 rounded border border-border flex-1 focus:border-brand outline-none"
                              />
                              <button
                                onClick={() => handleGuardarOpcionEditada(opc.id)}
                                disabled={cargandoEdit || !editandoOpcTexto.trim()}
                                className="p-1.5 text-brand hover:bg-brand/10 rounded transition-all"
                                title="Guardar"
                              >
                                {cargandoEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => setEditandoOpcId(null)}
                                disabled={cargandoEdit}
                                className="p-1.5 text-foreground/40 hover:bg-surface-hover rounded transition-all"
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
                                className="p-1 text-brand hover:bg-brand/10 rounded transition-all shrink-0"
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
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-all ${opc.activo
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

      {/* 4. CONFIGURACIÓN DE WHATSAPP DEL ADMINISTRADOR */}
      <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Phone className="w-5 h-5 text-brand" />
            Configuración de WhatsApp de Soporte / Venta
          </h3>
          <p className="text-xs text-foreground/50">
            Definí el número de WhatsApp al cual redirigir a los usuarios del plan gratuito cuando hagan clic en el botón &quot;[Probar Nodexa Core]&quot;.
          </p>
        </div>

        <form onSubmit={handleGuardarWhatsApp} className="max-w-md space-y-3 pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: 5491122334455 (código de país sin símbolos)"
              value={supportWhatsApp}
              onChange={(e) => setSupportWhatsApp(e.target.value)}
              className="bg-background text-sm py-2 px-3 rounded-lg border border-border flex-1 font-mono text-foreground outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={guardandoWhatsApp}
              className="px-4 py-2 bg-brand text-background hover:bg-brand/90 font-semibold rounded-lg text-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {guardandoWhatsApp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
          <span className="block text-[10px] text-foreground/45">
            Nota: Recordá ingresar el código de país (ej. 54 para Argentina) seguido del número completo, sin &quot;+&quot; ni espacios.
          </span>
        </form>
      </section>
        </>
      )}

      {pestanaActiva === "trazabilidad" && (
        <div className="space-y-8">
          {/* SECCIÓN 1: MÉTRICAS Y LISTADO DE USUARIOS */}
          <section className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Métricas por Usuario (PLG)</h3>
                <p className="text-xs text-foreground/50 mt-0.5">
                  Conteo de productos creados, proveedores registrados, total de movimientos y última conexión.
                </p>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={buscarUsuario}
                onChange={(e) => setBuscarUsuario(e.target.value)}
                className="bg-background text-sm py-2 px-3 rounded-lg border border-border w-full md:w-64 font-medium text-foreground outline-none focus:border-brand"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider bg-background/20">
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Rubro / Registro</th>
                    <th className="px-6 py-4 text-center">Productos</th>
                    <th className="px-6 py-4 text-center">Proveedores</th>
                    <th className="px-6 py-4 text-center">Movimientos</th>
                    <th className="px-6 py-4 text-center">Última Conexión</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usuariosFiltrados.length === 0 ? (
                    <tr key="no-usuarios-trazabilidad">
                      <td colSpan={7} className="py-8 text-center text-foreground/40">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => {
                      const ultimaCon = u.lastSignInAt
                        ? new Date(u.lastSignInAt).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "No disponible (Clave API faltante)";

                      const fechaReg = new Date(u.creadoEn).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });

                      return (
                        <tr key={u.userId} className="hover:bg-surface-hover/20 transition-all text-sm">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">{u.nombre}</div>
                            <div className="text-xs text-foreground/50">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-foreground/90 font-medium">{u.rubro}</div>
                            <div className="text-xs text-foreground/40">Registrado: {fechaReg}</div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold font-mono numbers-mono text-foreground/80">
                            {u.productosCount}
                          </td>
                          <td className="px-6 py-4 text-center font-bold font-mono numbers-mono text-foreground/80">
                            {u.proveedoresCount}
                          </td>
                          <td className="px-6 py-4 text-center font-bold font-mono numbers-mono text-brand">
                            {u.movimientosCount}
                          </td>
                          <td className="px-6 py-4 text-center text-xs font-mono text-foreground/60">
                            {ultimaCon}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setFiltroUsuario(u.userId);
                                const section = document.getElementById("historial-general-trazabilidad");
                                if (section) section.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-3 py-1.5 bg-brand/10 border border-brand/20 hover:border-brand/40 text-brand text-xs font-semibold rounded-lg transition-all"
                            >
                              Ver Movimientos
                            </button>
                            <a
                              href={`https://wa.me/${u.whatsapp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-background hover:bg-brand/90 text-xs font-bold rounded-lg transition-all"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Contacto</span>
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECCIÓN 2: HISTORIAL GENERAL DE MOVIMIENTOS */}
          <section id="historial-general-trazabilidad" className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Auditoría / Historial de Movimientos</h3>
                <p className="text-xs text-foreground/50 mt-0.5">
                  Trazabilidad general de todas las entradas y salidas de stock del sistema.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground/50 font-semibold uppercase tracking-wider shrink-0">Filtrar por:</span>
                <select
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                  className="bg-background text-sm py-2 px-3 rounded-lg border border-border font-medium text-foreground outline-none focus:border-brand"
                >
                  <option value="todos">Todos los usuarios</option>
                  {trazabilidadUsuarios.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.nombre} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider bg-background/20">
                    <th className="px-6 py-4">Fecha / Hora</th>
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Producto</th>
                    <th className="px-6 py-4 text-center">Tipo</th>
                    <th className="px-6 py-4 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movimientosFiltrados.length === 0 ? (
                    <tr key="no-movimientos-trazabilidad">
                      <td colSpan={5} className="py-8 text-center text-foreground/40">
                        No hay movimientos registrados para este criterio.
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((m) => {
                      const fechaMov = new Date(m.creadoEn).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      });

                      return (
                        <tr key={m.id} className="hover:bg-surface-hover/20 transition-all text-sm">
                          <td className="px-6 py-4 font-mono text-xs text-foreground/60">{fechaMov}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">{m.userNombre}</div>
                            <div className="text-xs text-foreground/50">{m.userEmail}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">{m.productoNombre}</td>
                          <td className="px-6 py-4 text-center">
                            {m.tipo === "entrada" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-brand/30 bg-brand/10 text-brand text-xs font-bold">
                                Entrada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-critical/30 bg-critical/10 text-critical text-xs font-bold">
                                Salida
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-bold font-mono numbers-mono text-foreground">
                            {m.cantidad}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
