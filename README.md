📋 Sistema de Excusas y Permisos - Colegio Gemelli Franciscanos
🚀 Instrucciones de Configuración y Despliegue
📁 Estructura de Archivos
proyecto/
├── index.html          # Interfaz principal con formularios stepper
├── app.js             # Lógica de la aplicación con stepper y validaciones
├── styles.css         # Estilos CSS con componentes stepper
└── README.md          # Este archivo
✨ Nuevas Características Implementadas
🎯 Formulario Stepper (Estilo Stepperize)
4 pasos para completar cada solicitud
Navegación visual con indicadores de progreso
Validación paso a paso antes de continuar
Sección de revisión antes del envío final
Responsive design adaptado a móviles
👨‍👩‍👧‍👦 Información Completa del Acudiente
Nombre completo del acudiente
Correo electrónico (nuevo campo obligatorio)
Teléfono de contacto
Perfil/relación con el estudiante (Padre, Madre, Tutor, etc.)
Número de documento de identidad
Eliminado: Campo de "firma del padre" (reemplazado por datos completos)
🎓 Base de Datos de Estudiantes
Estudiantes por grado preconfigurados
Selección dinámica cuando se elige el grado
Información del estudiante con código y nombre completo
Validación automática de estudiante seleccionado
📅 Validación de Fechas Mejorada
Solo fechas futuras: Desde hoy en adelante
Validación en tiempo real
Mensajes de error específicos para fechas inválidas
🛠️ Configuración Inicial
Opción 1: Desarrollo Local (Sin Supabase)
El sistema funciona inmediatamente con todas las nuevas características.
Las solicitudes se guardan en `localStorage` del navegador mientras Supabase no esté disponible.
Si `localStorage` no está habilitado, los datos solo persisten durante la sesión actual.
Si la inicialización de Supabase falla, `useLocal` se activa automáticamente y se muestra una advertencia en la consola indicando este modo de respaldo.

Subir archivos a Netlify/GitHub Pages:
bash
git clone tu-repositorio
# Subir index.html, app.js, styles.css
Usuarios predefinidos para testing:
Coordinadores:
- Usuario: coord1 | Contraseña: coord123
- Usuario: directora | Contraseña: dir123

Docentes:
- Usuario: doc1 | Contraseña: doc123 (Grado: 5°)
- Usuario: doc2 | Contraseña: doc123 (Grado: 8°)
- Usuario: doc3 | Contraseña: doc123 (Grado: 11°)

Administrador:
- Usuario: admin | Contraseña: admin123
Estudiantes de ejemplo por grado:
Preescolar: Ana Sofía Pérez, Carlos Andrés López, etc.
1° a 11°: 5 estudiantes por grado con códigos únicos
Carga automática al seleccionar grado
Opción 2: Producción con Supabase
1. Crear Proyecto en Supabase
Ve a supabase.com
Crea una cuenta y nuevo proyecto
Anota tu Project URL y anon public key
2. Configurar Base de Datos
Ejecuta el script SQL completo que está en el artifact "Tablas SQL para Supabase":

sql
-- Ejecutar todo el contenido del archivo SQL en el Query Editor de Supabase
-- Esto creará todas las tablas, políticas y datos iniciales
Luego, ejecuta el archivo `docs/views.sql` para crear las vistas
`vista_estudiantes_grados`, `vista_usuarios_completa` y
`vista_solicitudes_completas`.
3. Configurar Políticas RLS
sql
-- Política simple para desarrollo
CREATE POLICY "usuarios_autenticados_ven_solicitudes" ON solicitudes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "crear_solicitudes_publico" ON solicitudes
    FOR INSERT WITH CHECK (true);
