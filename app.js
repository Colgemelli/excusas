// Configuración de Supabase
const SUPABASE_URL = 'https://nbpldfyisdhgnkmgwaix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icGxkZnlpc2RoZ25rbWd3YWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjY1MTUsImV4cCI6MjA2NjU0MjUxNX0.Pe4ImgTYLmRqOqG-RdhJI2SY0QPl_cyBENOxKvZB0DY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable para recordar el tipo de usuario durante el proceso de autenticación
let pendingTipoUsuario = null;

// Variables globales
let currentUser = null;
let currentStep = 1;
let currentFormType = null;
let estudiantes = [];
let currentAutorizacion = null;
let datosPersonalesAceptados = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    setupEventListeners();
    setFechaActual();
    await loadGrados();
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
        await completeLogin(session.user);
    }

    supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
            completeLogin(session.user);
        } else if (!session) {
            logout();
        }
    });
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
    document.getElementById('backFromRadicado').addEventListener('click', showHomeScreen);

    // Stepper navigation
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('mainForm').addEventListener('submit', handleFormSubmit);
    
    // Protección de datos
    document.getElementById('aceptarDatosBtn').addEventListener('click', aceptarProteccionDatos);
    document.getElementById('rechazarDatosBtn').addEventListener('click', rechazarProteccionDatos);
    
    // Relación con estudiante
    document.getElementById('relacionEstudiante').addEventListener('change', handleRelacionChange);
    
    // Selección de grado y estudiante
    document.getElementById('gradoEstudiante').addEventListener('change', handleGradoChange);
    document.getElementById('estudianteSelect').addEventListener('change', handleEstudianteChange);
    
    // Campo de teléfono solo números
    document.getElementById('telefonoRegistrante').addEventListener('input', handleTelefonoInput);
    document.getElementById('telefonoRegistrante').addEventListener('keypress', handleTelefonoKeypress);
    
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

// Funciones para validar teléfono solo números
function handleTelefonoInput(e) {
    // Remover cualquier carácter que no sea número
    const valorOriginal = e.target.value;
    const valorLimpio = valorOriginal.replace(/[^0-9]/g, '');
    e.target.value = valorLimpio;
    
    // Actualizar contador
    updateTelefonoCounter(valorLimpio);
    
    // Si el usuario intentó escribir algo que no es número, mostrar feedback
    if (valorOriginal !== valorLimpio && valorOriginal.length > valorLimpio.length) {
        showTelefonoFeedback('Solo se permiten números', 'error');
    }
}

function handleTelefonoKeypress(e) {
    // Permitir solo números, backspace, delete, tab, escape, enter
    const allowedKeys = [8, 9, 27, 13, 46]; // backspace, tab, escape, enter, delete
    
    if (allowedKeys.includes(e.keyCode) || 
        // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey) || 
        (e.keyCode === 67 && e.ctrlKey) || 
        (e.keyCode === 86 && e.ctrlKey) || 
        (e.keyCode === 88 && e.ctrlKey)) {
        return;
    }
    
    // Asegurarse de que es un número
    if (e.keyCode < 48 || e.keyCode > 57) {
        e.preventDefault();
        showTelefonoFeedback('Solo se permiten números', 'error');
    }
}

function updateTelefonoCounter(valor) {
    const contador = document.getElementById('telefonoCounter');
    const longitud = valor.length;
    
    contador.textContent = `${longitud}/15 dígitos (mínimo 10)`;
    
    // Actualizar clases según la validación
    contador.classList.remove('valid', 'invalid');
    
    if (longitud >= 10 && longitud <= 15) {
        contador.classList.add('valid');
    } else if (longitud > 0) {
        contador.classList.add('invalid');
    }
}

function showTelefonoFeedback(mensaje, tipo) {
    const telefonoField = document.getElementById('telefonoRegistrante');
    
    // Remover mensaje anterior si existe
    const feedbackAnterior = telefonoField.parentNode.querySelector('.temp-feedback');
    if (feedbackAnterior) {
        feedbackAnterior.remove();
    }
    
    // Crear nuevo mensaje
    const feedback = document.createElement('div');
    feedback.className = `temp-feedback ${tipo}-message`;
    feedback.textContent = mensaje;
    
    // Insertar después del campo
    telefonoField.parentNode.insertBefore(feedback, telefonoField.nextSibling);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.remove();
        }
    }, 3000);
}

