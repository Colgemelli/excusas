-- Vistas para el sistema de excusas y permisos

-- Vista: vista_estudiantes_grados
CREATE OR REPLACE VIEW vista_estudiantes_grados AS
SELECT e.id,
       e.codigo,
       e.nombres,
       e.apellidos,
       g.nombre AS grado_nombre,
       e.grado_id
FROM estudiantes e
JOIN grados g ON e.grado_id = g.id;

-- Vista: vista_usuarios_completa
CREATE OR REPLACE VIEW vista_usuarios_completa AS
SELECT u.id,
       u.usuario,
       u.nombre,
       u.email,
       u.grado_asignado,
       g.nombre AS grado,
       u.asignatura,
       tu.nombre AS tipo_usuario,
       u.activo
FROM usuarios u
LEFT JOIN grados g ON u.grado_asignado = g.id
LEFT JOIN tipos_usuario tu ON u.tipo_usuario_id = tu.id;

-- Vista: vista_solicitudes_completas
CREATE OR REPLACE VIEW vista_solicitudes_completas AS
SELECT s.id,
       s.radicado,
       s.fecha_solicitud,
       s.nombre_estudiante,
       g.nombre AS grado,
       ts.nombre AS tipo_solicitud,
       es.nombre AS estado_actual,
       s.motivo,
       s.datos_formulario,
       s.observaciones,
       s.aprobado_por_id,
       s.rechazado_por_id,
       s.validado_por_id,
       s.created_at,
       s.updated_at
FROM solicitudes s
LEFT JOIN grados g ON s.grado_id = g.id
LEFT JOIN tipos_solicitud ts ON s.tipo_solicitud_id = ts.id
LEFT JOIN estados es ON s.estado_actual_id = es.id;
