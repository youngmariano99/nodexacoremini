"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, LayoutGrid, Users, BarChart3, Database } from "lucide-react";
import { crearClienteSupabaseNavegador } from "@/lib/supabase/client";

interface NavbarProps {
  userEmail?: string;
  esAdmin?: boolean;
}

export default function Navbar({ userEmail, esAdmin: esAdminProp }: NavbarProps) {
  const pathname = usePathname();
  const supabase = crearClienteSupabaseNavegador();

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const navItems = [
    { href: "/", label: "Planilla de Stock", icon: LayoutGrid },
    { href: "/proveedores", label: "Proveedores", icon: Users },
  ];

  const esAdmin = esAdminProp !== undefined 
    ? esAdminProp 
    : (userEmail 
        ? (userEmail.toLowerCase().includes("mari_") || 
           userEmail.toLowerCase().includes("admin") || 
           userEmail.toLowerCase() === "marianoyoung.dev@gmail.com")
        : false);

  if (esAdmin) {
    navItems.push({ href: "/admin", label: "Panel Admin", icon: BarChart3 });
  }


  return (
    <header className="border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-wider text-brand">
            <Database className="w-5 h-5" />
            <span>NODEXA <span className="text-foreground/60 font-light">MINI</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm transition-all font-medium ${
                    active
                      ? "bg-brand/10 text-brand border border-brand/20"
                      : "text-foreground/70 hover:text-foreground hover:bg-surface-hover border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden sm:inline text-xs text-foreground/50 numbers-mono bg-border/50 px-2.5 py-1.5 rounded">
              {userEmail}
            </span>
          )}
          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-border bg-surface hover:bg-surface-hover text-foreground/80 hover:text-foreground rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