// Función de test para debugging
function testValidation() {
    console.log('🧪 ============= TEST DE VALIDACIÓN =============');
    
    const fecha = document.getElementById('fechaSolicitud').value;
    const nombre = document.getElementById('nombreRegistrante').value;
    const email = document.getElementById('emailRegistrante').value;
    const telefono = document.getElementById('telefonoRegistrante').value;
    const relacion = document.getElementById('relacionEstudiante').value;
    const otro = document.getElementById('otroRelacion').value;
    const grado = document.getElementById('gradoEstudiante').value;
    const estudianteSelect = document.getElementById('estudianteSelect');
    const estudianteGroup = document.getElementById('estudianteGroup');
    
    const resultados = {
        '📅 Fecha': fecha ? '✅ OK' : '❌ FALTA',
        '👤 Nombre': nombre.trim() ? '✅ OK' : '❌ FALTA',
        '📧 Email': email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '✅ OK' : '❌ INVÁLIDO',
        '📱 Teléfono': telefono.trim() && /^\d{10,15}$/.test(telefono) ? '✅ OK' : '❌ INVÁLIDO (necesita 10-15 dígitos)',
        '👥 Relación': relacion ? '✅ OK' : '❌ FALTA',
        '🔄 Campo "Otro"': relacion === 'otro' ? (otro.trim() ? '✅ OK' : '❌ FALTA') : '➖ No aplica',
        '🎓 Grado': grado ? '✅ OK' : '❌ FALTA',
        '👦 Estudiante visible': estudianteGroup.style.display !== 'none' ? '✅ SÍ' : '❌ NO',
        '👦 Estudiante habilitado': !estudianteSelect.disabled ? '✅ SÍ' : '❌ NO',
        '👦 Estudiante seleccionado': estudianteSelect.value ? '✅ OK' : '❌ FALTA'
    };
    
    console.log('📊 RESULTADOS:');
    Object.entries(resultados).forEach(([campo, resultado]) => {
        console.log(`${campo}: ${resultado}`);
    });
    
    const todoOK = Object.values(resultados).every(r => r.includes('✅') || r.includes('➖'));
    console.log(`\n🎯 RESULTADO FINAL: ${todoOK ? '✅ TODO OK - DEBERÍA PASAR' : '❌ HAY ERRORES'}`);
    
    // Mostrar en alerta también
    const resumenTexto = Object.entries(resultados)
        .map(([campo, resultado]) => `${campo}: ${resultado}`)
        .join('\n');
    
    alert(`🧪 TEST DE VALIDACIÓN\n\n${resumenTexto}\n\n🎯 RESULTADO: ${todoOK ? '✅ TODO OK' : '❌ HAY ERRORES'}`);
    
    console.log('🧪 ============= FIN TEST =============');
}

function handleRelacionChange() {
    const relacionSelect = document.getElementById('relacionEstudiante');
    const otroGroup = document.getElementById('otroRelacionGroup');
    const otroInput = document.getElementById('otroRelacion');
    
    if (relacionSelect.value === 'otro') {
        otroGroup.style.display = 'block';
        otroGroup.classList.add('show');
        otroInput.required = true;
        // Hacer focus en el campo después de la animación
        setTimeout(() => {
            otroInput.focus();
        }, 300);
    } else {
        otroGroup.classList.remove('show');
        otroInput.required = false;
        otroInput.value = '';
        // Ocultar después de la animación
        setTimeout(() => {
            otroGroup.style.display = 'none';
        }, 300);
    }
}