4. Actualizar Configuración en app.js
javascript
const SUPABASE_CONFIG = {
    url: 'https://tu-proyecto.supabase.co',
    key: 'tu-clave-anonima-aqui',
    useLocal: false  // Cambiar a false para usar Supabase
};
5. Poblar Base de Datos de Estudiantes
sql
-- Insertar estudiantes en la tabla correspondiente
-- (Script incluido en el archivo SQL completo)
🎨 Flujo del Formulario Stepper
📝 Excusas (4 Pasos):
👨‍👩‍👧‍👦 Acudiente: Información personal completa
🎓 Estudiante: Selección de grado y estudiante
📋 Excusa: Fechas, motivo, documentos adjuntos
✅ Confirmación: Revisión antes de enviar
🕐 Permisos (4 Pasos):
👨‍👩‍👧‍👦 Acudiente: Información personal completa
🎓 Estudiante: Selección de grado y estudiante
⏰ Permiso: Fechas, horarios, tipo de permiso
✅ Confirmación: Revisión antes de enviar
✅ Validaciones Implementadas
🔍 Validación por Pasos:
Paso 1: Email válido, campos obligatorios completos
Paso 2: Grado y estudiante seleccionados
Paso 3: Fechas futuras, campos específicos del tipo
Paso 4: Revisión final de todos los datos
📅 Validación de Fechas:
Fecha mínima: Hoy (no fechas pasadas)
Validación automática al cambiar fecha
Mensajes de error específicos
👥 Validación de Estudiantes:
Carga dinámica por grado seleccionado
Información automática del estudiante
Códigos únicos por estudiante
🔐 Política de Protección de Datos Actualizada
✅ Características Mejoradas:
Identificación completa del Colegio Gemelli
Finalidades específicas del sistema
Derechos detallados del titular
Contacto Habeas Data: habeasdata@colegiosfranciscanos.com
Doble validación obligatoria
📱 Diseño Responsive
🖥️ Desktop:
Stepper horizontal con conectores
Formulario de 2 columnas
Navegación lateral
📱 Móvil:
Stepper vertical tipo cards
Formulario de 1 columna
Botones full-width
Touch-friendly navigation
🐛 Solución de Problemas
Error: Estudiantes no cargan
Verificar selección de grado
Revisar console del navegador
Verificar estructura de datos
Error: Fechas no válidas
Comprobar configuración de fecha mínima
Verificar formato de fecha del navegador
Error: Stepper no navega
Verificar validaciones de cada paso
Revisar campos obligatorios
Comprobar mensajes de error
🎯 Funcionalidades del Stepper
⏭️ Navegación:
Siguiente: Solo si el paso actual es válido
Anterior: Siempre disponible (excepto paso 1)
Saltar pasos: No permitido sin validar
Indicadores visuales: Estados completado/activo/pendiente
🔄 Auto-actualización:
Sección de revisión se actualiza automáticamente
Información del estudiante aparece al seleccionar
Campos dinámicos según tipo de solicitud
✨ Características Especiales:
Prevención de envío con Enter en campos intermedios
Validación en tiempo real en campos críticos
Estados visuales para campos válidos/inválidos
Mensajes de error contextuales por paso
📊 Datos de Ejemplo Incluidos
javascript
// Ejemplo de estudiantes por grado
'5°': [
    { codigo: '5A001', nombre: 'Gabriela', apellidos: 'Molina Vargas' },
    { codigo: '5A002', nombre: 'Maximiliano', apellidos: 'Contreras Ruiz' },
    // ... más estudiantes
]
🚀 Próximas Mejoras
 Integración con sistema académico real
 Notificaciones push para padres
 Firma digital electrónica
 Historial de solicitudes por estudiante
 Dashboard para padres de familia
© 2025 Sistema de Excusas y Permisos - Colegio Gemelli Franciscanos Formulario Stepper v2.0 con validaciones avanzadas

Usuarios en Producción
Los usuarios predefinidos tienen contraseñas en texto plano para desarrollo. En producción:

