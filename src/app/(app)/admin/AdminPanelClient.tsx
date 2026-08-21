"use client";

import { useState } from "react";
import { TrendingUp, Activity, AlertTriangle, Check, Phone, User } from "lucide-react";
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

import ControlesSimulacion from "./components/ControlesSimulacion";
import ConfiguracionWhatsApp from "./components/ConfiguracionWhatsApp";
import CatalogoPreguntas from "./components/CatalogoPreguntas";
import TableroTrazabilidad from "./components/TableroTrazabilidad";

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
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 min-touch-target ${
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
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 min-touch-target ${
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
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-2.5 ${resultadoMsg.error
            ? "bg-critical/10 border-critical/20 text-critical"
            : "bg-brand/10 border-brand/20 text-brand"
          }`}>
          {resultadoMsg.error ? (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          ) : (
            <Check className="w-5 h-5 shrink-0" />
          )}
          <span>{resultadoMsg.texto}</span>
        </div>
      )}

      {pestanaActiva === "dashboard" && (
        <>
          {/* 1. SECCIÓN DE OPERACIONES MOCK & SIMULACIONES */}
          <ControlesSimulacion
            cargandoAccion={cargandoAccion}
            onSimulacion={handleSimulacion}
            sembrarDatosSimulacionAction={sembrarDatosSimulacionAction}
            simularQuiebreEvitadoAction={simularQuiebreEvitadoAction}
            resetearDatosAction={resetearDatosAction}
          />

          {/* 2. TABLERO DE MÉTRICAS PLG (EXCLUSIVO ADMIN) */}
          <section className="space-y-6">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">Tablero de Trazabilidad PLG</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider block">Quiebres Evitados</span>
                <span className="text-4xl font-extrabold text-brand block mt-2 numbers-mono">{metricasSociales.quiebresEvitados}</span>
              </div>
              <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider block">Horas Ahorradas PyMEs</span>
                <span className="text-4xl font-extrabold text-brand block mt-2 numbers-mono">{metricasSociales.horasAhorradas}h</span>
              </div>
              <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider block">Movimientos Totales</span>
                <span className="text-4xl font-extrabold text-foreground block mt-2 numbers-mono">{metricasSociales.totalMovimientos}</span>
              </div>
              <div className="bg-surface border border-border p-6 rounded-xl relative overflow-hidden">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider block">Productos Totales</span>
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
                    <p key="no-dolores" className="text-sm text-foreground/40 text-center py-4">Sin datos de dolor.</p>
                  ) : (
                    mapaDolores.map((dolor, idx) => (
                      <div key={`dolor-${idx}-${dolor.problemaTexto}`} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm text-foreground">
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
                  <table className="min-w-full divide-y divide-border text-sm">
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
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand text-background hover:bg-brand/90 font-bold rounded min-touch-target text-sm min-h-[44px]"
                              >
                                <Phone className="w-3.5 h-3.5" />
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
          <CatalogoPreguntas
            opcionesOnboarding={opcionesOnboarding}
            nuevaOpcion={nuevaOpcion}
            setNuevaOpcion={setNuevaOpcion}
            cargandoAccion={cargandoAccion}
            editandoOpcId={editandoOpcId}
            setEditandoOpcId={setEditandoOpcId}
            editandoOpcTexto={editandoOpcTexto}
            setEditandoOpcTexto={setEditandoOpcTexto}
            handleCrearOpcion={handleCrearOpcion}
            handleToggleOpcion={handleToggleOpcion}
            handleGuardarOpcionEditada={handleGuardarOpcionEditada}
          />

          {/* 4. CONFIGURACIÓN WHATSAPP SOPORTE */}
          <ConfiguracionWhatsApp
            supportWhatsApp={supportWhatsApp}
            setSupportWhatsApp={setSupportWhatsApp}
            guardandoWhatsApp={guardandoWhatsApp}
            onGuardarWhatsApp={handleGuardarWhatsApp}
          />
        </>
      )}

      {pestanaActiva === "trazabilidad" && (
        <TableroTrazabilidad
          trazabilidadUsuarios={trazabilidadUsuarios}
          historialMovimientos={historialMovimientos}
        />
      )}
    </div>
  );
}
