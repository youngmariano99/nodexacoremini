# Catálogo de Errores Normalizados - Mini Sistema PLG

Este documento clasifica las excepciones y códigos de error normalizados en el Mini-Sistema.

---

## 1. Errores de Validación (Zod y Entrada)

| Código | Mensaje de Excepción | Causa Probable | Solución / Manejo |
| :--- | :--- | :--- | :--- |
| **NX-VAL-001** | Datos de onboarding inválidos | Formato de email o whatsapp incorrecto en el formulario de registro. | Corregir los campos en la vista y reintentar. |
| **NX-VAL-002** | Días de demora no válidos | Valor menor que cero ingresado en el CRUD de proveedores. | Impedir ingreso de números negativos. |
| **NX-VAL-003** | Stock o Consumo negativo | Ingreso de valores menores a cero en el alta/edición de productos. | Validar que los campos numéricos sean positivos en Zod. |

---

## 2. Errores de Base de Datos y Supabase

| Código | Mensaje de Excepción | Causa Probable | Solución / Manejo |
| :--- | :--- | :--- | :--- |
| **NX-DB-001** | Error de conexión a la base de datos | Credenciales incorrectas en `.env.local` o caída temporal del servicio. | Verificar estado de la red y las variables de Supabase. |
| **NX-DB-002** | Violación de restricción única | Intento de registrar un correo ya existente o un proveedor repetido. | Mostrar alerta de duplicado en interfaz. |
| **NX-DB-003** | Error en política RLS | El usuario intenta leer o modificar un registro que no le pertenece. | Bloquear la operación o auditar la petición. |

---

## 3. Errores de Negocio e Integración

| Código | Mensaje de Excepción | Causa Probable | Solución / Manejo |
| :--- | :--- | :--- | :--- |
| **NX-BIZ-001** | Falta perfil de onboarding | El usuario tiene sesión de Supabase activa pero no ha completado el perfil de negocio. | Redirigir automáticamente a `/onboarding`. |
| **NX-BIZ-002** | Eliminación de proveedor con stock | Intento de borrar un proveedor que tiene productos asociados. | La base de datos impide la eliminación por clave foránea (`RESTRICT`). Solicitar desvincular los productos primero. |
