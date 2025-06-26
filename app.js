// Configuración de Supabase
const SUPABASE_URL = 'https://nbpldfyisdhgnkmgwaix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icGxkZnlpc2RoZ25rbWd3YWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjY1MTUsImV4cCI6MjA2NjU0MjUxNX0.Pe4ImgTYLmRqOqG-RdhJI2SY0QPl_cyBENOxKvZB0DY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables globales
let currentUser = null;
let currentStep = 1;
let currentFormType = null;
let estudiantes = [];
let currentAutorizacion = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    setupEventListeners();
    setFechaActual();
    await loadEstudiantes();
}

function setupEventListeners() {
    // Login modal
    document.getElementById('loginBtn').addEventListener('click', showLoginModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Cerrar modales
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Home options
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', handleOptionClick);
    });
    
    // Navigation
    document.getElementById('backToHome').addEventListener('click', showHomeScreen);
    document.getElementById('backFromConsulta').addEventListener('click', showHomeScreen);
    document.getElementById('backFromCoordinador').addEventListener('click', showHomeScreen);
    document.getElementById('backFromDocente').addEventListener('click', showHomeScreen);
    
    // Stepper navigation
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('mainForm').addEventListener('submit', handleFormSubmit);
    
    // Consulta
    document.getElementById('searchBtn').addEventListener('click', buscarRadicado);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });
    
    // Autorización modal
    document.getElementById('autorizarBtn').addEventListener('click', autorizarSolicitud);
    document.getElementById('rechazarBtn').addEventListener('click', rechazarSolicitud);
    
    // Trabajos modal
    document.getElementById('guardarTrabajoBtn').addEventListener('click', guardarTrabajo);
    document.getElementById('cancelarTrabajoBtn').addEventListener('click', () => closeModal());
}

function setFechaActual() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaSolicitud').value = today;
}

// Funciones de autenticación
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const tipoUsuario = document.getElementById('tipoUsuario').value;
    
    try {
        // Buscar usuario en la base de datos
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .eq('tipo_usuario', tipoUsuario)
            .single();
        
        if (error || !usuario) {
            // Si no existe, crear usuario
            const { data: nuevoUsuario, error: createError } = await supabase
                .from('usuarios')
                .insert([
                    {
                        email: email,
                        nombre: email.split('@')[0], // Usar parte del email como nombre temporal
                        tipo_usuario: tipoUsuario
                    }
                ])
                .select()
                .single();
            
            if (createError) {
                alert('Error al crear usuario: ' + createError.message);
                return;
            }
            
            currentUser = nuevoUsuario;
        } else {
            currentUser = usuario;
        }
        
        // Actualizar UI según tipo de usuario
        updateUIForUser();
        closeModal();
        
        // Cargar datos específicos del usuario
        if (tipoUsuario === 'padre') {
            await loadEstudiantes();
        }
        
    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
    }
}

function updateUIForUser() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'block';
    
    // Mostrar/ocultar opciones según tipo de usuario
    if (currentUser.tipo_usuario === 'coordinador') {
        document.querySelector('.coordinador-only').style.display = 'block';
    } else if (currentUser.tipo_usuario === 'docente') {
        document.querySelector('.docente-only').style.display = 'block';
    }
}

function logout() {
    currentUser = null;
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'none';
    
    // Ocultar opciones específicas
    document.querySelector('.coordinador-only').style.display = 'none';
    document.querySelector('.docente-only').style.display = 'none';
    
    showHomeScreen();
}

// Funciones de navegación
function showHomeScreen() {
    hideAllScreens();
    document.getElementById('homeScreen').style.display = 'block';
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
}

function handleOptionClick(e) {
    const option = e.currentTarget.dataset.option;
    
    if (!currentUser && option !== 'consultar') {
        alert('Debe iniciar sesión para acceder a esta función');
        showLoginModal();
        return;
    }
    
    switch (option) {
        case 'permiso':
            showStepperForm('permiso');
            break;
        case 'excusa':
            showStepperForm('excusa');
            break;
        case 'consultar':
            showConsultaScreen();
            break;
        case 'coordinador':
            showCoordinadorScreen();
            break;
        case 'docente':
            showDocenteScreen();
            break;
    }
}