async function handleGradoChange() {
    const gradoSelect = document.getElementById('gradoEstudiante');
    const estudianteGroup = document.getElementById('estudianteGroup');
    const estudianteSelect = document.getElementById('estudianteSelect');
    const codigoGroup = document.getElementById('codigoGroup');
    const codigoInput = document.getElementById('codigoEstudiante');
    
    const gradoId = gradoSelect.value;
    console.log('🔄 Cambio de grado:', gradoId);
    
    if (!gradoId) {
        // Ocultar campos y resetear con animación
        estudianteGroup.classList.remove('show');
        codigoGroup.classList.remove('show');
        setTimeout(() => {
            estudianteGroup.style.display = 'none';
            codigoGroup.style.display = 'none';
        }, 300);
        
        estudianteSelect.disabled = true;
        estudianteSelect.innerHTML = '<option value="">Primero seleccione un grado...</option>';
        codigoInput.value = '';
        return;
    }
    
    try {
        // Mostrar indicador de carga
        console.log('⏳ Cargando estudiantes para grado:', gradoId);
        estudianteSelect.classList.add('loading-select');
        estudianteSelect.innerHTML = '<option value="">Cargando estudiantes...</option>';
        estudianteSelect.disabled = true;
        
        // Mostrar el grupo de estudiante inmediatamente
        estudianteGroup.style.display = 'block';
        setTimeout(() => {
            estudianteGroup.classList.add('show');
        }, 10);
        
        // Cargar estudiantes del grado seleccionado
        const { data: estudiantes, error } = await supabase
            .from('estudiantes')
            .select('*')
            .eq('grado_id', gradoId)
            .order('nombre');
        
        if (error) {
            console.error('❌ Error al cargar estudiantes:', error);
            alert('Error al cargar estudiantes del grado seleccionado');
            return;
        }
        
        // Remover indicador de carga
        estudianteSelect.classList.remove('loading-select');
        console.log('✅ Estudiantes cargados:', estudiantes?.length || 0);
        
        // Actualizar select de estudiantes
        estudianteSelect.innerHTML = '<option value="">Seleccione un estudiante...</option>';
        
        if (estudiantes && estudiantes.length > 0) {
            estudiantes.forEach(estudiante => {
                const option = document.createElement('option');
                option.value = estudiante.id;
                option.setAttribute('data-codigo', estudiante.codigo);
                option.setAttribute('data-nombre', estudiante.nombre);
                option.textContent = `${estudiante.nombre} (${estudiante.codigo})`;
                estudianteSelect.appendChild(option);
            });
            
            // HABILITAR el campo de estudiante
            estudianteSelect.disabled = false;
            console.log('✅ Campo estudiante habilitado');
        } else {
            estudianteSelect.innerHTML = '<option value="">No hay estudiantes en este grado</option>';
            estudianteSelect.disabled = true;
            console.log('⚠️ No hay estudiantes en este grado');
        }
        
        // Ocultar campo de código hasta que se seleccione estudiante
        codigoGroup.classList.remove('show');
        setTimeout(() => {
            codigoGroup.style.display = 'none';
        }, 300);
        codigoInput.value = '';
        
    } catch (error) {
        console.error('❌ Error al cargar estudiantes:', error);
        estudianteSelect.classList.remove('loading-select');
        alert('Error al conectar con la base de datos');
    }
}

function handleEstudianteChange() {
    const estudianteSelect = document.getElementById('estudianteSelect');
    const codigoGroup = document.getElementById('codigoGroup');
    const codigoInput = document.getElementById('codigoEstudiante');
    
    const estudianteId = estudianteSelect.value;
    
    if (!estudianteId) {
        codigoGroup.classList.remove('show');
        setTimeout(() => {
            codigoGroup.style.display = 'none';
        }, 300);
        codigoInput.value = '';
        return;
    }
    
    // Obtener datos del estudiante seleccionado
    const selectedOption = estudianteSelect.options[estudianteSelect.selectedIndex];
    const codigo = selectedOption.getAttribute('data-codigo');
    
    // Mostrar código automáticamente con animación
    codigoInput.value = codigo;
    codigoGroup.style.display = 'block';
    setTimeout(() => {
        codigoGroup.classList.add('show');
    }, 10);
}

function setFechaActual() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fechaSolicitud').value = today;
}

