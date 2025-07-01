# 📄 Aplicación de Excusas y Permisos - Colegio Gemelli

Este repositorio contiene una aplicación web desarrollada para el Colegio Franciscano Agustín Gemelli. El sistema permite a los padres de familia diligenciar excusas o permisos estudiantiles sin necesidad de registro previo. La aplicación está desplegada en **Netlify**, utiliza **Supabase** como backend y está gestionada a través de **GitHub**.

---

## 🚀 Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Netlify
- **Repositorio**: GitHub

---

## 🏠 Funcionalidades Principales

- Página de inicio que permite al padre escoger entre excusa o permiso.
- Formularios dinámicos según el tipo de solicitud.
- Validación de datos y campos obligatorios.
- Subida de archivos adjuntos (incapacidades, certificados, etc.).
- Generación automática de número de radicado.
- Flujo de estados de la solicitud (en validación, aprobada, rechazada).
- Panel administrativo con control de usuarios, auditoría, estadísticas y más.

---

## 🧱 Estructura del Proyecto

```
excusas/
├── index.html        # Página principal
├── styles.css        # Estilos generales
├── app.js            # Lógica de la aplicación
├── README.md         # Documentación
```

---

## 🧮 Base de Datos - Supabase (PostgreSQL)

Se utilizaron las siguientes tablas en Supabase para manejar todo el flujo del sistema:

### 📂 Tablas Principales

1. **usuarios**: Manejo de usuarios del sistema (padres, administrativos, validadores).
2. **tipos_usuario**: Define roles y permisos de acceso.
3. **estudiantes**: Información básica de los estudiantes.
4. **grados**: Niveles académicos y grados del colegio.
5. **solicitudes**: Registro de todas las excusas y permisos solicitados.
6. **tipos_solicitud**: Clasificación entre excusas y permisos.
7. **archivos_adjuntos**: Manejo de documentos como certificados médicos e incapacidades.
8. **historial_estados**: Registro de los cambios de estado de cada solicitud.
9. **estados_solicitud**: Etapas del proceso (radicado, validado, aprobado, rechazado).
10. **logs_auditoria**: Auditoría completa de acciones del sistema.
11. **configuracion_sistema**: Parámetros de configuración general.
12. **estadisticas_cache**: Caché de métricas para reportes y análisis.

---

## 🔐 Seguridad Implementada

- Validación y sanitización de formularios.
- Uso de HTTPS vía Netlify.
- Control de roles con Supabase (RLS activado).
- Generación y validación de tokens únicos de radicado.
- Subida segura de archivos con verificación de tipo MIME y checksum.

---

## 🧪 Despliegue

1. **Frontend**: Subido en Netlify (HTML, CSS y JS planos).
2. **Backend**: Supabase para autenticación, base de datos y almacenamiento.
3. **Repositorio**: Versión controlada mediante GitHub.

---

## 📦 SQL del Esquema (Resumen de Tablas)

La estructura completa de las tablas está descrita en el archivo `schema.sql` y fue generada desde Supabase. Las relaciones están correctamente establecidas con claves foráneas, UUIDs, timestamps automáticos y constraints de seguridad.

> Para más detalles sobre el esquema SQL completo, revisa el archivo `schema.sql` o accede al [archivo SQL original](https://github.com/Colgemelli/excusas/blob/main/schema.sql).

---

## 📩 Contacto

Desarrollado por el equipo TIC del Colegio Franciscano Agustín Gemelli.

Para soporte o sugerencias: [www.colgemelli.edu.co](https://www.colgemelli.edu.co)  
Email: sistemas@colgemelli.edu.co

---

> "La educación también es responsabilidad compartida, y este sistema lo demuestra."
