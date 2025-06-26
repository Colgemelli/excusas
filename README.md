# excusas
Sistema de permisos y excusas basado en Supabase.

## Configuración local

1. Copia el proyecto y abre `index.html` con un servidor local.
2. Modifica `app.js` con tu `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
3. En tu proyecto de Supabase crea las tablas `usuarios`, `permisos` y `excusas`.
   - `usuarios` debe tener una columna `auth_id` (uuid) vinculada a `auth.users.id`.
   - `permisos` y `excusas` incluyen una columna `usuario_id` que referencia a `usuarios.id`.
4. Activa **RLS** en `permisos` y `excusas` y añade una política que permita
   insertar a los usuarios autenticados, por ejemplo:

   ```sql
   create policy "Authenticated inserts" on permisos
       for insert with check (auth.uid() = usuario_id);

   create policy "Authenticated inserts" on excusas
       for insert with check (auth.uid() = usuario_id);
   ```

5. Para iniciar sesión, ingresa tu correo y tipo de usuario. Supabase enviará un
   enlace mágico. Al autenticarse se creará (si es necesario) un registro en la
   tabla `usuarios` con tu `auth_id`.
6. Al registrar permisos o excusas se enviará automáticamente tu `usuario_id`.
