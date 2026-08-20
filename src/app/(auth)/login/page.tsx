"use client";

import { useState } from "react";
import { Database, ArrowRight, Loader2 } from "lucide-react";
import { crearClienteSupabaseNavegador } from "@/lib/supabase/client";

export default function LoginPage() {
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const supabase = crearClienteSupabaseNavegador();

  const handleAccion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setMensajeExito(null);

    try {
      if (esRegistro) {
        const { data, error: signupErr } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupErr) throw signupErr;

        if (data.user && data.session) {
          // Ya está logueado inmediatamente
          window.location.href = "/onboarding";
        } else {
          setMensajeExito("¡Registro completado! Por favor revisá tu casilla de correo para verificar tu cuenta.");
        }
      } else {
        const { error: signinErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signinErr) throw signinErr;

        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Luz verde de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-2 text-brand font-bold text-2xl tracking-wider">
          <Database className="w-8 h-8" />
          <span>NODEXA <span className="text-foreground/60 font-light">MINI</span></span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {esRegistro ? "Creá tu cuenta gratis" : "Ingresá a tu planilla"}
        </h2>
        <p className="mt-2 text-center text-sm text-foreground/60">
          {esRegistro
            ? "¿Ya tenés una cuenta?"
            : "¿No tenés una cuenta todavía?"}{" "}
          <button
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError(null);
              setMensajeExito(null);
            }}
            className="font-medium text-brand hover:underline"
          >
            {esRegistro ? "Iniciar Sesión" : "Registrarme gratis"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-surface py-8 px-4 border border-border shadow-xl rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleAccion}>
            {error && (
              <div className="p-3 bg-critical/10 border border-critical/20 rounded-lg text-critical text-sm">
                {error}
              </div>
            )}

            {mensajeExito && (
              <div className="p-3 bg-brand/10 border border-brand/20 rounded-lg text-brand text-sm">
                {mensajeExito}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
                Correo Electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg text-foreground focus:border-brand py-2 px-3 outline-none"
                  placeholder="ejemplo@tuempresa.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground/80">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg text-foreground focus:border-brand py-2 px-3 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={cargando}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-background bg-brand hover:bg-brand/90 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{esRegistro ? "Comenzar gratis" : "Ingresar"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