function resetFormFields() {
    document.getElementById('mainForm').reset();
    document.getElementById('nombreRegistrante').value = '';
    document.getElementById('emailRegistrante').value = '';
    document.getElementById('telefonoRegistrante').value = '';
    document.getElementById('relacionEstudiante').value = '';
    document.getElementById('otroRelacion').value = '';
    document.getElementById('gradoEstudiante').value = '';
    document.getElementById('estudianteSelect').value = '';
    document.getElementById('codigoEstudiante').value = '';
    document.getElementById('motivoPermiso').value = '';
    document.getElementById('horaSalida').value = '';
    document.getElementById('horaRegreso').value = '';
    document.getElementById('diasInasistencia').value = '';
    document.getElementById('mesInasistencia').value = '';
    document.getElementById('motivoExcusa').value = '';
    document.getElementById('certificadoMedico').checked = false;
    document.getElementById('incapacidad').checked = false;
    
    // Resetear contador de teléfono
    updateTelefonoCounter('');
    
    // Resetear atributos required
    document.getElementById('motivoPermiso').required = false;
    document.getElementById('horaSalida').required = false;
    document.getElementById('diasInasistencia').required = false;
    document.getElementById('mesInasistencia').required = false;
    document.getElementById('motivoExcusa').required = false;
    
    // Ocultar campo "otro" con animación
    const otroGroup = document.getElementById('otroRelacionGroup');
    otroGroup.classList.remove('show');
    setTimeout(() => {
        otroGroup.style.display = 'none';
    }, 300);
    document.getElementById('otroRelacion').required = false;
    
    // Resetear campos de estudiante con animación
    const estudianteGroup = document.getElementById('estudianteGroup');
    const codigoGroup = document.getElementById('codigoGroup');
    
    estudianteGroup.classList.remove('show');
    codigoGroup.classList.remove('show');
    
    setTimeout(() => {
        estudianteGroup.style.display = 'none';
        codigoGroup.style.display = 'none';
    }, 300);
    
    document.getElementById('estudianteSelect').disabled = true;
    document.getElementById('estudianteSelect').innerHTML = '<option value="">Primero seleccione un grado...</option>';
    
    // Resetear protección de datos para nueva solicitud
    datosPersonalesAceptados = false;
    currentFormType = null;
    
    // Ocultar indicador de datos aceptados
    document.getElementById('datosAceptadosInfo').style.display = 'none';
    
    currentStep = 1;
    updateStepperUI();
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

    pendingTipoUsuario = tipoUsuario;
    localStorage.setItem('login_tipo_usuario', tipoUsuario);

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.href
            }
        });
        if (error) {
            alert('Error al enviar enlace de inicio de sesión: ' + error.message);
            return;
        }

        alert('Revisa tu correo para completar el inicio de sesión');
        closeModal();
        
    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
    }
}

async function completeLogin(user) {
    const tipoUsuario = localStorage.getItem('login_tipo_usuario') || pendingTipoUsuario || 'padre';

    // Buscar usuario por su auth_id
    let { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', user.id)
        .single();

    if (!usuario) {
        const { data: nuevoUsuario, error } = await supabase
            .from('usuarios')
            .insert([
                {
                    auth_id: user.id,
                    email: user.email,
                    nombre: user.email.split('@')[0],
                    tipo_usuario: tipoUsuario
                }
            ])
            .select()
            .single();

        if (error) {
            alert('Error al crear usuario: ' + error.message);
            return;
        }
        usuario = nuevoUsuario;
    }

    currentUser = usuario;
    updateUIForUser();
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

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error.message);
            alert('Error al cerrar sesión: ' + error.message);
            return;
        }
    } catch (err) {
        console.error('Unexpected error during sign out:', err);
        alert('Error al cerrar sesión');
        return;
    }

    currentUser = null;
    datosPersonalesAceptados = false; // Resetear protección de datos al cerrar sesión
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'none';
    
    // Ocultar indicador de datos aceptados
    document.getElementById('datosAceptadosInfo').style.display = 'none';
    
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

function showRadicadoScreen(radicado) {
    hideAllScreens();
    document.getElementById('radicadoDisplay').innerText = radicado;
    document.getElementById('radicadoScreen').style.display = 'block';
}

