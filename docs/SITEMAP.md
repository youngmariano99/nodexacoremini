# Estructura del Sitio y Rutas - Mini Sistema PLG

Este documento detalla el mapa de navegación, los estados de acceso (autenticado/público) y los flujos lógicos del Mini-Sistema.

---

## 1. Mapa de Rutas

Todas las rutas son servidas mediante Next.js App Router:

| Ruta | Acceso | Tipo | Componente / Propósito |
| :--- | :--- | :--- | :--- |
| `/login` | Público | Client | Inicio de sesión y registro rápido anti-fricción. |
| `/onboarding` | Autenticado | Server/Client | Formulario de perfil inicial (Rubro, WhatsApp, dolore predefinido o personalizado). Redirige si ya está completado. |
| `/` | Autenticado | Server/Client | Planilla inteligente principal. CRUD de productos e incrementos de stock en 1 clic. Banner PLG constante. |
| `/proveedores` | Autenticado | Server/Client | CRUD de proveedores y demora de entregas en días. |
| `/admin` | Exclusivo Admin | Server/Client | Métricas PLG (quiebres evitados, tiempo ahorrado, dolores e leads WhatsApp) y botones de simulación demo. |

---

## 2. Flujo de Onboarding y Transiciones de Estado

El flujo de conversión PLG sigue el siguiente orden:

```
[Visita TikTok] -> [Registro en /login] 
                       |
                       v
               [¿Tiene Perfil?] --(No)--> [/onboarding (Onboarding Survey)]
                       |
                      (Sí)
                       v
            [/ (Spreadsheet Principal)] <--> [/proveedores]
                       |
                       +--> [Banner CTA] -> [Migración a Nodexa Core (SaaS)]
```

---

## 3. Seguridad en Rutas (Middleware)

El archivo [`middleware.ts`](file:///c:/Users/mari_/OneDrive/Escritorio/t/PROYECTS/ACTIVOS/Nodexa/Servicios/NodexaCore/Sistema/mini-sistema/src/middleware.ts) intercepta las llamadas:
1. Valida si la sesión de Supabase del navegador está activa.
2. Si no hay sesión y se intenta acceder a una ruta protegida (ej: `/`, `/proveedores`, `/admin`), redirige inmediatamente a `/login`.
3. Para la ruta `/admin`, el validador a nivel de servidor en la página valida que el correo esté listado en `ADMIN_EMAILS`, haciendo un bypass silencioso a `/` en caso contrario.
