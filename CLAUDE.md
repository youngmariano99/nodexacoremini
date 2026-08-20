# CLAUDE.md - Resumen Ejecutivo (Mini Sistema PLG)

## 1. Información General del Proyecto
- **Nombre:** Mini-Sistema de Punto de Pedido (Nodexa Mini)
- **Descripción:** Imán de leads PLG enfocado en la prevención de quiebres de stock.
- **Idioma Principal:** Español (Latinoamérica) para variables, funciones, parámetros y comentarios.

## 3. Comandos Frecuentes
- `npm run dev`: Inicia el servidor de desarrollo local en `http://localhost:3000`.
- `npm run build`: Compila la aplicación para producción.
- `npm run test`: Ejecuta las pruebas unitarias con Vitest.
- `npm run test:coverage`: Medición de cobertura de pruebas unitarias.

## 4. Reglas Críticas e Innegociables
- **seguridad:**
  * Multi-tenant por usuario mediante RLS estricto en Supabase (`auth.uid() = user_id`).
  * ValidaciónFail-Fast en puerta usando Zod.
  * Ocultar el Panel de Admin (`/admin`) a nivel de servidor validando contra `ADMIN_EMAILS`.
- **escalabilidad:**
  * Clean Architecture + Patrón Repository para desacoplar base de datos de UI.
  * Centralización de cálculos matemáticos de Punto de Pedido en la vista SQL `vista_productos_puntos_pedido`.
- **dx:**
  * Tipado estático fuerte (Prohibido usar `any`).
  * Prohibición absoluta de emojis. Usar íconos de `lucide-react`.
  * Fuente monospace `JetBrains Mono` con números tabulares para evitar saltos visuales de stock.
- **testing:**
  * TDD para la lógica del cálculo matemático de Punto de Pedido.
  * Pruebas unitarias de dominio automatizadas con Vitest.

## 5. Índice de Documentación
- **Entidades y Base de Datos:** `docs/SCHEMA.md`.
- **Rutas y Onboarding:** `docs/SITEMAP.md`.
- **Políticas RLS:** `docs/ROLES.md`.
- **Errores Estandarizados:** `docs/ERRORS.md`.
- **Puesta en marcha:** `docs/SETUP.md`.