// Funciones del stepper form
function showStepperForm(type) {
    currentFormType = type;
    currentStep = 1;
    
    hideAllScreens();
    document.getElementById('stepperScreen').style.display = 'block';
    
    // Configurar formulario según tipo
    const formTitle = document.getElementById('formTitle');
    const permisoFields = document.querySelector('.permiso-fields');
    const excusaFields = document.querySelector('.excusa-fields');
    
    if (type === 'permiso') {
        formTitle.textContent = 'Solicitar Permiso';
        permisoFields.style.display = 'block';
        excusaFields.style.display = 'none';
    } else {
        formTitle.textContent = 'Registrar Excusa';
        permisoFields.style.display = 'none';
        excusaFields.style.display = 'block';
    }
    
    updateStepperUI();
}

function updateStepperUI() {
    // Actualizar indicadores de paso
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNum <= currentStep);
        step.classList.toggle('completed', stepNum < currentStep);
    });
    
    // Mostrar contenido del paso actual
    document.querySelectorAll('.step-content').forEach(content => {
        const stepNum = parseInt(content.dataset.step);
        content.classList.toggle('active', stepNum === currentStep);
    });
    
    // Actualizar botones de navegación
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    nextBtn.style.display = currentStep < 3 ? 'block' : 'none';
    submitBtn.style.display = currentStep === 3 ? 'block' : 'none';
    
    // Si estamos en el paso 3, mostrar confirmación
    if (currentStep === 3) {
        showConfirmation();
    }
}

function nextStep() {
    if (validateCurrentStep()) {
        currentStep++;
        updateStepperUI();
    }
}

function prevStep() {
    currentStep--;
    updateStepperUI();
}

function validateCurrentStep() {
    if (currentStep === 1) {
        const fechaSolicitud = document.getElementById('fechaSolicitud').value;
        const estudiante = document.getElementById('estudiante').value;
        
        if (!fechaSolicitud || !estudiante) {
            alert('Por favor complete todos los campos obligatorios');
            return false;
        }
    } else if (currentStep === 2) {
        if (currentFormType === 'permiso') {
            const motivo = document.getElementById('motivoPermiso').value;
            if (!motivo.trim()) {
                alert('Por favor ingrese el motivo del permiso');
                return false;
            }
        } else {
            const diasInasistencia = document.getElementById('diasInasistencia').value;
            const mes = document.getElementById('mesInasistencia').value;
            const motivo = document.getElementById('motivoExcusa').value;
            
            if (!diasInasistencia.trim() || !mes || !motivo.trim()) {
                alert('Por favor complete todos los campos obligatorios');
                return false;
            }
        }
    }
    
    return true;
}

