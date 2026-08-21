"use client";

import { useState } from "react";
import { Search, Send, Clock, Eye } from "lucide-react";
import { UsuarioTrazabilidad, MovimientoTrazabilidad } from "@/repositories/metricasRepository";

interface TableroTrazabilidadProps {
  trazabilidadUsuarios: UsuarioTrazabilidad[];
  historialMovimientos: MovimientoTrazabilidad[];
}

export default function TableroTrazabilidad({
  trazabilidadUsuarios,
  historialMovimientos,
}: TableroTrazabilidadProps) {
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [filtroUsuarioMovimiento, setFiltroUsuarioMovimiento] = useState<string | null>(null);

  // Filtrar la lista de usuarios de trazabilidad
  const usuariosFiltrados = trazabilidadUsuarios.filter(u => 
    u.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    u.email.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    (u.rubro && u.rubro.toLowerCase().includes(busquedaUsuario.toLowerCase()))
  );

  // Filtrar el historial de movimientos
  const movimientosFiltrados = historialMovimientos.filter(m => {
    if (filtroUsuarioMovimiento) {
      return m.userId === filtroUsuarioMovimiento;
    }
    return true;
  });

  const getWhatsAppLink = (whatsapp: string, nombre: string, rubro?: string) => {
    const texto = `Hola ${nombre}, vimos que registraste tu comercio de rubro "${rubro || "General"}" en Nodexa Mini. ¿Cómo viene tu experiencia previniendo quiebres de stock?`;
    const cleanNum = whatsapp.replace(/\D/g, "");
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div className="space-y-8">
      {/* Sección 1: Trazabilidad de Usuarios */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Trazabilidad General de Usuarios (Métricas PLG)</h3>
            <p className="text-sm text-foreground/50">
              Monitoreá el uso real del sistema de cada usuario, su rubro cargado y su última conexión al sistema.
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Buscar por usuario o rubro..."
              value={busquedaUsuario}
              onChange={(e) => setBusquedaUsuario(e.target.value)}
              className="bg-background text-sm pl-9 pr-3 py-2 rounded-lg border border-border w-full text-foreground outline-none focus:border-brand min-h-[44px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider bg-background/25">
                <th className="px-4 py-3">Usuario / Email</th>
                <th className="px-4 py-3">Rubro</th>
                <th className="px-4 py-3 text-center">Productos</th>
                <th className="px-4 py-3 text-center">Proveedores</th>
                <th className="px-4 py-3 text-center">Movimientos</th>
                <th className="px-4 py-3">Última Conexión</th>
                <th className="px-4 py-3 text-right">Acción Comercial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuariosFiltrados.length === 0 ? (
                <tr key="no-user">
                  <td colSpan={7} className="py-8 text-center text-foreground/40">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u, idx) => (
                  <tr key={u.userId || `u-${idx}`} className="hover:bg-surface-hover/20 transition-all">
                    <td className="px-4 py-3.5">
                      <span className="font-semibold block text-foreground">{u.nombre}</span>
                      <span className="text-xs text-foreground/50 block font-mono">{u.email}</span>
                    </td>
                    <td className="px-4 py-3.5 text-foreground/80">{u.rubro || "No especificado"}</td>
                    <td className="px-4 py-3.5 text-center font-semibold numbers-mono">{u.productosCount}</td>
                    <td className="px-4 py-3.5 text-center font-semibold numbers-mono">{u.proveedoresCount}</td>
                    <td className="px-4 py-3.5 text-center font-semibold numbers-mono">{u.movimientosCount}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-foreground/70 text-xs">
                        <Clock className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
                        <span>{u.lastSignInAt ? new Date(u.lastSignInAt).toLocaleString() : "No disponible"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => setFiltroUsuarioMovimiento(u.userId)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:border-brand hover:text-brand transition-all min-touch-target ${
                          filtroUsuarioMovimiento === u.userId ? "bg-brand/10 border-brand/35 text-brand" : "bg-background"
                        }`}
                        title="Ver Movimientos"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Ver Movimientos</span>
                      </button>

                      {u.whatsapp && (
                        <a
                          href={getWhatsAppLink(u.whatsapp, u.nombre, u.rubro)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-background hover:bg-brand/90 font-bold rounded-lg text-xs tracking-wide transition-all min-touch-target"
                          title="Contactar por WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Outreach</span>
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección 2: Historial General / Auditoría de Movimientos */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Historial de Auditoría de Stock
            </h3>
            <p className="text-sm text-foreground/50">
              Lista detallada y cronológica de todas las entradas y salidas de stock del sistema.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {filtroUsuarioMovimiento && (
              <button
                onClick={() => setFiltroUsuarioMovimiento(null)}
                className="px-3 py-1.5 bg-border hover:bg-border-hover text-foreground/80 rounded-lg text-xs font-bold transition-all min-touch-target"
              >
                Mostrar todos
              </button>
            )}
            <span className="text-xs text-foreground/50">
              {filtroUsuarioMovimiento ? "Mostrando movimientos filtrados" : "Mostrando todos los movimientos"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider bg-background/25">
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Tipo de Operación</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movimientosFiltrados.length === 0 ? (
                <tr key="no-mov">
                  <td colSpan={5} className="py-8 text-center text-foreground/40">
                    No se registraron movimientos en este filtro.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((m, idx) => (
                  <tr key={m.id || `m-${idx}`} className="hover:bg-surface-hover/10 transition-all">
                    <td className="px-4 py-3.5 text-foreground/70 text-xs font-mono">{new Date(m.creadoEn).toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold block text-foreground">{m.userNombre}</span>
                      <span className="text-xs text-foreground/50 block font-mono">{m.userEmail}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-foreground">{m.productoNombre || "Producto eliminado"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {m.tipo === "entrada" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-brand/10 border border-brand/20 text-brand text-xs font-bold">
                          ENTRADA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-critical/10 border border-critical/20 text-critical text-xs font-bold">
                          SALIDA
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-foreground font-mono numbers-mono">{m.cantidad}</td>
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
