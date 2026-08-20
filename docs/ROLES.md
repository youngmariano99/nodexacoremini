# Roles y Políticas de Seguridad (RLS) - Mini Sistema PLG

Este documento detalla el aislamiento multi-tenant a nivel de usuario en Supabase y las políticas de seguridad.

---

## 1. Aislamiento por Usuario (Tenant Único)

Para garantizar la seguridad y que ningún usuario vea stock o proveedores ajenos, todas las tablas de negocio tienen habilitado **Row Level Security (RLS)** y filtran las filas comparando el `user_id` del registro con el identificador del usuario autenticado devuelto por Supabase (`auth.uid()`).

---

## 2. Detalle de Políticas RLS por Tabla

### Tabla `perfiles_onboarding`
* **SELECT**: Permite leer únicamente si el `id` coincide con `auth.uid()`.
  ```sql
  auth.uid() = id
  ```
* **INSERT**: Permite insertar si el `id` coincide con `auth.uid()`.
  ```sql
  auth.uid() = id
  ```
* **UPDATE**: Permite actualizar si el `id` coincide con `auth.uid()`.
  ```sql
  auth.uid() = id
  ```

### Tabla `proveedores`
* **ALL**: Permite SELECT, INSERT, UPDATE, DELETE si el `user_id` del registro coincide con `auth.uid()`.
  ```sql
  auth.uid() = user_id
  ```

### Tabla `productos`
* **ALL**: Permite SELECT, INSERT, UPDATE, DELETE si el `user_id` del registro coincide con `auth.uid()`.
  ```sql
  auth.uid() = user_id
  ```

### Tabla `movimientos_stock`
* **ALL**: Permite SELECT, INSERT, UPDATE, DELETE si el `user_id` del registro coincide con `auth.uid()`.
  ```sql
  auth.uid() = user_id
  ```

### Tabla `registro_alertas_evitadas`
* **ALL**: Permite SELECT, INSERT, UPDATE, DELETE si el `user_id` del registro coincide con `auth.uid()`.
  ```sql
  auth.uid() = user_id
  ```

---

## 3. Seguridad del Super Administrador

El acceso a las métricas agregadas globales y a los controles mock en `/admin` se valida directamente en el servidor Next.js. El correo electrónico del usuario se valida contra la lista de strings definidos en la variable de entorno `ADMIN_EMAILS`. 

Las llamadas a las Server Actions del administrador en [`adminActions.ts`](file:///c:/Users/mari_/OneDrive/Escritorio/t/PROYECTS/ACTIVOS/Nodexa/Servicios/NodexaCore/Sistema/mini-sistema/src/app/(app)/admin/adminActions.ts) vuelven a validar esta autorización a nivel de servidor antes de ejecutar cualquier mutación física sobre Supabase (usando `crearClienteSupabaseAdmin` si fuese necesario).