function showConfirmation() {
    const detailsDiv = document.getElementById('confirmationDetails');
    const estudianteSelect = document.getElementById('estudiante');
    const estudianteNombre = estudianteSelect.options[estudianteSelect.selectedIndex].text;
    
    let html = `
        <div class="confirmation-item">
            <strong>Fecha de Solicitud:</strong> ${document.getElementById('fechaSolicitud').value}
        </div>
        <div class="confirmation-item">
            <strong>Estudiante:</strong> ${estudianteNombre}
        </div>
    `;
    
    if (currentFormType === 'permiso') {
        html += `
            <div class="confirmation-item">
                <strong>Motivo:</strong> ${document.getElementById('motivoPermiso').value}
            </div>
            <div class="confirmation-item">
                <strong>Hora de Salida:</strong> ${document.getElementById('horaSalida').value || 'No especificada'}
            </div>
            <div class="confirmation-item">
                <strong>Hora de Regreso:</strong> ${document.getElementById('horaRegreso').value || 'No especificada'}
            </div>
        `;
    } else {
        const certificado = document.getElementById('certificadoMedico').checked;
        const incapacidad = document.getElementById('incapacidad').checked;
        
        html += `
            <div class="confirmation-item">
                <strong>Días de Inasistencia:</strong> ${document.getElementById('diasInasistencia').value}
            </div>
            <div class="confirmation-item">
                <strong>Mes:</strong> ${document.getElementById('mesInasistencia').value}
            </div>
            <div class="confirmation-item">
                <strong>Motivo:</strong> ${document.getElementById('motivoExcusa').value}
            </div>
            <div class="confirmation-item">
                <strong>Documentación:</strong> ${certificado ? 'Certificado Médico' : ''} ${incapacidad ? 'Incapacidad' : ''}
            </div>
        `;
    }
    
    detailsDiv.innerHTML = html;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (currentStep !== 3) return;
    
    try {
        const estudianteId = document.getElementById('estudiante').value;
        const fechaSolicitud = document.getElementById('fechaSolicitud').value;
        
        let result;
        
        if (currentFormType === 'permiso') {
            const data = {
                estudiante_id: estudianteId,
                padre_id: currentUser.id,
                fecha_solicitud: fechaSolicitud,
                motivo: document.getElementById('motivoPermiso').value,
                hora_salida: document.getElementById('horaSalida').value || null,
                hora_regreso: document.getElementById('horaRegreso').value || null
            };
            
            result = await supabase
                .from('permisos')
                .insert([data])
                .select()
                .single();
        } else {
            const data = {
                estudiante_id: estudianteId,
                padre_id: currentUser.id,
                fecha_solicitud: fechaSolicitud,
                dias_inasistencia: document.getElementById('diasInasistencia').value,
                mes: document.getElementById('mesInasistencia').value,
                motivo: document.getElementById('motivoExcusa').value,
                certificado_medico: document.getElementById('certificadoMedico').checked,
                incapacidad: document.getElementById('incapacidad').checked
            };
            
            result = await supabase
                .from('excusas')
                .insert([data])
                .select()
                .single();
        }
        
        if (result.error) {
            alert('Error al enviar la solicitud: ' + result.error.message);
            return;
        }
        
        alert(`Solicitud enviada exitosamente.\nRadicado: ${result.data.radicado}`);
        
        // Limpiar formulario y volver al inicio
        document.getElementById('mainForm').reset();
        setFechaActual();
        showHomeScreen();
        
    } catch (error) {
        alert('Error al procesar la solicitud: ' + error.message);
    }
}