function handleOptionClick(e) {
    const option = e.currentTarget.dataset.option;
    
    // Solo consultar, permisos y excusas no requieren login, pero permisos y excusas sí requieren aceptar protección de datos
    if (!currentUser && (option === 'coordinador' || option === 'docente')) {
        alert('Debe iniciar sesión para acceder a esta función');
        showLoginModal();
        return;
    }
    
    switch (option) {
        case 'permiso':
        case 'excusa':
            // Verificar si ya se aceptó la protección de datos en esta sesión
            if (!datosPersonalesAceptados) {
                currentFormType = option; // Guardar el tipo para después del modal
                showProteccionDatosModal();
            } else {
                showStepperForm(option);
            }
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

// Funciones de protección de datos
function showProteccionDatosModal() {
    document.getElementById('proteccionDatosModal').style.display = 'block';
}

function aceptarProteccionDatos() {
    datosPersonalesAceptados = true;
    closeModal();
    
    // Mostrar indicador de datos aceptados
    document.getElementById('datosAceptadosInfo').style.display = 'block';
    
    // Continuar con el formulario que se había seleccionado
    if (currentFormType) {
        showStepperForm(currentFormType);
    }
}

function rechazarProteccionDatos() {
    datosPersonalesAceptados = false;
    closeModal();
    
    // Mostrar mensaje informativo
    alert('Para registrar permisos o excusas es necesario aceptar el tratamiento de datos personales según la normativa vigente.');
    
    // Volver al home
    currentFormType = null;
    showHomeScreen();
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
        
        // Hacer obligatorios los campos de permiso
        document.getElementById('motivoPermiso').required = true;
        document.getElementById('horaSalida').required = true;
        
        // Quitar obligatorio de campos de excusa
        document.getElementById('diasInasistencia').required = false;
        document.getElementById('mesInasistencia').required = false;
        document.getElementById('motivoExcusa').required = false;
        
    } else {
        formTitle.textContent = 'Registrar Excusa';
        permisoFields.style.display = 'none';
        excusaFields.style.display = 'block';
        
        // Hacer obligatorios los campos de excusa
        document.getElementById('diasInasistencia').required = true;
        document.getElementById('mesInasistencia').required = true;
        document.getElementById('motivoExcusa').required = true;
        
        // Quitar obligatorio de campos de permiso
        document.getElementById('motivoPermiso').required = false;
        document.getElementById('horaSalida').required = false;
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
    const testBtn = document.getElementById('testBtn');
    
    prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    nextBtn.style.display = currentStep < 3 ? 'block' : 'none';
    submitBtn.style.display = currentStep === 3 ? 'block' : 'none';
    
    // Ocultar botón de test después del paso 1
    if (testBtn) {
        testBtn.style.display = currentStep === 1 ? 'block' : 'none';
    }
    
    // Si estamos en el paso 3, mostrar confirmación
    if (currentStep === 3) {
        showConfirmation();
    }
}

function nextStep() {
    console.log('🔍 =========================');
    console.log('🔍 INTENTANDO AVANZAR PASO');
    console.log('🔍 Paso actual:', currentStep);
    console.log('🔍 =========================');
    
    // Test rápido de todos los campos antes de validar
    if (currentStep === 1) {
        const campos = {
            fecha: document.getElementById('fechaSolicitud').value,
            nombre: document.getElementById('nombreRegistrante').value,
            email: document.getElementById('emailRegistrante').value,
            telefono: document.getElementById('telefonoRegistrante').value,
            relacion: document.getElementById('relacionEstudiante').value,
            grado: document.getElementById('gradoEstudiante').value,
            estudiante: document.getElementById('estudianteSelect').value,
            estudianteDisabled: document.getElementById('estudianteSelect').disabled,
            estudianteVisible: document.getElementById('estudianteGroup').style.display !== 'none'
        };
        
        console.log('📋 Estado de todos los campos:', campos);
    }
    
    if (validateCurrentStep()) {
        console.log('✅ Validación exitosa, avanzando al paso:', currentStep + 1);
        currentStep++;
        updateStepperUI();
    } else {
        console.log('❌ Validación falló en paso:', currentStep);
        // Destacar campos con errores
        highlightRequiredFields();
    }
    
    console.log('🔍 =========================');
}

function highlightRequiredFields() {
    // Función para destacar visualmente los campos que faltan
    if (currentStep === 1) {
        const fieldsToCheck = [
            'fechaSolicitud', 'nombreRegistrante', 'emailRegistrante', 
            'telefonoRegistrante', 'relacionEstudiante', 'gradoEstudiante'
        ];
        
        // Agregar campo "otro" si es necesario
        const relacionEstudiante = document.getElementById('relacionEstudiante').value;
        if (relacionEstudiante === 'otro') {
            fieldsToCheck.push('otroRelacion');
        }
        
        // Agregar estudiante si el grado está seleccionado y el campo está habilitado
        const gradoEstudiante = document.getElementById('gradoEstudiante').value;
        const estudianteSelect = document.getElementById('estudianteSelect');
        if (gradoEstudiante && !estudianteSelect.disabled) {
            fieldsToCheck.push('estudianteSelect');
        }
        
        fieldsToCheck.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && (!field.value.trim() || field.value === '')) {
                field.style.borderColor = 'var(--danger-color)';
                field.style.borderWidth = '2px';
                field.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
                
                // Remover el destacado después de que el usuario escriba algo
                field.addEventListener('input', function clearHighlight() {
                    field.style.borderColor = '';
                    field.style.borderWidth = '';
                    field.style.boxShadow = '';
                    field.removeEventListener('input', clearHighlight);
                }, { once: true });
                
                field.addEventListener('change', function clearHighlight() {
                    field.style.borderColor = '';
                    field.style.borderWidth = '';
                    field.style.boxShadow = '';
                    field.removeEventListener('change', clearHighlight);
                }, { once: true });
            }
        });
    } else if (currentStep === 2) {
        const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
        
        requiredFields.forEach(field => {
            const isVisible = field.offsetParent !== null;
            if (isVisible && !field.value.trim() && !field.disabled) {
                field.style.borderColor = 'var(--danger-color)';
                field.style.borderWidth = '2px';
                field.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
                
                // Remover el destacado después de que el usuario escriba algo
                field.addEventListener('input', function clearHighlight() {
                    field.style.borderColor = '';
                    field.style.borderWidth = '';
                    field.style.boxShadow = '';
                    field.removeEventListener('input', clearHighlight);
                }, { once: true });
            }
        });
    }
}

