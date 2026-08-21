"use client";

import { useState } from "react";
import { Search, ShieldAlert, X, Terminal, Calendar, User, Key } from "lucide-react";
import { ErrorLog } from "@/repositories/metricasRepository";

interface TableroLogsProps {
  errorLogs: ErrorLog[];
}

export default function TableroLogs({ errorLogs }: TableroLogsProps) {
  const [busqueda, setBusqueda] = useState("");
  const [logSeleccionado, setLogSeleccionado] = useState<ErrorLog | null>(null);

  // Filtrar logs
  const logsFiltrados = errorLogs.filter(log => 
    log.codigoError.toLowerCase().includes(busqueda.toLowerCase()) ||
    log.mensaje.toLowerCase().includes(busqueda.toLowerCase()) ||
    (log.email && log.email.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-critical" />
              Auditoría de Logs de Errores y Excepciones
            </h3>
            <p className="text-sm text-foreground/50">
              Visualizá e investigá las excepciones y errores capturados del lado del servidor.
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Buscar por código, mensaje o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-background text-sm pl-9 pr-3 py-2 rounded-lg border border-border w-full text-foreground outline-none focus:border-brand min-h-[44px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider bg-background/25">
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Usuario / Email</th>
                <th className="px-4 py-3">Mensaje del Error</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logsFiltrados.length === 0 ? (
                <tr key="no-logs">
                  <td colSpan={5} className="py-8 text-center text-foreground/40">
                    No se encontraron logs registrados.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-hover/10 transition-all text-sm">
                    <td className="px-4 py-3.5 text-foreground/60 text-xs font-mono">
                      {new Date(log.creadoEn).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-critical/10 border border-critical/20 text-critical text-xs font-bold font-mono">
                        {log.codigoError}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-foreground/80">
                      {log.email ? (
                        <span className="font-mono text-xs">{log.email}</span>
                      ) : (
                        <span className="text-foreground/40 italic">Anónimo / Sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-foreground/90 font-medium truncate max-w-xs" title={log.mensaje}>
                      {log.mensaje}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setLogSeleccionado(log)}
                        className="px-3 py-1.5 border border-border hover:border-brand bg-background hover:bg-background/90 text-xs font-bold rounded-lg transition-all min-touch-target"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Overlay de Detalle de Log */}
      {logSeleccionado && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setLogSeleccionado(null)}
              className="absolute top-4 right-4 text-foreground/50 hover:text-foreground inline-flex min-touch-target"
              type="button"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              <ShieldAlert className="w-6 h-6 text-critical shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-foreground">Detalle del Log de Error</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-critical/10 border border-critical/20 text-critical text-xs font-bold font-mono mt-1">
                  {logSeleccionado.codigoError}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-background/40 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-foreground/40 shrink-0" />
                <span className="text-foreground/50 font-medium">Fecha:</span>
                <span className="text-foreground font-mono text-xs">{new Date(logSeleccionado.creadoEn).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-foreground/40 shrink-0" />
                <span className="text-foreground/50 font-medium">Usuario:</span>
                <span className="text-foreground font-mono text-xs truncate">{logSeleccionado.email || "Anónimo / Sistema"}</span>
              </div>
              {logSeleccionado.userId && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <Key className="w-4 h-4 text-foreground/40 shrink-0" />
                  <span className="text-foreground/50 font-medium">User UUID:</span>
                  <span className="text-foreground font-mono text-xs truncate">{logSeleccionado.userId}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground/60 uppercase">Mensaje de Error:</h4>
              <p className="p-3 bg-critical/5 border border-critical/15 text-critical text-sm rounded-lg font-medium leading-relaxed">
                {logSeleccionado.mensaje}
              </p>
            </div>

            {logSeleccionado.stack && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground/60 uppercase flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Stack Trace:
                </h4>
                <pre className="p-3 bg-background border border-border rounded-lg text-xs font-mono text-foreground/80 overflow-x-auto max-h-40 leading-relaxed">
                  {logSeleccionado.stack}
                </pre>
              </div>
            )}

            {logSeleccionado.contexto && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground/60 uppercase">Payload / Contexto JSON:</h4>
                <pre className="p-3 bg-background border border-border rounded-lg text-xs font-mono text-brand overflow-x-auto max-h-40 leading-relaxed">
                  {JSON.stringify(logSeleccionado.contexto, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setLogSeleccionado(null)}
                className="py-2 px-6 border border-border rounded-lg text-sm text-foreground/80 hover:bg-surface-hover hover:text-foreground transition-all min-h-[44px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