Cambiar contraseñas:
sql
UPDATE usuarios SET password_hash = 'nueva_contraseña_hash_bcrypt' 
WHERE usuario = 'admin';
Implementar hashing de contraseñas:
En el código JavaScript, usar una librería como bcrypt.js
Hashear contraseñas antes de compararlas
Variables de Entorno
Define `SUPABASE_URL` y `SUPABASE_ANON_KEY` en tu entorno y ejecuta el script
de construcción para generar `env.js`.

```bash
SUPABASE_URL=tu-url SUPABASE_ANON_KEY=tu-clave ./build.sh
```
Reemplaza `tu-url` y `tu-clave` con los valores reales de tu proyecto cuando ejecutes `build.sh`.
Se incluye un archivo `env.example.js` como referencia.

El archivo `env.js` se carga antes de `app.js` y expone los valores mediante
`window.process.env`.
**Importante:** `env.js` no se incluye en el repositorio por contener credenciales.
Tras clonar el proyecto, generalo nuevamente ejecutando el script anterior.
🌐 Despliegue
GitHub + Netlify (Recomendado)
Crear repositorio en GitHub:
bash
git init
git add .
git commit -m "Sistema de excusas inicial"
git remote add origin https://github.com/tu-usuario/sistema-excusas.git
git push -u origin main
Configurar Netlify:
Conectar repositorio de GitHub
Build command: (dejar vacío)
Publish directory: (dejar vacío o "/")
Configurar variables de entorno si usas Supabase
Vercel
Conectar repositorio de GitHub
Configurar variables de entorno
Deploy automático
Hosting tradicional
Subir archivos via FTP
Asegurarse de que el servidor soporte HTTPS
📊 Funcionalidades Implementadas
✅ Para Padres de Familia (Sin Login)
Crear solicitudes de excusa
Crear solicitudes de permiso
Consultar estado por radicado
Modal de protección de datos obligatorio
Generación automática de radicados
Adjuntar documentos (certificados médicos)
✅ Para Coordinadores
Dashboard con estadísticas
Aprobar/rechazar solicitudes
Ver todas las solicitudes
Agregar observaciones
Firma digital (aprobación/rechazo)
✅ Para Docentes
Ver solicitudes de su grado asignado
Validar solicitudes aprobadas
Dashboard simplificado
✅ Para Administradores
Dashboard completo con métricas
Estadísticas por grado
Histórico mensual
Gestión completa del sistema
🔍 Sistema de Permisos
javascript
// Permisos por rol
const permissions = {
    'coordinador': [
        'aprobar_solicitudes', 
        'rechazar_solicitudes', 
        'ver_dashboard', 
        'ver_todas_solicitudes'
    ],
    'docente': [
        'validar_solicitudes', 
        'asignar_trabajos', 
        'ver_estudiantes', 
        'ver_solicitudes_grado'
    ],
    'admin': [
        'ver_estadisticas', 
        'gestionar_usuarios', 
        'acceso_completo', 
        'ver_todas_solicitudes'
    ]
};
🐛 Troubleshooting
Error: "operator does not exist: text ->> unknown"
Usar las políticas RLS simplificadas proporcionadas
La lógica de permisos se maneja en JavaScript
Error de conexión a Supabase
Verificar URL y clave anónima
Verificar configuración de CORS en Supabase
Cambiar useLocal: true para desarrollo sin Supabase
Solicitudes no aparecen
Verificar políticas RLS
Verificar permisos de usuario
Revisar console del navegador para errores
📱 Responsive Design
Optimizado para móviles y tablets
Formularios adaptativos
Navegación touch-friendly
🎨 Personalización
Variables CSS en :root para fácil customización
Colores institucionales del Colegio Gemelli
Iconos Font Awesome incluidos
📈 Próximas Mejoras
 Notificaciones por email
 Reportes en PDF
 Integración con calendario escolar
 App móvil con Capacitor
 Backup automático de datos
🆘 Soporte
Para soporte técnico:

Revisar console del navegador
Verificar configuración de Supabase
Consultar documentación de Supabase
## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