function prevStep() {
    currentStep--;
    updateStepperUI();
}

function validateCurrentStep() {
    if (currentStep === 1) {
        const fechaSolicitud = document.getElementById('fechaSolicitud').value;
        const nombreRegistrante = document.getElementById('nombreRegistrante').value;
        const emailRegistrante = document.getElementById('emailRegistrante').value;
        const telefonoRegistrante = document.getElementById('telefonoRegistrante').value;
        const relacionEstudiante = document.getElementById('relacionEstudiante').value;
        const estudianteSelect = document.getElementById('estudianteSelect').value;
        const codigoEstudiante = document.getElementById('codigoEstudiante').value;
        const gradoEstudiante = document.getElementById('gradoEstudiante').value;
        
        if (!fechaSolicitud || !nombreRegistrante.trim() || !emailRegistrante.trim() ||
            !telefonoRegistrante.trim() || !relacionEstudiante || !estudianteSelect ||
            !codigoEstudiante.trim() || !gradoEstudiante) {
            alert('Por favor complete todos los campos obligatorios');
            return false;
        }
        
        // Validar campo "otro" si es necesario
        if (relacionEstudiante === 'otro') {
            const otroRelacion = document.getElementById('otroRelacion').value;
            if (!otroRelacion.trim()) {
                alert('Por favor especifique cuál es su relación con el estudiante');
                return false;
            }
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailRegistrante)) {
            alert('Por favor ingrese un email válido');
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
    const gradoSelect = document.getElementById('gradoEstudiante');
    const gradoNombre = gradoSelect.options[gradoSelect.selectedIndex].text;
    
    const estudianteSelect = document.getElementById('estudianteSelect');
    const estudianteOption = estudianteSelect.options[estudianteSelect.selectedIndex];
    const estudianteNombre = estudianteOption ? estudianteOption.getAttribute('data-nombre') : '';

    let html = `
        <div class="confirmation-item">
            <strong>Fecha de Solicitud:</strong> ${document.getElementById('fechaSolicitud').value}
        </div>
        <div class="confirmation-item">
            <strong>Registrado por:</strong> ${document.getElementById('nombreRegistrante').value}
        </div>
        <div class="confirmation-item">
            <strong>Email:</strong> ${document.getElementById('emailRegistrante').value}
        </div>
        <div class="confirmation-item">
            <strong>Teléfono:</strong> ${document.getElementById('telefonoRegistrante').value || 'No especificado'}
        </div>
        <div class="confirmation-item">
            <strong>Estudiante:</strong> ${estudianteNombre}
        </div>
        <div class="confirmation-item">
            <strong>Código:</strong> ${document.getElementById('codigoEstudiante').value}
        </div>
        <div class="confirmation-item">
            <strong>Grado:</strong> ${gradoNombre}
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
        // Obtener datos del formulario
        const nombreRegistrante = document.getElementById('nombreRegistrante').value.trim();
        const emailRegistrante = document.getElementById('emailRegistrante').value.trim();
        const telefonoRegistrante = document.getElementById('telefonoRegistrante').value.trim();
        const relacionEstudiante = document.getElementById('relacionEstudiante').value;
        const otroRelacion = document.getElementById('otroRelacion').value.trim();
        const estudianteId = document.getElementById('estudianteSelect').value;
        const fechaSolicitud = document.getElementById('fechaSolicitud').value;
        
        // Determinar la relación final
        const relacionFinal = relacionEstudiante === 'otro' ? otroRelacion : relacionEstudiante;
        
        // Obtener datos completos del estudiante seleccionado
        const { data: estudiante, error: errorEstudiante } = await supabase
            .from('estudiantes')
            .select(`
                *,
                grados (nombre)
            `)
            .eq('id', estudianteId)
            .single();
        
        if (errorEstudiante || !estudiante) {
            alert('Error al obtener datos del estudiante seleccionado');
            return;
        }
        
        // Buscar o crear padre/acudiente usando los datos de quien registra
        let padre;
        const { data: padreExistente } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', emailRegistrante)
            .eq('tipo_usuario', 'padre')
            .single();
        
        if (padreExistente) {
            padre = padreExistente;
            // Actualizar información si es necesaria
            await supabase
                .from('usuarios')
                .update({
                    nombre: nombreRegistrante,
                    telefono: telefonoRegistrante
                })
                .eq('id', padre.id);
        } else {
            // Crear nuevo padre/acudiente
            const { data: nuevoPadre, error: errorPadre } = await supabase
                .from('usuarios')
                .insert([{
                    email: emailRegistrante,
                    nombre: nombreRegistrante,
                    telefono: telefonoRegistrante,
                    tipo_usuario: 'padre',
                    auth_id: currentUser ? currentUser.auth_id : null
                }])
                .select()
                .single();
            
            if (errorPadre) {
                alert('Error al registrar el acudiente: ' + errorPadre.message);
                return;
            }
            
            padre = nuevoPadre;
        }
        
        // Actualizar el estudiante para asociarlo con el padre si no lo está
        if (!estudiante.padre_id) {
            await supabase
                .from('estudiantes')
                .update({ padre_id: padre.id })
                .eq('id', estudiante.id);
        }
        
        // Crear solicitud (permiso o excusa)
        let result;
        
        if (currentFormType === 'permiso') {
            const data = {
                estudiante_id: estudiante.id,
                padre_id: padre.id,
                usuario_id: currentUser ? currentUser.auth_id : null,
                fecha_solicitud: fechaSolicitud,
                motivo: document.getElementById('motivoPermiso').value,
                hora_salida: document.getElementById('horaSalida').value || null,
                hora_regreso: document.getElementById('horaRegreso').value || null,
                registrado_por_nombre: nombreRegistrante,
                registrado_por_email: emailRegistrante,
                registrado_por_relacion: relacionEstudiante,
                registrado_por_relacion_otro: otroRelacion || null,
                estado: 'pendiente'
            };
            
            result = await supabase
                .from('permisos')
                .insert([data])
                .select()
                .single();
        } else {
            const data = {
                estudiante_id: estudiante.id,
                padre_id: padre.id,
                usuario_id: currentUser ? currentUser.auth_id : null,
                fecha_solicitud: fechaSolicitud,
                dias_inasistencia: document.getElementById('diasInasistencia').value,
                mes: document.getElementById('mesInasistencia').value,
                motivo: document.getElementById('motivoExcusa').value,
                certificado_medico: document.getElementById('certificadoMedico').checked,
                incapacidad: document.getElementById('incapacidad').checked,
                registrado_por_nombre: nombreRegistrante,
                registrado_por_email: emailRegistrante,
                registrado_por_relacion: relacionEstudiante,
               registrado_por_relacion_otro: otroRelacion || null,
                estado: 'pendiente'
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
        
        // Mostrar pantalla de radicado exitoso
        showRadicadoScreen(result.data.radicado);

        // Limpiar formulario para futuras solicitudes
        resetFormFields();
        setFechaActual();
        
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        alert('Error al procesar la solicitud: ' + error.message);
    }
}

// Funciones de carga de datos
async function loadGrados() {
    try {
        const { data, error } = await supabase
            .from('grados')
            .select('*')
            .order('nombre');
        
        if (error) {
            console.error('Error al cargar grados:', error);
            return;
        }
        
        // Actualizar select de grados
        const select = document.getElementById('gradoEstudiante');
        if (select) {
            select.innerHTML = '<option value="">Seleccione el grado...</option>';
            
            data.forEach(grado => {
                const option = document.createElement('option');
                option.value = grado.id;
                option.textContent = grado.nombre;
                select.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error al cargar grados:', error);
    }
}

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
                estudiantes (nombre, codigo, grados (nombre)),
                usuarios (nombre)
            `)
            .eq('radicado', radicado)
            .single();
        
        // Buscar en excusas
        const { data: excusa } = await supabase
            .from('excusas')
            .select(`
                *,
                estudiantes (nombre, codigo, grados (nombre)),
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
                    <p><strong>Código:</strong> ${solicitud.estudiantes.codigo}</p>
                    <p><strong>Grado:</strong> ${solicitud.estudiantes.grados.nombre}</p>
                    <p><strong>Acudiente:</strong> ${solicitud.usuarios.nombre}</p>
                    <p><strong>Fecha de Solicitud:</strong> ${new Date(solicitud.fecha_solicitud).toLocaleDateString()}</p>
                    <p><strong>Estado:</strong> <span class="estado-${solicitud.estado}">${getEstadoTexto(solicitud.estado)}</span></p>
        `;
        
        // Mostrar información de quien registró si está disponible
        if (solicitud.registrado_por_nombre) {
            const relacion = solicitud.registrado_por_relacion === 'otro' 
                ? solicitud.registrado_por_relacion_otro 
                : solicitud.registrado_por_relacion;
            html += `<p><strong>Registrado por:</strong> ${solicitud.registrado_por_nombre} (${relacion}) - ${solicitud.registrado_por_email}</p>`;
        }
        
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
    const container = document.getElementById('permisosPendientes');
    try {
        const { data, error } = await supabase
            .from('permisos')
            .select(`
                *,
                estudiantes (nombre, codigo, grados (nombre)),
                usuarios (nombre)
            `)
            .eq('estado', 'pendiente')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar permisos:', error);
            container.innerHTML = '<p class="error">Error al cargar permisos.</p>';
            return;
        }

        renderSolicitudes(data, 'permisosPendientes', 'permiso');

    } catch (error) {
        console.error('Error al cargar permisos:', error);
        container.innerHTML = '<p class="error">Error al cargar permisos.</p>';
    }
}