// Funciones de carga de datos
async function loadEstudiantes() {
    if (!currentUser || currentUser.tipo_usuario !== 'padre') return;
    
    try {
        const { data, error } = await supabase
            .from('estudiantes')
            .select(`
                *,
                grados (nombre)
            `)
            .eq('padre_id', currentUser.id);
        
        if (error) {
            console.error('Error al cargar estudiantes:', error);
            return;
        }
        
        estudiantes = data || [];
        
        // Actualizar select de estudiantes
        const select = document.getElementById('estudiante');
        select.innerHTML = '<option value="">Seleccione un estudiante...</option>';
        
        estudiantes.forEach(estudiante => {
            const option = document.createElement('option');
            option.value = estudiante.id;
            option.textContent = `${estudiante.nombre} (${estudiante.grados?.nombre || 'Sin grado'})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
    }
}

// Función de consulta
function showConsultaScreen() {
    hideAllScreens();
    document.getElementById('consultaScreen').style.display = 'block';
}

async function buscarRadicado() {
    const radicado = document.getElementById('radicadoSearch').value.trim();
    const resultadoDiv = document.getElementById('resultadoConsulta');
    
    if (!radicado) {
        alert('Por favor ingrese un número de radicado');
        return;
    }
    
    try {
        // Buscar en permisos
        const { data: permiso } = await supabase
            .from('permisos')
            .select(`
                *,
                estudiantes (nombre, grados (nombre)),
                usuarios (nombre)
            `)
            .eq('radicado', radicado)
            .single();
        
        // Buscar en excusas
        const { data: excusa } = await supabase
            .from('excusas')
            .select(`
                *,
                estudiantes (nombre, grados (nombre)),
                usuarios (nombre)
            `)
            .eq('radicado', radicado)
            .single();
        
        const solicitud = permiso || excusa;
        const tipo = permiso ? 'Permiso' : 'Excusa';
        
        if (!solicitud) {
            resultadoDiv.innerHTML = '<p class="error">No se encontró ninguna solicitud con ese radicado.</p>';
            resultadoDiv.style.display = 'block';
            return;
        }
        
        let html = `
            <div class="solicitud-card">
                <h3>${tipo} - ${solicitud.radicado}</h3>
                <div class="solicitud-details">
                    <p><strong>Estudiante:</strong> ${solicitud.estudiantes.nombre}</p>
                    <p><strong>Grado:</strong> ${solicitud.estudiantes.grados.nombre}</p>
                    <p><strong>Fecha de Solicitud:</strong> ${new Date(solicitud.fecha_solicitud).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> <span class="estado-${solicitud.estado}">${getEstadoTexto(solicitud.estado)}</span></p>
        `;
        
        if (tipo === 'Permiso') {
            html += `
                <p><strong>Motivo:</strong> ${solicitud.motivo}</p>
                <p><strong>Hora de Salida:</strong> ${solicitud.hora_salida || 'No especificada'}</p>
                <p><strong>Hora de Regreso:</strong> ${solicitud.hora_regreso || 'No especificada'}</p>
            `;
        } else {
            html += `
                <p><strong>Días de Inasistencia:</strong> ${solicitud.dias_inasistencia}</p>
                <p><strong>Mes:</strong> ${solicitud.mes}</p>
                <p><strong>Motivo:</strong> ${solicitud.motivo}</p>
            `;
            
            // Mostrar trabajos pendientes si existen
            if (solicitud.estado === 'en_revision_docentes' || solicitud.estado === 'finalizado') {
                const { data: trabajos } = await supabase
                    .from('trabajos_pendientes')
                    .select(`
                        *,
                        autorizaciones_docentes (
                            asignaturas (nombre),
                            usuarios (nombre)
                        )
                    `)
                    .eq('autorizacion_docente_id', solicitud.id);
                
                if (trabajos && trabajos.length > 0) {
                    html += '<h4>Trabajos Pendientes:</h4><ul>';
                    trabajos.forEach(trabajo => {
                        html += `
                            <li>
                                <strong>${trabajo.autorizaciones_docentes.asignaturas.nombre}</strong> - 
                                ${trabajo.descripcion} 
                                (Entrega: ${new Date(trabajo.fecha_entrega).toLocaleDateString()})
                                ${trabajo.completado ? ' ✅' : ' ⏳'}
                            </li>
                        `;
                    });
                    html += '</ul>';
                }
            }
        }
        
        html += `
                </div>
            </div>
        `;
        
        resultadoDiv.innerHTML = html;
        resultadoDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Error al buscar radicado:', error);
        resultadoDiv.innerHTML = '<p class="error">Error al buscar la solicitud.</p>';
        resultadoDiv.style.display = 'block';
    }
}

function getEstadoTexto(estado) {
    const estados = {
        'pendiente': 'Pendiente de Revisión',
        'autorizado_coordinador': 'Autorizado por Coordinador',
        'en_revision_docentes': 'En Revisión por Docentes',
        'finalizado': 'Finalizado',
        'rechazado': 'Rechazado'
    };
    
    return estados[estado] || estado;
}

// Panel del Coordinador
function showCoordinadorScreen() {
    if (!currentUser || currentUser.tipo_usuario !== 'coordinador') {
        alert('Acceso restringido a coordinadores');
        return;
    }
    
    hideAllScreens();
    document.getElementById('coordinadorScreen').style.display = 'block';
    loadPermisosPendientes();
    loadExcusasPendientes();
}

function handleTabClick(e) {
    const tabName = e.target.dataset.tab;
    
    // Actualizar botones de tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Mostrar contenido de tab
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
}

async function loadPermisosPendientes() {
    try {
        const { data, error } = await supabase
            .from('permisos')
            .select(`
                *,
                estudiantes (nombre, grados (nombre)),
                usuarios (nombre)
            `)
            .eq('estado', 'pendiente')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error al cargar permisos:', error);
            return;
        }
        
        renderSolicitudes(data, 'permisosPendientes', 'permiso');
        
    } catch (error) {
        console.error('Error al cargar permisos:', error);
    }
}

async function loadExcusasPendientes() {
    try {
        const { data, error } = await supabase
            .from('excusas')
            .select(`
                *,
                estudiantes (nombre, grados (nombre)),
                usuarios (nombre)
            `)
            .eq('estado', 'pendiente')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error al cargar excusas:', error);
            return;
        }
        
        renderSolicitudes(data, 'excusasPendientes', 'excusa');
        
    } catch (error) {
        console.error('Error al cargar excusas:', error);
    }
}

function renderSolicitudes(solicitudes, containerId, tipo) {
    const container = document.getElementById(containerId);
    
    if (!solicitudes || solicitudes.length === 0) {
        container.innerHTML = '<p>No hay solicitudes pendientes.</p>';
        return;
    }
    
    let html = '';
    
    solicitudes.forEach(solicitud => {
        html += `
            <div class="solicitud-card">
                <div class="solicitud-header">
                    <h3>${solicitud.radicado}</h3>
                    <span class="estado-${solicitud.estado}">${getEstadoTexto(solicitud.estado)}</span>
                </div>
                <div class="solicitud-details">
                    <p><strong>Estudiante:</strong> ${solicitud.estudiantes.nombre}</p>
                    <p><strong>Grado:</strong> ${solicitud.estudiantes.grados.nombre}</p>
                    <p><strong>Padre:</strong> ${solicitud.usuarios.nombre}</p>
                    <p><strong>Fecha:</strong> ${new Date(solicitud.fecha_solicitud).toLocaleDateString()}</p>
        `;
        
        if (tipo === 'permiso') {
            html += `
                <p><strong>Motivo:</strong> ${solicitud.motivo}</p>
                <p><strong>Horario:</strong> ${solicitud.hora_salida || 'No especificada'} - ${solicitud.hora_regreso || 'No especificada'}</p>
            `;
        } else {
            html += `
                <p><strong>Días:</strong> ${solicitud.dias_inasistencia}</p>
                <p><strong>Mes:</strong> ${solicitud.mes}</p>
                <p><strong>Motivo:</strong> ${solicitud.motivo}</p>
            `;
        }
        
        html += `
                </div>
                <div class="solicitud-actions">
                    <button class="btn btn-primary" onclick="mostrarAutorizacion('${solicitud.id}', '${tipo}')">
                        Revisar
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function mostrarAutorizacion(solicitudId, tipo) {
    try {
        const table = tipo === 'permiso' ? 'permisos' : 'excusas';
        
        const { data, error } = await supabase
            .from(table)
            .select(`
                *,
                estudiantes (nombre, grados (nombre)),
                usuarios (nombre)
            `)
            .eq('id', solicitudId)
            .single();
        
        if (error || !data) {
            alert('Error al cargar los detalles de la solicitud');
            return;
        }
        
        currentAutorizacion = { ...data, tipo };
        
        const modal = document.getElementById('autorizacionModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = `Autorizar ${tipo === 'permiso' ? 'Permiso' : 'Excusa'}`;
        
        let html = `
            <div class="autorizacion-details">
                <p><strong>Radicado:</strong> ${data.radicado}</p>
                <p><strong>Estudiante:</strong> ${data.estudiantes.nombre}</p>
                <p><strong>Grado:</strong> ${data.estudiantes.grados.nombre}</p>
                <p><strong>Padre:</strong> ${data.usuarios.nombre}</p>
                <p><strong>Fecha:</strong> ${new Date(data.fecha_solicitud).toLocaleDateString()}</p>
        `;
        
        if (tipo === 'permiso') {
            html += `
                <p><strong>Motivo:</strong> ${data.motivo}</p>
                <p><strong>Hora de Salida:</strong> ${data.hora_salida || 'No especificada'}</p>
                <p><strong>Hora de Regreso:</strong> ${data.hora_regreso || 'No especificada'}</p>
            `;
        } else {
            html += `
                <p><strong>Días de Inasistencia:</strong> ${data.dias_inasistencia}</p>
                <p><strong>Mes:</strong> ${data.mes}</p>
                <p><strong>Motivo:</strong> ${data.motivo}</p>
                <p><strong>Certificado Médico:</strong> ${data.certificado_medico ? 'Sí' : 'No'}</p>
                <p><strong>Incapacidad:</strong> ${data.incapacidad ? 'Sí' : 'No'}</p>
            `;
        }
        
        html += `
            </div>
            <div class="form-group">
                <label for="observacionesCoordinador">Observaciones:</label>
                <textarea id="observacionesCoordinador" rows="3" placeholder="Ingrese observaciones (opcional)"></textarea>
            </div>
        `;
        
        modalContent.innerHTML = html;
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error al mostrar autorización:', error);
        alert('Error al cargar los detalles');
    }
}

async function autorizarSolicitud() {
    if (!currentAutorizacion) return;
    
    try {
        const observaciones = document.getElementById('observacionesCoordinador').value;
        const table = currentAutorizacion.tipo === 'permiso' ? 'permisos' : 'excusas';
        const nuevoEstado = currentAutorizacion.tipo === 'permiso' ? 'autorizado_coordinador' : 'en_revision_docentes';
        
        const { error } = await supabase
            .from(table)
            .update({
                estado: nuevoEstado,
                autorizado_por_coordinador: true,
                coordinador_id: currentUser.id,
                fecha_autorizacion_coordinador: new Date().toISOString(),
                observaciones_coordinador: observaciones
            })
            .eq('id', currentAutorizacion.id);
        
        if (error) {
            alert('Error al autorizar: ' + error.message);
            return;
        }
        
        // Si es excusa, crear autorizaciones para docentes
        if (currentAutorizacion.tipo === 'excusa') {
            await crearAutorizacionesDocentes(currentAutorizacion.id, currentAutorizacion.estudiantes.grados.id);
        }
        
        alert('Solicitud autorizada exitosamente');
        closeModal();
        
        // Recargar listas
        loadPermisosPendientes();
        loadExcusasPendientes();
        
    } catch (error) {
        console.error('Error al autorizar:', error);
        alert('Error al procesar la autorización');
    }
}

async function rechazarSolicitud() {
    if (!currentAutorizacion) return;
    
    const observaciones = document.getElementById('observacionesCoordinador').value;
    
    if (!observaciones.trim()) {
        alert('Debe proporcionar una razón para el rechazo');
        return;
    }
    
    try {
        const table = currentAutorizacion.tipo === 'permiso' ? 'permisos' : 'excusas';
        
        const { error } = await supabase
            .from(table)
            .update({
                estado: 'rechazado',
                coordinador_id: currentUser.id,
                fecha_autorizacion_coordinador: new Date().toISOString(),
                observaciones_coordinador: observaciones
            })
            .eq('id', currentAutorizacion.id);
        
        if (error) {
            alert('Error al rechazar: ' + error.message);
            return;
        }
        
        alert('Solicitud rechazada');
        closeModal();
        
        // Recargar listas
        loadPermisosPendientes();
        loadExcusasPendientes();
        
    } catch (error) {
        console.error('Error al rechazar:', error);
        alert('Error al procesar el rechazo');
    }
}

async function crearAutorizacionesDocentes(excusaId, gradoId) {
    try {
        // Obtener docentes del grado
        const { data: docentes, error } = await supabase
            .from('docentes_asignaturas')
            .select(`
                docente_id,
                asignatura_id,
                usuarios (nombre),
                asignaturas (nombre)
            `)
            .eq('grado_id', gradoId);
        
        if (error) {
            console.error('Error al obtener docentes:', error);
            return;
        }
        
        // Crear autorizaciones
        const autorizaciones = docentes.map(docente => ({
            excusa_id: excusaId,
            docente_id: docente.docente_id,
            asignatura_id: docente.asignatura_id
        }));
        
        if (autorizaciones.length > 0) {
            const { error: insertError } = await supabase
                .from('autorizaciones_docentes')
                .insert(autorizaciones);
            
            if (insertError) {
                console.error('Error al crear autorizaciones:', insertError);
            }
        }
        
    } catch (error) {
        console.error('Error al crear autorizaciones docentes:', error);
    }
}

// Panel del Docente
function showDocenteScreen() {
    if (!currentUser || currentUser.tipo_usuario !== 'docente') {
        alert('Acceso restringido a docentes');
        return;
    }
    
    hideAllScreens();
    document.getElementById('docenteScreen').style.display = 'block';
    loadExcusasDocente();
}

async function loadExcusasDocente() {
    try {
        const { data, error } = await supabase
            .from('autorizaciones_docentes')
            .select(`
                *,
                excusas (
                    *,
                    estudiantes (nombre, grados (nombre)),
                    usuarios (nombre)
                ),
                asignaturas (nombre)
            `)
            .eq('docente_id', currentUser.id)
            .eq('autorizado', false);
        
        if (error) {
            console.error('Error al cargar excusas:', error);
            return;
        }
        
        renderExcusasDocente(data);
        
    } catch (error) {
        console.error('Error al cargar excusas:', error);
    }
}

function renderExcusasDocente(autorizaciones) {
    const container = document.getElementById('excusasDocente');
    
    if (!autorizaciones || autorizaciones.length === 0) {
        container.innerHTML = '<p>No hay excusas pendientes de autorización.</p>';
        return;
    }
    
    let html = '';
    
    autorizaciones.forEach(auth => {
        const excusa = auth.excusas;
        html += `
            <div class="solicitud-card">
                <div class="solicitud-header">
                    <h3>${excusa.radicado}</h3>
                    <span class="asignatura-tag">${auth.asignaturas.nombre}</span>
                </div>
                <div class="solicitud-details">
                    <p><strong>Estudiante:</strong> ${excusa.estudiantes.nombre}</p>
                    <p><strong>Grado:</strong> ${excusa.estudiantes.grados.nombre}</p>
                    <p><strong>Días de Inasistencia:</strong> ${excusa.dias_inasistencia}</p>
                    <p><strong>Mes:</strong> ${excusa.mes}</p>
                    <p><strong>Motivo:</strong> ${excusa.motivo}</p>
                </div>
                <div class="solicitud-actions">
                    <button class="btn btn-primary" onclick="autorizarExcusaDocente('${auth.id}')">
                        Autorizar y Asignar Trabajos
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function autorizarExcusaDocente(autorizacionId) {
    try {
        // Autorizar la excusa
        const { error } = await supabase
            .from('autorizaciones_docentes')
            .update({
                autorizado: true,
                fecha_autorizacion: new Date().toISOString(),
                observaciones: 'Autorizado por docente'
            })
            .eq('id', autorizacionId);
        
        if (error) {
            alert('Error al autorizar: ' + error.message);
            return;
        }
        
        // Mostrar modal para asignar trabajos
        mostrarModalTrabajos(autorizacionId);
        
    } catch (error) {
        console.error('Error al autorizar excusa:', error);
        alert('Error al procesar la autorización');
    }
}

function mostrarModalTrabajos(autorizacionId) {
    currentAutorizacion = { id: autorizacionId };
    
    const modal = document.getElementById('trabajosModal');
    
    // Limpiar campos
    document.getElementById('descripcionTrabajo').value = '';
    document.getElementById('fechaEntrega').value = '';
    
    modal.style.display = 'block';
}

async function guardarTrabajo() {
    const descripcion = document.getElementById('descripcionTrabajo').value.trim();
    const fechaEntrega = document.getElementById('fechaEntrega').value;
    
    if (!descripcion) {
        alert('Por favor ingrese la descripción del trabajo');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('trabajos_pendientes')
            .insert([
                {
                    autorizacion_docente_id: currentAutorizacion.id,
                    descripcion: descripcion,
                    fecha_entrega: fechaEntrega || null
                }
            ]);
        
        if (error) {
            alert('Error al guardar trabajo: ' + error.message);
            return;
        }
        
        alert('Trabajo asignado exitosamente');
        closeModal();
        loadExcusasDocente();
        
    } catch (error) {
        console.error('Error al guardar trabajo:', error);
        alert('Error al guardar el trabajo');
    }
}
