<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Excusas y Permisos - Colegio Gemelli Franciscanos</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- ========== CORRECCIÓN: Supabase v2 ========== -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="logo-section">
                <i class="fas fa-graduation-cap"></i>
                <h1>Sistema de Excusas y Permisos</h1>
            </div>
            <nav class="nav-buttons">
                <button id="inicioBtn" class="nav-btn active">Inicio</button>
                <button id="consultarBtn" class="nav-btn">Consultar Radicado</button>
                <button id="docentesBtn" class="nav-btn">Acceso Docentes</button>
                <button id="loginBtn" class="nav-btn">Login</button>
            </nav>
            <div class="status-indicator">
                <span id="statusText">🟡 Inicializando...</span>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Vista Principal (Padres de Familia) -->
        <section id="homeView" class="view active">
            <div class="container">
                <div class="welcome-section">
                    <h2>Bienvenido al Sistema de Gestión</h2>
                    <p>Selecciona el tipo de solicitud que deseas realizar:</p>
                </div>
                
                <div class="request-options">
                    <div class="option-card parent-card" id="excusaCard">
                        <div class="option-icon">
                            <i class="fas fa-file-medical"></i>
                        </div>
                        <h3>Excusa</h3>
                        <p>Para justificar ausencias por motivos de salud, citas médicas o situaciones familiares</p>
                        <button class="btn-primary">Solicitar Excusa</button>
                    </div>
                    
                    <div class="option-card teacher-card" id="permisoCard">
                        <div class="option-icon">
                            <i class="fas fa-file-signature"></i>
                        </div>
                        <h3>Permiso</h3>
                        <p>Para solicitar autorización de salida anticipada o ausencia programada</p>
                        <button class="btn-primary">Solicitar Permiso</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Vista Formulario Excusa -->
        <section id="excusaView" class="view">
            <div class="container">
                <div class="form-header">
                    <button id="backToHome" class="btn-secondary">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                    <h2>Formato Único de Excusa</h2>
                </div>
                
                <div class="stepper-container">
                    <!-- Stepper Header -->
                    <div class="stepper-header">
                        <div class="step-item active" data-step="1">
                            <div class="step-circle">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="step-content">
                                <span class="step-title">Acudiente</span>
                                <span class="step-description">Información personal</span>
                            </div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="step-item" data-step="2">
                            <div class="step-circle">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <div class="step-content">
                                <span class="step-title">Estudiante</span>
                                <span class="step-description">Grado y estudiante</span>
                            </div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="step-item" data-step="3">
                            <div class="step-circle">
                                <i class="fas fa-file-medical"></i>
                            </div>
                            <div class="step-content">
                                <span class="step-title">Excusa</span>
                                <span class="step-description">Detalles y motivo</span>
                            </div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="step-item" data-step="4">
                            <div class="step-circle">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="step-content">
                                <span class="step-title">Confirmación</span>
                                <span class="step-description">Revisar y enviar</span>
                            </div>
                        </div>
                    </div>

                    <!-- Stepper Content -->
                    <form id="excusaForm" class="stepper-form">
                        <!-- Paso 1: Información del Acudiente -->
                        <div class="step-panel active" data-step="1">
                            <div class="panel-header">
                                <h3>👨‍👩‍👧‍👦 Información del Acudiente</h3>
                                <p>Por favor, proporcione sus datos como padre de familia o acudiente</p>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="nombreAcudiente">Nombre completo *</label>
                                    <input type="text" id="nombreAcudiente" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="emailAcudiente">Correo electrónico *</label>
                                    <input type="email" id="emailAcudiente" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="telefonoAcudiente">Teléfono de contacto *</label>
                                    <input type="tel" id="telefonoAcudiente" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="perfilAcudiente">Perfil/Relación con el estudiante *</label>
                                    <select id="perfilAcudiente" required>
                                        <option value="">Seleccionar...</option>
                                        <option value="padre">Padre</option>
                                        <option value="madre">Madre</option>
                                        <option value="abuelo">Abuelo/a</option>
                                        <option value="tio">Tío/a</option>
                                        <option value="tutor">Tutor Legal</option>
                                        <option value="otro">Otro Familiar</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Paso 2: Información del Estudiante -->
                        <div class="step-panel" data-step="2">
                            <div class="panel-header">
                                <h3>🎓 Información del Estudiante</h3>
                                <p>Seleccione el grado y el estudiante para quien solicita la excusa</p>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="gradoExcusa">Grado *</label>
                                    <select id="gradoExcusa" required>
                                        <option value="">Seleccionar grado...</option>
                                        <option value="Preescolar">Preescolar</option>
                                        <option value="1°">1°</option>
                                        <option value="2°">2°</option>
                                        <option value="3°">3°</option>
                                        <option value="4°">4°</option>
                                        <option value="5°">5°</option>
                                        <option value="6°">6°</option>
                                        <option value="7°">7°</option>
                                        <option value="8°">8°</option>
                                        <option value="9°">9°</option>
                                        <option value="10°">10°</option>
                                        <option value="11°">11°</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="estudianteExcusa">Estudiante *</label>
                                    <select id="estudianteExcusa" required disabled>
                                        <option value="">Seleccione un grado primero</option>
                                        <span class="loading-message" id="loadingEstudiantesExcusa" style="display: none;">Cargando estudiantes...</span>
                                    </select>
                                </div>
                            </div>
                            
                            <div id="estudianteInfo" class="estudiante-info" style="display: none;">
                                <div class="info-card">
                                    <h4>📋 Información del Estudiante</h4>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <span class="info-label">Nombre:</span>
                                            <span class="info-value" id="infoNombre">-</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Grado:</span>
                                            <span class="info-value" id="infoGrado">-</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Código:</span>
                                            <span class="info-value" id="infoCodigo">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Paso 3: Detalles de la Excusa -->
                        <div class="step-panel" data-step="3">
                            <div class="panel-header">
                                <h3>📝 Detalles de la Excusa</h3>
                                <p>Proporcione la información específica sobre la ausencia</p>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="fechaExcusa">Fecha de solicitud *</label>
                                    <input type="date" id="fechaExcusa" required>
                                    <small class="form-help">Solo se permiten fechas de hoy en adelante</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="mesInasistencia">Mes de inasistencia *</label>
                                    <select id="mesInasistencia" required>
                                        <option value="">Seleccionar...</option>
                                        <option value="Enero">Enero</option>
                                        <option value="Febrero">Febrero</option>
                                        <option value="Marzo">Marzo</option>
                                        <option value="Abril">Abril</option>
                                        <option value="Mayo">Mayo</option>
                                        <option value="Junio">Junio</option>
                                        <option value="Julio">Julio</option>
                                        <option value="Agosto">Agosto</option>
                                        <option value="Septiembre">Septiembre</option>
                                        <option value="Octubre">Octubre</option>
                                        <option value="Noviembre">Noviembre</option>
                                        <option value="Diciembre">Diciembre</option>
                                    </select>
                                </div>
                                
                                <div class="form-group span-2">
                                    <label for="diasInasistencia">Día(s) de inasistencia *</label>
                                    <input type="text" id="diasInasistencia" placeholder="Ejemplo: 15, 16, 17 o 20-25" required>
                                    <small class="form-help">Indique los días separados por comas o use guión para rangos</small>
                                </div>
                                
                                <div class="form-group span-2">
                                    <label for="motivoInasistencia">Motivo de la inasistencia *</label>
                                    <textarea id="motivoInasistencia" rows="4" required placeholder="Describa detalladamente el motivo de la ausencia..."></textarea>
                                </div>
                                
                                <div class="form-group span-2">
                                    <label class="checkbox-section-label">Documentos de soporte</label>
                                    <div class="checkbox-grid">
                                        <div class="checkbox-group">
                                            <input type="checkbox" id="certificadoMedico">
                                            <label for="certificadoMedico">
                                                <i class="fas fa-file-medical"></i>
                                                Certificado Médico
                                            </label>
                                        </div>
                                        <div class="checkbox-group">
                                            <input type="checkbox" id="incapacidad">
                                            <label for="incapacidad">
                                                <i class="fas fa-bed"></i>
                                                Incapacidad Médica
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group span-2" id="archivoGroup" style="display: none;">
                                    <label for="archivoAdjunto">Adjuntar documento *</label>
                                    <input type="file" id="archivoAdjunto" accept=".pdf,.jpg,.jpeg,.png">
                                    <small class="form-help">Formatos permitidos: PDF, JPG, PNG (máximo 5MB)</small>
                                </div>
                            </div>
                        </div>

                        <!-- Paso 4: Confirmación -->
                        <div class="step-panel" data-step="4">
                            <div class="panel-header">
                                <h3>✅ Revisar y Confirmar</h3>
                                <p>Verifique que toda la información sea correcta antes de enviar</p>
                            </div>
                            
                            <div class="review-section">
                                <div class="review-card">
                                    <h4><i class="fas fa-user"></i> Información del Acudiente</h4>
                                    <div class="review-grid">
                                        <div class="review-item">
                                            <span class="review-label">Nombre:</span>
                                            <span class="review-value" id="reviewNombreAcudiente">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Email:</span>
                                            <span class="review-value" id="reviewEmailAcudiente">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Teléfono:</span>
                                            <span class="review-value" id="reviewTelefonoAcudiente">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Perfil:</span>
                                            <span class="review-value" id="reviewPerfilAcudiente">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="review-card">
                                    <h4><i class="fas fa-graduation-cap"></i> Información del Estudiante</h4>
                                    <div class="review-grid">
                                        <div class="review-item">
                                            <span class="review-label">Estudiante:</span>
                                            <span class="review-value" id="reviewEstudiante">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Grado:</span>
                                            <span class="review-value" id="reviewGrado">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="review-card">
                                    <h4><i class="fas fa-file-medical"></i> Detalles de la Excusa</h4>
                                    <div class="review-grid">
                                        <div class="review-item">
                                            <span class="review-label">Fecha de solicitud:</span>
                                            <span class="review-value" id="reviewFecha">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Período de ausencia:</span>
                                            <span class="review-value" id="reviewPeriodo">-</span>
                                        </div>
                                        <div class="review-item span-2">
                                            <span class="review-label">Motivo:</span>
                                            <span class="review-value" id="reviewMotivo">-</span>
                                        </div>
                                        <div class="review-item span-2">
                                            <span class="review-label">Documentos:</span>
                                            <span class="review-value" id="reviewDocumentos">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Botones de Navegación -->
                        <div class="stepper-navigation">
                            <button type="button" id="prevStepBtn" class="btn-secondary" style="display: none;">
                                <i class="fas fa-chevron-left"></i> Anterior
                            </button>
                            <div class="step-indicator">
                                <span id="currentStepText">Paso 1 de 4</span>
                            </div>
                            <button type="button" id="nextStepBtn" class="btn-primary">
                                Siguiente <i class="fas fa-chevron-right"></i>
                            </button>
                            <button type="submit" id="submitFormBtn" class="btn-success" style="display: none;">
                                <i class="fas fa-paper-plane"></i> Enviar Excusa
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>

        <!-- Vista Formulario Permiso -->
        <section id="permisoView" class="view">
            <div class="container">
                <div class="form-header">
                    <button id="backToHomePermiso" class="btn-secondary">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                    <h2>Formato de Permisos y Autorizaciones</h2>
                </div>
                
                <div class="stepper-container">
                    <!-- Stepper Header -->
                    <div class="stepper-header">
                        <div class="step-item active" data-step="1">
                            <div class="step-circle">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="step-content">
                                <span class="step-title">Acudiente</span>
                                <span class="step-description">Información personal</span>
                            </div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="step-item" data-step="2">
                            <div class="step-circle">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <div class="step-content">
                                <span class="step-title">Estudiante</span>
                                <span class="step-description">Grado y estudiante</span>
                            </div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="step-item" data-step="3">
                            <div class="step-circle">
                                <i class="fas fa-file-signature"></i>
                            </div>
                            <div class="step-content">
                                <span class="step-title">Permiso</span>
                                <span class="step-description">Detalles y horarios</span>
                            </div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="step-item" data-step="4">
                            <div class="step-circle">
                                <i class="fas fa-check"></i>
                            </div>
                            <div class="step-content">
                                <span class="step-title">Confirmación</span>
                                <span class="step-description">Revisar y enviar</span>
                            </div>
                        </div>
                    </div>

                    <!-- Stepper Content -->
                    <form id="permisoForm" class="stepper-form">
                        <!-- Paso 1: Información del Acudiente -->
                        <div class="step-panel active" data-step="1">
                            <div class="panel-header">
                                <h3>👨‍👩‍👧‍👦 Información del Acudiente</h3>
                                <p>Por favor, proporcione sus datos como padre de familia o acudiente</p>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="nombreAcudientePermiso">Nombre completo *</label>
                                    <input type="text" id="nombreAcudientePermiso" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="emailAcudientePermiso">Correo electrónico *</label>
                                    <input type="email" id="emailAcudientePermiso" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="telefonoAcudientePermiso">Teléfono de contacto *</label>
                                    <input type="tel" id="telefonoAcudientePermiso" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="perfilAcudientePermiso">Perfil/Relación con el estudiante *</label>
                                    <select id="perfilAcudientePermiso" required>
                                        <option value="">Seleccionar...</option>
                                        <option value="padre">Padre</option>
                                        <option value="madre">Madre</option>
                                        <option value="abuelo">Abuelo/a</option>
                                        <option value="tio">Tío/a</option>
                                        <option value="tutor">Tutor Legal</option>
                                        <option value="otro">Otro Familiar</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Paso 2: Información del Estudiante -->
                        <div class="step-panel" data-step="2">
                            <div class="panel-header">
                                <h3>🎓 Información del Estudiante</h3>
                                <p>Seleccione el grado y el estudiante para quien solicita el permiso</p>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="gradoPermiso">Grado *</label>
                                    <select id="gradoPermiso" required>
                                        <option value="">Seleccionar grado...</option>
                                        <option value="Preescolar">Preescolar</option>
                                        <option value="1°">1°</option>
                                        <option value="2°">2°</option>
                                        <option value="3°">3°</option>
                                        <option value="4°">4°</option>
                                        <option value="5°">5°</option>
                                        <option value="6°">6°</option>
                                        <option value="7°">7°</option>
                                        <option value="8°">8°</option>
                                        <option value="9°">9°</option>
                                        <option value="10°">10°</option>
                                        <option value="11°">11°</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="estudiantePermiso">Estudiante *</label>
                                    <select id="estudiantePermiso" required disabled>
                                        <option value="">Seleccione un grado primero</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div id="estudianteInfoPermiso" class="estudiante-info" style="display: none;">
                                <div class="info-card">
                                    <h4>📋 Información del Estudiante</h4>
                                    <div class="info-grid">
                                        <div class="info-item">
                                            <span class="info-label">Nombre:</span>
                                            <span class="info-value" id="infoNombrePermiso">-</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Grado:</span>
                                            <span class="info-value" id="infoGradoPermiso">-</span>
                                        </div>
                                        <div class="info-item">
                                            <span class="info-label">Código:</span>
                                            <span class="info-value" id="infoCodigoPermiso">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Paso 3: Detalles del Permiso -->
                        <div class="step-panel" data-step="3">
                            <div class="panel-header">
                                <h3>🕐 Detalles del Permiso</h3>
                                <p>Proporcione la información específica sobre el permiso solicitado</p>
                            </div>
                            
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="fechaPermiso">Fecha del permiso *</label>
                                    <input type="date" id="fechaPermiso" required>
                                    <small class="form-help">Solo se permiten fechas de hoy en adelante</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="tipoPermiso">Tipo de permiso *</label>
                                    <select id="tipoPermiso" required>
                                        <option value="">Seleccionar...</option>
                                        <option value="salida_anticipada">Salida Anticipada</option>
                                        <option value="llegada_tardia">Llegada Tardía</option>
                                        <option value="ausencia_parcial">Ausencia Parcial</option>
                                        <option value="ausencia_completa">Ausencia Día Completo</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="horaSalida">Hora de salida *</label>
                                    <input type="time" id="horaSalida" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="horaRegreso">Hora de regreso</label>
                                    <input type="time" id="horaRegreso">
                                    <small class="form-help">Solo si aplica (ausencia parcial)</small>
                                </div>
                                
                                <div class="form-group span-2">
                                    <label for="motivoPermiso">Motivo del permiso *</label>
                                    <textarea id="motivoPermiso" rows="4" required placeholder="Describa detalladamente el motivo del permiso..."></textarea>
                                </div>
                                
                                <div class="form-group span-2">
                                    <label for="lugarDestino">Lugar de destino</label>
                                    <input type="text" id="lugarDestino" placeholder="¿A dónde se dirige el estudiante?">
                                </div>
                                
                                <div class="form-group span-2">
                                    <label for="personaRecoge">Persona que recoge al estudiante</label>
                                    <input type="text" id="personaRecoge" placeholder="Nombre completo de quien recogerá al estudiante">
                                </div>
                            </div>
                        </div>

                        <!-- Paso 4: Confirmación -->
                        <div class="step-panel" data-step="4">
                            <div class="panel-header">
                                <h3>✅ Revisar y Confirmar</h3>
                                <p>Verifique que toda la información sea correcta antes de enviar</p>
                            </div>
                            
                            <div class="review-section">
                                <div class="review-card">
                                    <h4><i class="fas fa-user"></i> Información del Acudiente</h4>
                                    <div class="review-grid">
                                        <div class="review-item">
                                            <span class="review-label">Nombre:</span>
                                            <span class="review-value" id="reviewNombreAcudientePermiso">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Email:</span>
                                            <span class="review-value" id="reviewEmailAcudientePermiso">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Teléfono:</span>
                                            <span class="review-value" id="reviewTelefonoAcudientePermiso">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Perfil:</span>
                                            <span class="review-value" id="reviewPerfilAcudientePermiso">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="review-card">
                                    <h4><i class="fas fa-graduation-cap"></i> Información del Estudiante</h4>
                                    <div class="review-grid">
                                        <div class="review-item">
                                            <span class="review-label">Estudiante:</span>
                                            <span class="review-value" id="reviewEstudiantePermiso">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Grado:</span>
                                            <span class="review-value" id="reviewGradoPermiso">-</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="review-card">
                                    <h4><i class="fas fa-file-signature"></i> Detalles del Permiso</h4>
                                    <div class="review-grid">
                                        <div class="review-item">
                                            <span class="review-label">Fecha:</span>
                                            <span class="review-value" id="reviewFechaPermiso">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Tipo:</span>
                                            <span class="review-value" id="reviewTipoPermiso">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Horario:</span>
                                            <span class="review-value" id="reviewHorarioPermiso">-</span>
                                        </div>
                                        <div class="review-item">
                                            <span class="review-label">Persona que recoge:</span>
                                            <span class="review-value" id="reviewPersonaRecoge">-</span>
                                        </div>
                                        <div class="review-item span-2">
                                            <span class="review-label">Motivo:</span>
                                            <span class="review-value" id="reviewMotivoPermiso">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Botones de Navegación -->
                        <div class="stepper-navigation">
                            <button type="button" id="prevStepBtnPermiso" class="btn-secondary" style="display: none;">
                                <i class="fas fa-chevron-left"></i> Anterior
                            </button>
                            <div class="step-indicator">
                                <span id="currentStepTextPermiso">Paso 1 de 4</span>
                            </div>
                            <button type="button" id="nextStepBtnPermiso" class="btn-primary">
                                Siguiente <i class="fas fa-chevron-right"></i>
                            </button>
                            <button type="submit" id="submitFormBtnPermiso" class="btn-success" style="display: none;">
                                <i class="fas fa-paper-plane"></i> Enviar Permiso
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>

        <!-- Vista Consultar Radicado -->
        <section id="consultarView" class="view">
            <div class="container">
                <div class="form-header">
                    <h2>Consultar por Número de Radicado</h2>
                </div>
                
                <div class="search-container">
                    <div class="search-box">
                        <input type="text" id="numeroRadicado" placeholder="Ingrese el número de radicado">
                        <button id="buscarBtn" class="btn-primary">
                            <i class="fas fa-search"></i> Buscar
                        </button>
                    </div>
                </div>
                
                <div id="resultadoConsulta" class="resultado-container" style="display: none;">
                    <!-- Aquí se mostrará el resultado de la consulta -->
                </div>
            </div>
        </section>

        <!-- Vista Login -->
        <section id="loginView" class="view">
            <div class="container">
                <div class="login-container">
                    <h2>Acceso al Sistema</h2>
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="usuario">Usuario:</label>
                            <input type="text" id="usuario" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Contraseña:</label>
                            <input type="password" id="password" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="tipoUsuario">Tipo de Usuario:</label>
                            <select id="tipoUsuario" required>
                                <option value="">Seleccionar...</option>
                                <option value="coordinador">Coordinador/Directora Académica</option>
                                <option value="docente">Docente</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        
                        <button type="submit" class="btn-primary">Iniciar Sesión</button>
                    </form>
                </div>
            </div>
        </section>

        <!-- Vista Dashboard Coordinador -->
        <section id="coordinadorView" class="view">
            <div class="container">
                <div class="dashboard-header">
                    <h2>Panel de Coordinación</h2>
                    <button id="logoutBtn" class="btn-secondary">Cerrar Sesión</button>
                </div>
                
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <h3>Solicitudes Pendientes</h3>
                        <span class="stat-number" id="pendientesCount">0</span>
                    </div>
                    <div class="stat-card">
                        <h3>Aprobadas Hoy</h3>
                        <span class="stat-number" id="aprobadasHoy">0</span>
                    </div>
                    <div class="stat-card">
                        <h3>Total del Mes</h3>
                        <span class="stat-number" id="totalMes">0</span>
                    </div>
                </div>
                
                <div class="solicitudes-list">
                    <h3>Solicitudes Pendientes de Revisión</h3>
                    <div id="listaSolicitudes">
                        <!-- Aquí se cargarán las solicitudes -->
                    </div>
                </div>
            </div>
        </section>

        <!-- Vista Dashboard Docente -->
        <section id="docenteView" class="view">
            <div class="container">
                <div class="dashboard-header">
                    <h2>Panel de Validación Docente</h2>
                    <button id="logoutDocenteBtn" class="btn-secondary">Cerrar Sesión</button>
                </div>
                
                <div class="docente-filters">
                    <select id="filtroGrado">
                        <option value="">Todos los grados</option>
                        <option value="Preescolar">Preescolar</option>
                        <option value="1°">1°</option>
                        <option value="2°">2°</option>
                        <option value="3°">3°</option>
                        <option value="4°">4°</option>
                        <option value="5°">5°</option>
                        <option value="6°">6°</option>
                        <option value="7°">7°</option>
                        <option value="8°">8°</option>
                        <option value="9°">9°</option>
                        <option value="10°">10°</option>
                        <option value="11°">11°</option>
                    </select>
                </div>
                
                <div class="solicitudes-docente" id="solicitudesDocente">
                    <!-- Aquí se cargarán las solicitudes aprobadas para validación -->
                </div>
            </div>
        </section>

        <!-- Vista Dashboard Admin -->
        <section id="adminView" class="view">
            <div class="container">
                <div class="dashboard-header">
                    <h2>Panel de Administración</h2>
                    <button id="logoutAdminBtn" class="btn-secondary">Cerrar Sesión</button>
                </div>
                
                <div class="admin-stats">
                    <div class="stat-card">
                        <h3>Total Solicitudes</h3>
                        <span class="stat-number" id="totalSolicitudes">0</span>
                    </div>
                    <div class="stat-card">
                        <h3>Tasa de Aprobación</h3>
                        <span class="stat-number" id="tasaAprobacion">0%</span>
                    </div>
                    <div class="stat-card">
                        <h3>Promedio Diario</h3>
                        <span class="stat-number" id="promedioDiario">0</span>
                    </div>
                </div>
                
                <div class="admin-actions">
                    <button id="adminExcusasBtn" class="btn-success">Excusas</button>
                    <button id="adminPermisosBtn" class="btn-success">Permisos</button>
                    <button id="adminDiagnosticoBtn" class="btn-primary">
                        <i class="fas fa-stethoscope"></i> Diagnóstico
                    </button>
                </div>

                <div class="admin-charts">
                    <div class="chart-container">
                        <h3>Grados con más solicitudes</h3>
                        <div id="gradosChart"></div>
                    </div>
                    <div class="chart-container">
                        <h3>Histórico mensual</h3>
                        <div id="historicoChart"></div>
                    </div>
                </div>

                <div class="admin-filters">
                    <div class="toggle-fecha">
                        <input type="checkbox" id="toggleFecha">
                        <label for="toggleFecha">Filtrar por fecha</label>
                    </div>
                    <div class="date-range" id="fechaFilters" style="display:none;">
                        <label>Desde <input type="date" id="adminFechaInicio"></label>
                        <label>Hasta <input type="date" id="adminFechaFin"></label>
                        <button id="aplicarFiltroFecha" class="btn-secondary">Aplicar</button>
                    </div>
                </div>

                <div class="admin-solicitudes">
                    <h3>Listado de Solicitudes</h3>
                    <div id="adminSolicitudes"></div>
                </div>
            </div>
        </section>

        <section id="adminExcusasView" class="view">
            <div class="container">
                <div class="form-header">
                    <button id="backToAdminExcusas" class="btn-secondary">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                    <h2>Excusas Registradas</h2>
                </div>

                <div class="admin-filters">
                    <div class="toggle-fecha">
                        <input type="checkbox" id="toggleFechaExcusas">
                        <label for="toggleFechaExcusas">Filtrar por fecha</label>
                    </div>
                    <div class="date-range" id="fechaFiltersExcusas" style="display:none;">
                        <label>Desde <input type="date" id="excusasFechaInicio"></label>
                        <label>Hasta <input type="date" id="excusasFechaFin"></label>
                        <button id="aplicarFiltroExcusas" class="btn-secondary">Aplicar</button>
                    </div>
                </div>

                <div class="admin-solicitudes">
                    <h3>Listado de Excusas</h3>
                    <div id="adminExcusasList"></div>
                </div>
            </div>
        </section>

        <section id="adminPermisosView" class="view">
            <div class="container">
                <div class="form-header">
                    <button id="backToAdminPermisos" class="btn-secondary">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                    <h2>Permisos Registrados</h2>
                </div>

                <div class="admin-filters">
                    <div class="toggle-fecha">
                        <input type="checkbox" id="toggleFechaPermisos">
                        <label for="toggleFechaPermisos">Filtrar por fecha</label>
                    </div>
                    <div class="date-range" id="fechaFiltersPermisos" style="display:none;">
                        <label>Desde <input type="date" id="permisosFechaInicio"></label>
                        <label>Hasta <input type="date" id="permisosFechaFin"></label>
                        <button id="aplicarFiltroPermisos" class="btn-secondary">Aplicar</button>
                    </div>
                </div>

                <div class="admin-solicitudes">
                    <h3>Listado de Permisos</h3>
                    <div id="adminPermisosList"></div>
                </div>
            </div>
        </section>
    </main>

    <!-- Modales -->
    <!-- Modal Protección de Datos -->
    <div id="modalProteccionDatos" class="modal">
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3>🔐 Autorización de Tratamiento de Datos Personales</h3>
                <p class="modal-subtitle">Colegio Franciscano Agustín Gemelli</p>
            </div>
            <div class="modal-body">
                <div class="politica-container">
                    <div class="politica-section">
                        <h4>📋 Identificación del Responsable</h4>
                        <p><strong>Razón Social:</strong> Colegio Franciscano Agustín Gemelli</p>
                        <p><strong>Dirección:</strong> Carrera 13 # 03-90, Barrio La Francia, Manizales, Caldas</p>
                        <p><strong>Teléfono:</strong> +57 (6) 888-4616</p>
                        <p><strong>Correo:</strong> rectoriagemelli@colegiosfranciscanos.com</p>
                    </div>

                    <div class="politica-section">
                        <h4>🎯 Finalidades del Tratamiento</h4>
                        <p>Los datos personales recolectados serán utilizados para:</p>
                        <ul>
                            <li>Gestionar solicitudes de excusas y permisos estudiantiles</li>
                            <li>Realizar seguimiento académico y de convivencia</li>
                            <li>Comunicación con padres de familia y acudientes</li>
                            <li>Cumplimiento de obligaciones legales y contractuales</li>
                            <li>Archivo y conservación histórica institucional</li>
                        </ul>
                    </div>

                    <div class="politica-section">
                        <h4>⚖️ Base Legal</h4>
                        <p>El tratamiento se fundamenta en:</p>
                        <ul>
                            <li>Ley 1581 de 2012 de Protección de Datos Personales</li>
                            <li>Decreto 1377 de 2013</li>
                            <li>Ley 1098 de 2006 (Código de Infancia y Adolescencia)</li>
                            <li>Consentimiento libre, previo, expreso e informado</li>
                        </ul>
                    </div>

                    <div class="politica-section">
                        <h4>👨‍👩‍👧‍👦 Tratamiento de Datos de Menores</h4>
                        <p>Para estudiantes menores de edad, el tratamiento requiere autorización de padres o representantes legales, garantizando el interés superior del menor y sus derechos fundamentales.</p>
                    </div>

                    <div class="politica-section">
                        <h4>📅 Conservación de Datos</h4>
                        <p>Los datos se conservarán durante la relación educativa y hasta 10 años posteriores para cumplir obligaciones legales, contables y de archivo histórico institucional.</p>
                    </div>

                    <div class="politica-section">
                        <h4>🛡️ Sus Derechos como Titular</h4>
                        <p>Usted tiene derecho a:</p>
                        <ul>
                            <li><strong>Conocer, actualizar y rectificar</strong> sus datos personales</li>
                            <li><strong>Solicitar prueba</strong> de la autorización otorgada</li>
                            <li><strong>Ser informado</strong> sobre el uso dado a sus datos</li>
                            <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio</li>
                            <li><strong>Revocar la autorización</strong> y solicitar supresión cuando sea procedente</li>
                            <li><strong>Acceder gratuitamente</strong> a sus datos personales</li>
                        </ul>
                    </div>

                    <div class="politica-section">
                        <h4>📞 Ejercicio de Derechos</h4>
                        <p>Para ejercer sus derechos, diríjase a:</p>
                        <p><strong>Correo:</strong> habeasdata@colegiosfranciscanos.com</p>
                        <p><strong>Dirección:</strong> Carrera 13 # 03-90, Manizales, Caldas</p>
                        <p><strong>Horario:</strong> Lunes a viernes de 7:00 AM a 4:00 PM</p>
                    </div>

                    <div class="politica-section">
                        <h4>🔒 Medidas de Seguridad</h4>
                        <p>Implementamos medidas técnicas, humanas y administrativas para proteger sus datos contra pérdida, alteración, acceso no autorizado o uso fraudulento.</p>
                    </div>
                </div>
                
                <div class="autorizacion-final">
                    <div class="checkbox-group-large">
                        <input type="checkbox" id="aceptoProteccion">
                        <label for="aceptoProteccion">
                            <strong>Declaro que:</strong> He leído, entendido y acepto la presente política de tratamiento de datos personales. Autorizo de manera libre, previa, expresa e informada al Colegio Franciscano Agustín Gemelli para el tratamiento de mis datos personales y los del estudiante (si soy su representante legal) conforme a las finalidades aquí descritas.
                        </label>
                    </div>
                    
                    <div class="checkbox-group-large">
                        <input type="checkbox" id="menorEdad">
                        <label for="menorEdad">
                            Si el estudiante es menor de edad, confirmo que actúo como padre, madre o representante legal y tengo la facultad para otorgar esta autorización en representación del menor.
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="cancelarProteccion" class="btn-secondary">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button id="aceptarProteccion" class="btn-primary" disabled>
                    <i class="fas fa-check"></i> Acepto y Continúo
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Radicado Generado -->
    <div id="modalRadicado" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>✅ Solicitud Enviada Exitosamente</h3>
            </div>
            <div class="modal-body">
                <div class="radicado-info">
                    <p>Su solicitud ha sido registrada con el siguiente número de radicado:</p>
                    <div class="radicado-number" id="numeroRadicadoGenerado"></div>
                    <p>Guarde este número para consultar el estado de su solicitud.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button id="cerrarModalRadicado" class="btn-primary">Entendido</button>
            </div>
        </div>
    </div>

    <!-- Modal Confirmación Coordinador -->
    <div id="modalConfirmacion" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="tituloConfirmacion">Confirmar Acción</h3>
            </div>
            <div class="modal-body">
                <p id="mensajeConfirmacion"></p>
                <div class="form-group" id="observacionesGroup" style="display: none;">
                    <label for="observaciones">Observaciones:</label>
                    <textarea id="observaciones" rows="3"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button id="cancelarAccion" class="btn-secondary">Cancelar</button>
                <button id="confirmarAccion" class="btn-primary">Confirmar</button>
            </div>
        </div>
    </div>

    <!-- Modal Detalle Solicitud -->
    <div id="modalDetalleSolicitud" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Detalle de Solicitud</h3>
            </div>
            <div class="modal-body" id="detalleSolicitudBody"></div>
            <div class="modal-footer">
                <button id="cerrarDetalleSolicitud" class="btn-primary">Cerrar</button>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <p>© 2025 Sistema de Excusas y Permisos - Colegio Gemelli Franciscanos</p>
        </div>
    </footer>

    <!-- ========== CORRECCIÓN: Scripts en orden correcto ========== -->
    <script>
        // Hacer Supabase disponible globalmente
        window.supabase = window.supabase || supabase;
    </script>
    <script src="env.js"></script>
    <script src="app.js"></script>
</body>
</html>