async function loadExcusasPendientes() {
    const container = document.getElementById('excusasPendientes');
    try {
        const { data, error } = await supabase
            .from('excusas')
            .select(`
                *,
                estudiantes (nombre, codigo, grados (nombre)),
                usuarios (nombre)
            `)
            .eq('estado', 'pendiente')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar excusas:', error);
            container.innerHTML = '<p class="error">Error al cargar excusas.</p>';
            return;
        }

        renderSolicitudes(data, 'excusasPendientes', 'excusa');

    } catch (error) {
        console.error('Error al cargar excusas:', error);
        container.innerHTML = '<p class="error">Error al cargar excusas.</p>';
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
                    <p><strong>Acudiente:</strong> ${solicitud.usuarios.nombre}</p>
                    <p><strong>Fecha:</strong> ${new Date(solicitud.fecha_solicitud).toLocaleDateString()}</p>
        `;
        
        // Mostrar información de quien registró si está disponible
        if (solicitud.registrado_por_nombre) {
            const relacion = solicitud.registrado_por_relacion === 'otro' 
                ? solicitud.registrado_por_relacion_otro 
                : solicitud.registrado_por_relacion;
            html += `<p><strong>Registrado por:</strong> ${solicitud.registrado_por_nombre} (${relacion}) - ${solicitud.registrado_por_email}</p>`;
        }
        
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
                estudiantes (nombre, codigo, grados (nombre)),
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
                <p><strong>Acudiente:</strong> ${data.usuarios.nombre}</p>
                <p><strong>Fecha:</strong> ${new Date(data.fecha_solicitud).toLocaleDateString()}</p>
        `;
        
        // Mostrar información de quien registró si está disponible
        if (data.registrado_por_nombre) {
            const relacion = data.registrado_por_relacion === 'otro' 
                ? data.registrado_por_relacion_otro 
                : data.registrado_por_relacion;
            html += `<p><strong>Registrado por:</strong> ${data.registrado_por_nombre} (${relacion}) - ${data.registrado_por_email}</p>`;
        }
        
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
            // Obtener el grado del estudiante
            const { data: estudiante } = await supabase
                .from('estudiantes')
                .select('grado_id')
                .eq('id', currentAutorizacion.estudiante_id)
                .single();
            
            if (estudiante) {
                await crearAutorizacionesDocentes(currentAutorizacion.id, estudiante.grado_id);
            }
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
                    estudiantes (nombre, codigo, grados (nombre)),
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

if (typeof module !== "undefined") {
    module.exports = { logout };
}

export { logout };
