# Guía de Inicialización y CI/CD - Mini Sistema PLG

Este documento detalla los pasos para levantar el entorno local, ejecutar pruebas unitarias y configurar el pipeline de Integración Continua (CI).

---

## 1. Requisitos Previos

* Node.js v22 o superior
* Cuenta en Supabase (Base de datos PostgreSQL en la nube)
* Cuenta en Vercel (Para despliegue de frontend)

---

## 2. Configuración en un Clic

### Variables de Entorno
Crear un archivo `.env.local` en la raíz de `/mini-sistema`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
ADMIN_EMAILS=mariano@tuempresa.com,admin@nodexa.com
```

### Ejecutar Desarrollo
```bash
npm install
npm run dev
```

---

## 3. Suite de Pruebas (Vitest)

Las pruebas están configuradas mediante Vitest y pueden ejecutarse con los siguientes comandos:

* **Ejecutar pruebas unitarias de lógica core**:
  ```bash
  npm run test
  ```
* **Medir cobertura de pruebas unitarias**:
  ```bash
  npm run test:coverage
  ```

---

## 4. Pipeline de CI en GitHub Actions

El pipeline configurado en `.github/workflows/mini-sistema-ci.yml` se ejecuta automáticamente al subir un pull request que contenga cambios en la carpeta `mini-sistema/`. El flujo realiza:

1. **Lint (ESLint)**: Valida la higiene del código.
2. **Typecheck (Next Build + tsc --noEmit)**: Valida tipos estáticos de TypeScript generando previamente las páginas Next.js.
3. **Unit Tests (Vitest)**: Corre las especificaciones unitarias garantizando que la lógica del punto de pedido no se degrade.
