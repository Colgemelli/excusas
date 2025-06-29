// Configuración de Supabase
const SUPABASE_URL =
    (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) ||
    (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.SUPABASE_URL) ||
    '';
const SUPABASE_ANON_KEY =
    (typeof process !== 'undefined' && process.env && process.env.SUPABASE_ANON_KEY) ||
    (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.SUPABASE_ANON_KEY) ||
    '';

// Configuración de Supabase - ACTUALIZADA
const SUPABASE_URL = 'https://zkbnpjmtwkhcvqizpmhj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYm5wam10d2toY3ZxaXpwbWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTQyNDksImV4cCI6MjA2NjczMDI0OX0.McMyTT8-Myp6L0nIjTN4chedAPunB0dwymQKhiNp6uI';

// Variables de control global
window.APP_INITIALIZED = false;
window.PREVENT_ERROR_POPUP = true; // Prevenir popup de error genérico

// Inicializar Supabase con manejo de errores
let supabase;
try {
    if (typeof window.supabase === 'undefined') {
        throw new Error('Supabase library not loaded');
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized successfully with new database');
    console.log('🔗 New Supabase URL:', SUPABASE_URL);
} catch (error) {
    console.error('Error initializing Supabase:', error);
    // NO mostrar alert aquí, solo log
    console.log('🔄 App will continue with fallback data');
}

// Estado global de la aplicación
let currentStep = 1;
let currentUser = null;
let currentRole = null;
let requestType = '';

// Elementos del DOM
const elements = {
    loading: document.getElementById('loading'),
    homeBtn: document.getElementById('homeBtn'),
    consultBtn: document.getElementById('consultBtn'),
    loginBtn: document.getElementById('loginBtn'),
    userInfo: document.getElementById('userInfo'),
    userName: document.getElementById('userName'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Views
    homeView: document.getElementById('homeView'),
    formView: document.getElementById('formView'),
    consultView: document.getElementById('consultView'),
    loginView: document.getElementById('loginView'),
    dashboardView: document.getElementById('dashboardView'),
    
    // Form elements
    requestForm: document.getElementById('requestForm'),
    formTitle: document.getElementById('formTitle'),
    backToHome: document.getElementById('backToHome'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    submitBtn: document.getElementById('submitBtn'),
    
    // Login elements
    loginForm: document.getElementById('loginForm'),
    
    // Modal
    successModal: document.getElementById('successModal'),
    closeModal: document.getElementById('closeModal'),
    generatedFiling: document.getElementById('generatedFiling')
};

// Función de test para verificar zona horaria y meses
function testTimeZoneAndMonths() {
    console.log('🧪 TESTING TIMEZONE AND MONTHS:');
    console.log('Today in Colombia:', getTodayInColombia());
    console.log('Current month index in Colombia:', getCurrentMonthInColombia());
    
    // Simular que estamos en 28 de junio
    const testDate = '2024-06-28';
    console.log(`📅 Testing with date: ${testDate}`);
    
    // Manualmente probar con junio (mes 5)
    const june = 5;
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    console.log(`📅 Si estamos en ${monthNames[june]} (${june}), los meses disponibles serían:`);
    const availableMonths = monthNames.slice(june + 1);
    console.log('Meses disponibles:', availableMonths.join(', '));
    
    return availableMonths;
}

// Test de conexión simplificado
async function testSupabaseConnection() {
    try {
        if (!supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return false;
        }
        
        const { error } = await supabase
            .from('students')
            .select('count')
            .limit(1);
        
        return !error;
        
    } catch (error) {
        console.error('Test de conexión falló:', error.message);
        return false;
    }
}

function showNetworkError(message) {
    console.log('ℹ️ Network info:', message);
    // Solo log, no popup
}

// Escuchar eventos de red (simplificado)
if (typeof window.addEventListener === 'function') {
    window.addEventListener('online', () => {
        console.log('🌐 Conexión restaurada');
    });

window.addEventListener('offline', () => {
        console.log('📴 Conexión perdida');
    });
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing app...');
    
    try {
        // Verificar que Supabase esté disponible
        if (!supabase) {
            throw new Error('Supabase not initialized');
        }
        
        // Probar conexión
        const connectionOk = await Promise.race([
            testSupabaseConnection(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]);
        
        if (!connectionOk) {
            throw new Error('Database connection failed');
        }
        
        setupEventListeners();
        setupFormValidation();
        
        // Log de fecha actual en Colombia
        const todayInColombia = getTodayInColombia();
        const currentMonthInColombia = getCurrentMonthInColombia();
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        
        console.log('🇨🇴 ZONA HORARIA COLOMBIANA (UTC-5):');
        console.log('📅 Fecha actual en Colombia:', todayInColombia);
        console.log('📅 Mes actual:', monthNames[currentMonthInColombia]);
        console.log('📅 Meses que se mostrarán para excusas:', monthNames.slice(currentMonthInColombia + 1).join(', ') || 'enero-diciembre (siguiente año)');
        console.log('🌐 Fecha UTC (referencia):', new Date().toISOString().split('T')[0]);
        
        // Ejecutar test automático
        testTimeZoneAndMonths();
        
        // Intentar cargar estudiantes con timeout
        console.log('Loading students...');
        await Promise.race([
            loadStudents(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout loading students')), 10000)
            )
        ]);
        
        console.log('App initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        
        // Mostrar error al usuario pero permitir que la app funcione
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: #dc3545; color: white; padding: 15px; border-radius: 8px;
            max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        errorDiv.innerHTML = `
            <strong>⚠️ Advertencia:</strong><br>
            Error al cargar datos iniciales. Algunas funciones pueden no estar disponibles.
            <button onclick="this.parentElement.remove()" style="float:right; background:none; border:none; color:white; font-size:18px;">×</button>
        `;
        document.body.appendChild(errorDiv);
        
        // Remover automáticamente después de 10 segundos
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
        
        // Inicializar datos vacíos para que la app funcione
        window.studentsData = [];
        setupEventListeners();
        setupFormValidation();
    } finally {
        hideLoading();
    }
});

// Mostrar/ocultar indicador de datos fallback
function showFallbackWarning(show = true) {
    const warning = document.getElementById('fallbackDataWarning');
    if (warning) {
        warning.style.display = show ? 'flex' : 'none';
        
        if (show) {
            console.log('📋 Showing fallback data warning to user');
        } else {
            console.log('📋 Hiding fallback data warning');
        }
    } else {
        console.warn('⚠️ Fallback warning element not found in DOM');
    }
}

// Event listeners para botón de reintentar
function setupRetryButton() {
    const retryBtn = document.getElementById('retryLoadStudents');
    if (retryBtn) {
        retryBtn.addEventListener('click', async () => {
            console.log('🔄 Usuario solicita reconexión con Supabase...');
            
            try {
                showLoading();
                
                // Intentar conectar con Supabase directamente
                const students = await loadStudentsFromSupabase();
                
                // Si llegamos aquí, la conexión fue exitosa
                window.studentsData = students;
                window.dataSource = 'supabase';
                showFallbackWarning(false);
                
                // Mostrar distribución por grados
                const byGrade = students.reduce((acc, student) => {
                    acc[student.grade] = (acc[student.grade] || 0) + 1;
                    return acc;
                }, {});
                
                const gradeInfo = Object.entries(byGrade)
                    .map(([grade, count]) => `${grade}: ${count}`)
                    .join('\n');
                
                alert(`🎉 ¡Conexión exitosa con Supabase!\n\n👥 Total: ${students.length} estudiantes\n\n📊 Por grado:\n${gradeInfo}`);
                
            } catch (error) {
                console.error('❌ Error en reconexión:', error);
                
                let errorMsg = '❌ No se pudo conectar con Supabase\n\n';
                
                if (error.message.includes('no existe')) {
                    errorMsg += '🗃️ Problema: La tabla "students" no existe\n';
                    errorMsg += '💡 Solución: Ejecute el SQL para crear las tablas';
                } else if (error.message.includes('permisos')) {
                    errorMsg += '🔒 Problema: Sin permisos de acceso\n';
                    errorMsg += '💡 Solución: Configure las políticas RLS';
                } else if (error.message.includes('vacía')) {
                    errorMsg += '📋 Problema: La tabla está vacía\n';
                    errorMsg += '💡 Solución: Inserte datos de estudiantes';
                } else {
                    errorMsg += `🔧 Error: ${error.message}\n`;
                    errorMsg += '💡 Revise la consola para más detalles';
                }
                
                errorMsg += '\n\n📋 Se mantienen los datos de ejemplo para que pueda probar la aplicación.';
                
                alert(errorMsg);
            } finally {
                hideLoading();
            }
        });
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    elements.homeBtn.addEventListener('click', () => showView('home'));
    elements.consultBtn.addEventListener('click', () => showView('consult'));
    elements.loginBtn.addEventListener('click', () => showView('login'));
    elements.logoutBtn.addEventListener('click', logout);
    
    // Setup retry button
    setupRetryButton();
    
    // Opciones de solicitud
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            requestType = card.dataset.type;
            elements.formTitle.textContent = `Solicitud de ${requestType.charAt(0).toUpperCase() + requestType.slice(1)}`;
            
            // Mostrar/ocultar campos específicos según el tipo
            const permissionFields = document.querySelector('.permission-fields');
            const excuseFields = document.querySelector('.excuse-fields');
            
            if (requestType === 'permiso') {
                permissionFields.style.display = 'grid';
                excuseFields.style.display = 'none';
                
                // Hacer obligatorios los campos de permiso
                document.getElementById('startTime').required = true;
                document.getElementById('absenceDays').required = false;
                document.getElementById('absenceMonth').required = false;
            } else {
                permissionFields.style.display = 'none';
                excuseFields.style.display = 'grid';
                
                // Hacer obligatorios los campos de excusa
                document.getElementById('startTime').required = false;
                document.getElementById('absenceDays').required = true;
                document.getElementById('absenceMonth').required = true;
                
                // Actualizar meses disponibles inmediatamente
                updateAvailableMonths();
            }
            
            showView('form');
        });
    });
    
    // Formulario
    elements.backToHome.addEventListener('click', () => {
        resetForm();
        showView('home');
    });
    
    elements.prevBtn.addEventListener('click', previousStep);
    elements.nextBtn.addEventListener('click', nextStep);
    elements.submitBtn.addEventListener('click', submitRequest);
    elements.requestForm.addEventListener('submit', (e) => e.preventDefault());
    
    // Login
    elements.loginForm.addEventListener('submit', handleLogin);
    
    // Tabs de login
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRole = btn.dataset.role;
        });
    });
    
    // Modal
    elements.closeModal.addEventListener('click', () => {
        elements.successModal.style.display = 'none';
        resetForm();
        showView('home');
    });
    
    // Consulta de radicado
    document.getElementById('consultBtn').addEventListener('click', consultFiling);
    
    // Botón de prueba de conexión
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    if (testConnectionBtn) {
        testConnectionBtn.addEventListener('click', async () => {
            try {
                showLoading();
                
                console.log('🔧 === DIAGNÓSTICO COMPLETO ===');
                
                // 1. Info básica
                const todayInColombia = getTodayInColombia();
                const currentMonth = getCurrentMonthInColombia();
                const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                
                // 2. Estado actual
                const dataSource = window.dataSource || 'desconocida';
                const studentCount = window.studentsData?.length || 0;
                
                // 3. Test de conexión con Supabase
                let supabaseStatus = '❌ No probado';
                let supabaseDetails = '';
                
                try {
                    const students = await loadStudentsFromSupabase();
                    supabaseStatus = '✅ CONECTADO';
                    supabaseDetails = `Estudiantes en DB: ${students.length}`;
                    
                    // Actualizar datos si la conexión funciona
                    window.studentsData = students;
                    window.dataSource = 'supabase';
                    showFallbackWarning(false);
                    
                } catch (error) {
                    supabaseStatus = '❌ ERROR';
                    supabaseDetails = error.message;
                }
                
                // 4. Test básico de configuración
                const configTest = {
                    url: !!SUPABASE_URL,
                    apiKey: !!SUPABASE_ANON_KEY,
                    client: !!supabase,
                    network: navigator.onLine
                };
                
                // Reporte final
                let report = `🔍 DIAGNÓSTICO DE CONEXIÓN\n\n`;
                report += `📅 Fecha Colombia: ${todayInColombia}\n`;
                report += `📅 Mes actual: ${monthNames[currentMonth]}\n\n`;
                
                report += `🔧 CONFIGURACIÓN:\n`;
                report += `URL: ${configTest.url ? '✅' : '❌'} ${configTest.url ? SUPABASE_URL : 'No configurada'}\n`;
                report += `API Key: ${configTest.apiKey ? '✅' : '❌'} ${configTest.apiKey ? 'Configurada' : 'No configurada'}\n`;
                report += `Cliente: ${configTest.client ? '✅' : '❌'} ${configTest.client ? 'Inicializado' : 'Error'}\n`;
                report += `Red: ${configTest.network ? '✅' : '❌'} ${configTest.network ? 'Online' : 'Offline'}\n\n`;
                
                report += `📡 CONEXIÓN SUPABASE: ${supabaseStatus}\n`;
                if (supabaseDetails) {
                    report += `Detalles: ${supabaseDetails}\n`;
                }
                report += `\n`;
                
                report += `📊 ESTADO ACTUAL:\n`;
                report += `Fuente de datos: ${dataSource}\n`;
                report += `Estudiantes disponibles: ${studentCount}\n\n`;
                
                // Sugerencias
                if (supabaseStatus.includes('ERROR')) {
                    report += `💡 PARA SOLUCIONAR:\n`;
                    
                    if (supabaseDetails.includes('no existe')) {
                        report += `1. Vaya a https://zkbnpjmtwkhcvqizpmhj.supabase.co\n`;
                        report += `2. En SQL Editor, ejecute paso a paso el SQL\n`;
                        report += `3. Comience con: CREATE TABLE students (...)\n`;
                    } else if (supabaseDetails.includes('permisos')) {
                        report += `1. Configure políticas RLS en Supabase\n`;
                        report += `2. Ejecute: CREATE POLICY "Allow public read students"...\n`;
                    } else if (supabaseDetails.includes('vacía')) {
                        report += `1. Inserte datos de ejemplo\n`;
                        report += `2. Ejecute: INSERT INTO students (code, full_name, grade)...\n`;
                    } else {
                        report += `1. Verifique configuración de Supabase\n`;
                        report += `2. Revise la consola del navegador (F12)\n`;
                        report += `3. Confirme que la URL y API Key son correctas\n`;
                    }
                } else {
                    report += `🎉 ¡TODO FUNCIONA PERFECTAMENTE!`;
                }
                
                alert(report);
                
            } catch (error) {
                console.error('Error en diagnóstico:', error);
                alert(`❌ Error en diagnóstico: ${error.message}`);
            } finally {
                hideLoading();
            }
        });
    }
}

// Configurar validación del formulario
function setupFormValidation() {
    // Configurar fechas mínimas
    setMinimumDates();
    
    // Relación con estudiante
    document.getElementById('relationship').addEventListener('change', (e) => {
        const otherGroup = document.getElementById('otherRelationshipGroup');
        const otherInput = document.getElementById('otherRelationship');
        
        if (e.target.value === 'otro') {
            otherGroup.style.display = 'block';
            otherInput.required = true;
        } else {
            otherGroup.style.display = 'none';
            otherInput.required = false;
        }
    });
    
    // Teléfono - solo números
    document.getElementById('registrantPhone').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    
    // Grado del estudiante
    document.getElementById('studentGrade').addEventListener('change', loadStudentsByGrade);
    
    // Selección de estudiante
    document.getElementById('studentSelect').addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.code) {
            document.getElementById('studentCode').value = selectedOption.dataset.code;
        }
    });
    
    // Validación de fechas con actualización dinámica
    document.getElementById('startDate').addEventListener('change', (e) => {
        validateDates();
        // Actualizar fecha mínima del campo endDate basado en startDate
        const endDateInput = document.getElementById('endDate');
        if (e.target.value) {
            endDateInput.min = e.target.value;
        }
        
        // Actualizar meses disponibles para excusas
        if (requestType === 'excusa') {
            updateAvailableMonths();
        }
    });
    
    document.getElementById('endDate').addEventListener('change', validateDates);
}

// Mostrar/ocultar loading
function showLoading() {
    if (elements.loading) {
        elements.loading.style.display = 'flex';
        
        // Mostrar botón de recarga después de 10 segundos
        setTimeout(() => {
            const reloadBtn = document.getElementById('reloadBtn');
            if (reloadBtn && elements.loading.style.display === 'flex') {
                reloadBtn.style.display = 'block';
            }
        }, 10000);
        
        // Auto-hide loading después de 30 segundos como fallback
        setTimeout(() => {
            if (elements.loading && elements.loading.style.display === 'flex') {
                console.warn('Loading timeout - hiding automatically');
                hideLoading();
            }
        }, 30000);
    }
}

function hideLoading() {
    if (elements.loading) {
        elements.loading.style.display = 'none';
        const reloadBtn = document.getElementById('reloadBtn');
        if (reloadBtn) {
            reloadBtn.style.display = 'none';
        }
    }
}

// Navegación entre vistas
function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        if (view.classList && typeof view.classList.remove === 'function') {
            view.classList.remove('active');
        }
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.classList && typeof btn.classList.remove === 'function') {
            btn.classList.remove('active');
        }
    });
    
    switch(viewName) {
        case 'home':
            elements.homeView.classList.add('active');
            elements.homeBtn.classList.add('active');
            break;
        case 'form':
            elements.formView.classList.add('active');
            break;
        case 'consult':
            elements.consultView.classList.add('active');
            elements.consultBtn.classList.add('active');
            break;
        case 'login':
            elements.loginView.classList.add('active');
            elements.loginBtn.classList.add('active');
            break;
        case 'dashboard':
            elements.dashboardView.classList.add('active');
            loadDashboard();
            break;
    }
}

// Función loadStudents simplificada - SOLO retorna datos fallback
async function loadStudents() {
    console.log('📚 Cargando datos de estudiantes...');
    
    // SIEMPRE usar datos fallback para esta función
    const fallbackStudents = getFallbackStudents();
    
    window.studentsData = fallbackStudents;
    window.dataSource = 'fallback';
    
    console.log('✅ Datos fallback listos:', fallbackStudents.length, 'estudiantes');
    
    return fallbackStudents;
}

// Nueva función específica para cargar desde Supabase (sin fallback interno)
async function loadStudentsFromSupabase() {
    console.log('📡 Conectando con Supabase...');
    console.log('🔗 URL:', SUPABASE_URL);
    console.log('🔑 API Key presente:', !!SUPABASE_ANON_KEY);
    
    if (!supabase) {
        throw new Error('Cliente Supabase no inicializado');
    }
    
    // Test de conexión básica primero
    const { data: connectionTest, error: connectionError } = await supabase
        .from('students')
        .select('count')
        .limit(1);
    
    if (connectionError) {
        console.error('❌ Error de conexión:', connectionError);
        
        if (connectionError.code === 'PGRST116') {
            throw new Error('Tabla "students" no existe - Ejecute el SQL');
        }
        if (connectionError.code === 'PGRST301') {
            throw new Error('Sin permisos - Configure políticas RLS');
        }
        if (connectionError.code === '42P01') {
            throw new Error('Tabla no encontrada - Verifique base de datos');
        }
        
        throw new Error(`Error Supabase: ${connectionError.message}`);
    }
    
    console.log('✅ Conexión básica exitosa');
    
    // Cargar estudiantes
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('grade', { ascending: true })
        .order('full_name', { ascending: true });
    
    if (studentsError) {
        console.error('❌ Error cargando estudiantes:', studentsError);
        throw new Error(`Error datos: ${studentsError.message}`);
    }
    
    if (!students || students.length === 0) {
        throw new Error('Tabla vacía - Inserte datos de estudiantes');
    }
    
    console.log('✅ Estudiantes cargados desde Supabase:', students.length);
    return students;
}

// Función separada para datos fallback
function getFallbackStudents() {
    return [
        {id: 1, code: '0001', full_name: 'Ana María González', grade: 'pre-jardín'},
        {id: 2, code: '0002', full_name: 'Carlos Pérez', grade: 'jardín'},
        {id: 3, code: '0003', full_name: 'Laura Rodríguez', grade: 'transición'},
        {id: 4, code: '0004', full_name: 'Juan Martínez', grade: 'primero'},
        {id: 5, code: '0005', full_name: 'Sofía López', grade: 'segundo'},
        {id: 6, code: '0006', full_name: 'Diego Hernández', grade: 'tercero'},
        {id: 7, code: '0007', full_name: 'Valentina Castro', grade: 'cuarto'},
        {id: 8, code: '0008', full_name: 'Andrés Ruiz', grade: 'quinto'},
        {id: 9, code: '0009', full_name: 'Isabella Torres', grade: 'sexto'},
        {id: 10, code: '0010', full_name: 'Santiago Moreno', grade: 'séptimo'},
        {id: 11, code: '0011', full_name: 'Camila Jiménez', grade: 'octavo'},
        {id: 12, code: '0012', full_name: 'Mateo Vargas', grade: 'noveno'},
        {id: 13, code: '0013', full_name: 'Antonia Sánchez', grade: 'décimo'},
        {id: 14, code: '0014', full_name: 'Nicolás Ramírez', grade: 'undécimo'}
    ];
}

// Cargar estudiantes por grado
function loadStudentsByGrade() {
    const gradeSelect = document.getElementById('studentGrade');
    const studentSelect = document.getElementById('studentSelect');
    const selectedGrade = gradeSelect.value;
    
    studentSelect.innerHTML = '<option value="">Seleccione un estudiante...</option>';
    studentSelect.disabled = !selectedGrade;
    
    if (selectedGrade && window.studentsData) {
        const studentsInGrade = window.studentsData.filter(student => student.grade === selectedGrade);
        
        studentsInGrade.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.full_name;
            option.dataset.code = student.code;
            studentSelect.appendChild(option);
        });
        
        studentSelect.disabled = false;
    }
}

// Validar fechas
function validateDates() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const today = new Date();
    
    // Establecer hora a medianoche para comparar solo fechas
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    // PERMITIR fecha de hoy y fechas futuras, pero NO fechas anteriores
    if (startDate < today) {
        alert('No se pueden registrar solicitudes para fechas pasadas. Puede registrar para HOY o fechas futuras.');
        document.getElementById('startDate').value = '';
        document.getElementById('startDate').focus();
        return false;
    }
    
    if (endDate) {
        endDate.setHours(0, 0, 0, 0);
        if (endDate < startDate) {
            alert('La fecha de fin no puede ser anterior a la fecha de inicio');
            document.getElementById('endDate').value = '';
            document.getElementById('endDate').focus();
            return false;
        }
        
        // La fecha de fin tampoco puede ser anterior a hoy
        if (endDate < today) {
            alert('La fecha de fin no puede ser anterior a hoy');
            document.getElementById('endDate').value = '';
            document.getElementById('endDate').focus();
            return false;
        }
    }
    
    return true;
}

// Actualizar meses disponibles para mostrar meses FUTUROS
function updateAvailableMonths() {
    const startDate = document.getElementById('startDate').value;
    const monthSelect = document.getElementById('absenceMonth');
    
    if (!startDate || !monthSelect) return;
    
    const selectedDate = new Date(startDate + 'T00:00:00');
    
    // Obtener fecha y mes actual en Colombia
    const todayString = getTodayInColombia();
    const currentDate = new Date(todayString + 'T00:00:00');
    const currentMonthInColombia = getCurrentMonthInColombia(); // 0-11
    
    // Usar la fecha más tardía entre hoy y la fecha seleccionada
    const referenceDate = selectedDate > currentDate ? selectedDate : currentDate;
    const referenceMonth = selectedDate > currentDate ? selectedDate.getMonth() : currentMonthInColombia;
    
    const months = [
        { value: 'enero', index: 0 },
        { value: 'febrero', index: 1 },
        { value: 'marzo', index: 2 },
        { value: 'abril', index: 3 },
        { value: 'mayo', index: 4 },
        { value: 'junio', index: 5 },
        { value: 'julio', index: 6 },
        { value: 'agosto', index: 7 },
        { value: 'septiembre', index: 8 },
        { value: 'octubre', index: 9 },
        { value: 'noviembre', index: 10 },
        { value: 'diciembre', index: 11 }
    ];
    
    // Limpiar opciones existentes
    monthSelect.innerHTML = '<option value="">Seleccione el mes...</option>';
    
    // Agregar solo los meses FUTUROS (desde el mes siguiente hacia adelante)
    months.forEach(month => {
        if (month.index > referenceMonth) {
            const option = document.createElement('option');
            option.value = month.value;
            option.textContent = month.value.charAt(0).toUpperCase() + month.value.slice(1);
            monthSelect.appendChild(option);
        }
    });
    
    // Si estamos en diciembre, mostrar todos los meses del año siguiente
    if (referenceMonth === 11) {
        // Agregar meses del año siguiente
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month.value;
            option.textContent = month.value.charAt(0).toUpperCase() + month.value.slice(1) + ' (siguiente año)';
            monthSelect.appendChild(option);
        });
    }
    
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    console.log(`📅 Mes actual en Colombia: ${monthNames[currentMonthInColombia]} (${currentMonthInColombia})`);
    console.log(`📅 Mostrando meses desde: ${monthNames[referenceMonth + 1] || 'enero (siguiente año)'} en adelante`);
}

// Configurar fecha mínima en los campos de fecha (HOY, no mañana)
function setMinimumDates() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.min = todayString; // Permite desde HOY
    }
    if (endDateInput) {
        endDateInput.min = todayString; // Permite desde HOY
    }
}

// Navegación del stepper
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < 5) {
            currentStep++;
            updateStepper();
            updateFormStep();
        }
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepper();
        updateFormStep();
    }
}

function updateStepper() {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 === currentStep);
        step.classList.toggle('completed', index + 1 < currentStep);
    });
}

function updateFormStep() {
    document.querySelectorAll('.form-step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 === currentStep);
    });
    
    // Actualizar botones
    elements.prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    elements.nextBtn.style.display = currentStep < 5 ? 'block' : 'none';
    elements.submitBtn.style.display = currentStep === 5 ? 'block' : 'none';
    
    // Actualizar resumen en el paso 5
    if (currentStep === 5) {
        updateSummary();
    }
}

// Validar paso actual
function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const requiredInputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
    
    for (let input of requiredInputs) {
        if (!input.value.trim()) {
            input.focus();
            alert(`Por favor complete el campo: ${input.previousElementSibling.textContent}`);
            return false;
        }
        
        if (input.type === 'email' && !isValidEmail(input.value)) {
            input.focus();
            alert('Por favor ingrese un correo electrónico válido');
            return false;
        }
        
        if (input.type === 'tel' && input.value.length < 10) {
            input.focus();
            alert('El teléfono debe tener al menos 10 dígitos');
            return false;
        }
    }
    
    // Validaciones específicas por paso
    if (currentStep === 1) {
        if (!document.getElementById('dataProtection').checked) {
            alert('Debe aceptar el tratamiento de datos personales para continuar');
            return false;
        }
    }
    
    if (currentStep === 3) {
        const studentSelect = document.getElementById('studentSelect');
        const studentGrade = document.getElementById('studentGrade');
        
        if (!studentGrade.value) {
            alert('Debe seleccionar un grado');
            studentGrade.focus();
            return false;
        }
        
        if (!studentSelect.value || studentSelect.value === '') {
            alert('Debe seleccionar un estudiante de la lista');
            studentSelect.focus();
            return false;
        }
        
        // Verificar que el estudiante seleccionado sea válido
        const selectedOption = studentSelect.selectedOptions[0];
        if (!selectedOption || !selectedOption.dataset.code) {
            alert('La selección del estudiante no es válida. Por favor seleccione nuevamente.');
            studentSelect.focus();
            return false;
        }
        
        console.log('Student validation passed:', {
            grade: studentGrade.value,
            studentId: studentSelect.value,
            studentName: selectedOption.textContent,
            studentCode: selectedOption.dataset.code
        });
    }
    
    if (currentStep === 4) {
        // Validaciones específicas para el paso 4
        if (!validateDates()) {
            return false;
        }
        
        // Validaciones específicas para permisos
        if (requestType === 'permiso') {
            const startTime = document.getElementById('startTime').value;
            if (!startTime.trim()) {
                alert('La hora de salida es obligatoria para permisos');
                document.getElementById('startTime').focus();
                return false;
            }
        }
        
        // Validaciones específicas para excusas
        if (requestType === 'excusa') {
            const absenceDays = document.getElementById('absenceDays').value;
            const absenceMonth = document.getElementById('absenceMonth').value;
            
            if (!absenceDays.trim()) {
                alert('Los días de inasistencia son obligatorios para excusas');
                document.getElementById('absenceDays').focus();
                return false;
            }
            
            if (!absenceMonth) {
                alert('El mes de inasistencia es obligatorio para excusas');
                document.getElementById('absenceMonth').focus();
                return false;
            }
        }
        
        // Validación común: reason y description
        const reason = document.getElementById('reason').value;
        const description = document.getElementById('description').value;
        
        if (!reason) {
            alert('Debe seleccionar un motivo para la solicitud');
            document.getElementById('reason').focus();
            return false;
        }
        
        if (!description.trim()) {
            alert('La descripción detallada es obligatoria');
            document.getElementById('description').focus();
            return false;
        }
    }
    
    return true;
}

// Validar email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Actualizar resumen
function updateSummary() {
    const summaryContent = document.getElementById('summaryContent');
    const formData = getFormData();
    
    summaryContent.innerHTML = `
        <div class="summary-item">
            <strong>Tipo de solicitud:</strong> ${requestType.charAt(0).toUpperCase() + requestType.slice(1)}
        </div>
        <div class="summary-item">
            <strong>Solicitante:</strong> ${formData.registrantName} (${formData.relationship})
        </div>
        <div class="summary-item">
            <strong>Estudiante:</strong> ${document.getElementById('studentSelect').selectedOptions[0]?.textContent || ''}
        </div>
        <div class="summary-item">
            <strong>Código:</strong> ${formData.studentCode}
        </div>
        <div class="summary-item">
            <strong>Fecha(s):</strong> ${formData.startDate} ${formData.endDate ? `- ${formData.endDate}` : ''}
        </div>
        <div class="summary-item">
            <strong>Motivo:</strong> ${document.getElementById('reason').selectedOptions[0]?.textContent || ''}
        </div>
        <div class="summary-item">
            <strong>Descripción:</strong> ${formData.description}
        </div>
    `;
}

// Obtener datos del formulario
function getFormData() {
    return {
        type: requestType,
        registrantName: document.getElementById('registrantName').value,
        registrantEmail: document.getElementById('registrantEmail').value,
        registrantPhone: document.getElementById('registrantPhone').value,
        relationship: document.getElementById('relationship').value,
        otherRelationship: document.getElementById('otherRelationship').value,
        studentId: parseInt(document.getElementById('studentSelect').value),
        studentCode: document.getElementById('studentCode').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        reason: document.getElementById('reason').value,
        description: document.getElementById('description').value,
        dataProtectionAccepted: document.getElementById('dataProtection').checked
    };
}

// Enviar solicitud
async function submitRequest() {
    if (!supabase) {
        alert('Error: No hay conexión con la base de datos');
        return;
    }
    
    try {
        showLoading();
        
        const formData = getFormData();
        console.log('Submitting request:', formData);
        
        // Validación final antes del envío
        if (!formData.student_id || isNaN(formData.student_id)) {
            throw new Error('Debe seleccionar un estudiante válido');
        }
        
        if (!formData.data_protection_accepted) {
            throw new Error('Debe aceptar el tratamiento de datos personales');
        }
        
        // Limpiar campos vacíos
        Object.keys(formData).forEach(key => {
            if (formData[key] === '' || formData[key] === 'undefined') {
                formData[key] = null;
            }
        });
        
        const { data, error } = await supabase
            .from('excuse_permission_requests')
            .insert([formData])
            .select();
            
        if (error) {
            console.error('Supabase error:', error);
            throw new Error(`Error en la base de datos: ${error.message}`);
        }
        
        if (!data || data.length === 0) {
            throw new Error('No se recibió confirmación de la base de datos');
        }
        
        const filingNumber = data[0].filing_number || `RAD${Date.now()}`;
        console.log('Request submitted successfully:', filingNumber);
        
        // Ocultar debug info en caso de éxito
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.style.display = 'none';
        }
        
        elements.generatedFiling.textContent = filingNumber;
        elements.successModal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error al enviar solicitud:', error);
        alert(`Error al enviar la solicitud: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Resetear formulario
function resetForm() {
    console.log('🔄 Resetting form...');
    
    currentStep = 1;
    elements.requestForm.reset();
    updateStepper();
    updateFormStep();
    
    // Limpiar campos específicos
    document.getElementById('otherRelationshipGroup').style.display = 'none';
    document.getElementById('studentSelect').disabled = true;
    document.getElementById('studentCode').value = '';
    
    // Ocultar campos específicos de tipo
    document.querySelector('.permission-fields').style.display = 'none';
    document.querySelector('.excuse-fields').style.display = 'none';
    
    // Ocultar debug info
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo) {
        debugInfo.style.display = 'none';
    }
    
    // Mantener el estado del indicador fallback (no resetearlo)
    // showFallbackWarning permanece como está
    
    // Limpiar validaciones requeridas
    document.getElementById('startTime').required = false;
    document.getElementById('absenceDays').required = false;
    document.getElementById('absenceMonth').required = false;
    
    // Reset checkboxes
    document.getElementById('medicalCertificate').checked = false;
    document.getElementById('incapacityCertificate').checked = false;
    document.getElementById('dataProtection').checked = false;
    
    // Restablecer fechas mínimas (usando zona horaria colombiana)
    setMinimumDates();
    
    // Restablecer selector de meses al estado original
    const monthSelect = document.getElementById('absenceMonth');
    monthSelect.innerHTML = `
        <option value="">Seleccione el mes...</option>
        <option value="enero">Enero</option>
        <option value="febrero">Febrero</option>
        <option value="marzo">Marzo</option>
        <option value="abril">Abril</option>
        <option value="mayo">Mayo</option>
        <option value="junio">Junio</option>
        <option value="julio">Julio</option>
        <option value="agosto">Agosto</option>
        <option value="septiembre">Septiembre</option>
        <option value="octubre">Octubre</option>
        <option value="noviembre">Noviembre</option>
        <option value="diciembre">Diciembre</option>
    `;
    
    // Limpiar tipo de request
    requestType = '';
    
    console.log('✅ Form reset completed');
}

// Consultar radicado
async function consultFiling() {
    const filingNumber = document.getElementById('filingNumber').value.trim();
    if (!filingNumber) {
        alert('Por favor ingrese un número de radicado');
        return;
    }
    
    if (!supabase) {
        alert('Error: No hay conexión con la base de datos');
        return;
    }
    
    try {
        showLoading();
        console.log('Consulting filing number:', filingNumber);
        
        const { data, error } = await supabase
            .from('excuse_permission_requests')
            .select(`
                *,
                students(full_name, grade),
                coordinators(full_name),
                teachers(full_name)
            `)
            .eq('filing_number', filingNumber)
            .single();
            
        if (error) {
            console.error('Consult error:', error);
            if (error.code === 'PGRST116') {
                throw new Error(`No se encontró información para el radicado: ${filingNumber}`);
            }
            throw new Error(`Error al consultar: ${error.message}`);
        }
        
        if (!data) {
            throw new Error(`No se encontró información para el radicado: ${filingNumber}`);
        }
        
        console.log('Filing found:', data);
        displayConsultResult(data);
        
    } catch (error) {
        console.error('Error al consultar radicado:', error);
        document.getElementById('consultResult').innerHTML = `
            <div class="alert alert-error">
                ${error.message}
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Mostrar resultado de consulta
function displayConsultResult(data) {
    const resultDiv = document.getElementById('consultResult');
    
    const getStatusBadge = (status) => {
        const statusMap = {
            pending: { text: 'Pendiente', class: 'warning' },
            approved: { text: 'Aprobado', class: 'success' },
            rejected: { text: 'Rechazado', class: 'error' }
        };
        const statusInfo = statusMap[status] || { text: status, class: 'info' };
        return `<span class="badge badge-${statusInfo.class}">${statusInfo.text}</span>`;
    };
    
    let detailsHTML = `
        <div class="request-details">
            <h3>📋 Información de la Solicitud</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Radicado:</strong> ${data.filing_number}
                </div>
                <div class="detail-item">
                    <strong>Tipo:</strong> ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}
                </div>
                <div class="detail-item">
                    <strong>Estudiante:</strong> ${data.students.full_name} (${data.students.grade})
                </div>
                <div class="detail-item">
                    <strong>Solicitante:</strong> ${data.registrant_name}
                </div>
                <div class="detail-item">
                    <strong>Fecha:</strong> ${data.start_date} ${data.end_date ? `- ${data.end_date}` : ''}
                </div>
    `;
    
    // Información específica para permisos
    if (data.type === 'permiso') {
        if (data.start_time) {
            detailsHTML += `
                <div class="detail-item">
                    <strong>Hora de salida:</strong> ${data.start_time}
                </div>
            `;
        }
        if (data.end_time) {
            detailsHTML += `
                <div class="detail-item">
                    <strong>Hora de regreso:</strong> ${data.end_time}
                </div>
            `;
        }
    }
    
    // Información específica para excusas
    if (data.type === 'excusa') {
        if (data.absence_days) {
            detailsHTML += `
                <div class="detail-item">
                    <strong>Días de inasistencia:</strong> ${data.absence_days}
                </div>
            `;
        }
        if (data.absence_month) {
            detailsHTML += `
                <div class="detail-item">
                    <strong>Mes:</strong> ${data.absence_month}
                </div>
            `;
        }
        
        const certificates = [];
        if (data.medical_certificate) certificates.push('Certificado médico');
        if (data.incapacity_certificate) certificates.push('Incapacidad');
        
        if (certificates.length > 0) {
            detailsHTML += `
                <div class="detail-item">
                    <strong>Documentos:</strong> ${certificates.join(', ')}
                </div>
            `;
        }
    }
    
    detailsHTML += `
                <div class="detail-item">
                    <strong>Motivo:</strong> ${data.reason}
                </div>
                <div class="detail-item full-width">
                    <strong>Descripción:</strong> ${data.description}
                </div>
            </div>
            
            <div class="status-section">
                <h4>📊 Estado de Aprobaciones</h4>
                <div class="status-grid">
                    <div class="status-item">
                        <strong>Coordinación de Convivencia:</strong> ${getStatusBadge(data.coordinator_status)}
                        ${data.coordinator_comments ? `<p class="comments">${data.coordinator_comments}</p>` : ''}
                        ${data.coordinator_date ? `<small>Fecha: ${new Date(data.coordinator_date).toLocaleDateString()}</small>` : ''}
                    </div>
                    <div class="status-item">
                        <strong>Coordinación Académica:</strong> ${getStatusBadge(data.academic_coordinator_status || 'pending')}
                        ${data.academic_coordinator_comments ? `<p class="comments">${data.academic_coordinator_comments}</p>` : ''}
                        ${data.academic_coordinator_date ? `<small>Fecha: ${new Date(data.academic_coordinator_date).toLocaleDateString()}</small>` : ''}
                    </div>
                    <div class="status-item">
                        <strong>Docente:</strong> ${getStatusBadge(data.teacher_status)}
                        ${data.teacher_comments ? `<p class="comments">${data.teacher_comments}</p>` : ''}
                        ${data.teacher_assignments ? `<p class="assignments"><strong>Trabajos asignados:</strong> ${data.teacher_assignments}</p>` : ''}
                        ${data.teacher_date ? `<small>Fecha: ${new Date(data.teacher_date).toLocaleDateString()}</small>` : ''}
                    </div>
                    <div class="status-item">
                        <strong>Asesor de Grupo:</strong> ${getStatusBadge(data.group_advisor_status || 'pending')}
                        ${data.group_advisor_comments ? `<p class="comments">${data.group_advisor_comments}</p>` : ''}
                        ${data.group_advisor_date ? `<small>Fecha: ${new Date(data.group_advisor_date).toLocaleDateString()}</small>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultDiv.innerHTML = detailsHTML;
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    if (!supabase) {
        alert('Error: No hay conexión con la base de datos');
        return;
    }
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!currentRole) {
        alert('Por favor seleccione un tipo de usuario');
        return;
    }
    
    if (!username || !password) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    try {
        showLoading();
        
        const tableName = currentRole === 'coordinator' ? 'coordinators' : 
                         currentRole === 'teacher' ? 'teachers' : 'administrators';
        
        console.log(`Attempting login for ${currentRole} with username: ${username}`);
        
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();
            
        if (error) {
            console.error('Login error:', error);
            if (error.code === 'PGRST116') {
                throw new Error('Usuario o contraseña incorrectos');
            }
            throw new Error(`Error de conexión: ${error.message}`);
        }
        
        if (!data) {
            throw new Error('Usuario o contraseña incorrectos');
        }
        
        console.log('Login successful for:', data.full_name);
        
        currentUser = data;
        elements.userName.textContent = data.full_name;
        elements.userInfo.style.display = 'block';
        elements.loginBtn.style.display = 'none';
        
        showView('dashboard');
        
    } catch (error) {
        console.error('Error en login:', error);
        alert(error.message || 'Error al iniciar sesión');
    } finally {
        hideLoading();
    }
}

// Logout
async function logout() {
    if (supabase && supabase.auth && typeof supabase.auth.signOut === 'function') {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert(`Error al cerrar sesión: ${error.message}`);
        }
    }

    currentUser = null;
    currentRole = null;
    if (elements.userInfo) elements.userInfo.style.display = 'none';
    if (elements.loginBtn) elements.loginBtn.style.display = 'block';
    if (typeof document !== 'undefined') {
        const userInput = document.getElementById('username');
        if (userInput) userInput.value = '';
        const passInput = document.getElementById('password');
        if (passInput) passInput.value = '';
    }
    if (typeof showView === 'function' && elements.homeView && elements.homeView.classList) {
        showView('home');
    }
}

// Cargar dashboard
async function loadDashboard() {
    if (!currentUser) return;
    
    try {
        showLoading();
        
        // Estadísticas del día
        const today = new Date().toISOString().split('T')[0];
        
        const { data: todayData } = await supabase
            .from('excuse_permission_requests')
            .select('*')
            .gte('created_at', today);
            
        document.getElementById('todayRequests').textContent = todayData?.length || 0;
        
        // Solicitudes pendientes
        let pendingQuery = supabase
            .from('excuse_permission_requests')
            .select('*');
            
        if (currentRole === 'coordinator') {
            pendingQuery = pendingQuery.eq('coordinator_status', 'pending');
        } else         if (currentRole === 'teacher') {
            // Para docentes, filtrar por grados que manejan
            pendingQuery = pendingQuery
                .eq('coordinator_status', 'approved')
                .eq('teacher_status', 'pending');
        }
        
        const { data: pendingData } = await pendingQuery;
        let filteredPendingData = pendingData;
        if (currentRole === 'teacher' && pendingData) {
            filteredPendingData = await filterRequestsByTeacherGrades(pendingData);
        }
        document.getElementById('pendingRequests').textContent = filteredPendingData?.length || 0;
        
        // Solicitudes aprobadas
        const { data: approvedData } = await supabase
            .from('excuse_permission_requests')
            .select('*')
            .eq('coordinator_status', 'approved')
            .eq('teacher_status', 'approved');
            
        document.getElementById('approvedRequests').textContent = approvedData?.length || 0;
        
        // Cargar tabla de solicitudes
        await loadRequestsTable();
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
    } finally {
        hideLoading();
    }
}

// Filtrar solicitudes por docente según sus grados
async function filterRequestsByTeacherGrades(requests) {
    if (!currentUser || currentRole !== 'teacher') return requests;
    
    try {
        // Parsear los grados del docente (stored as JSON string)
        const teacherGrades = JSON.parse(currentUser.grades);
        
        // Obtener información de estudiantes para filtrar por grado
        const studentIds = requests.map(r => r.student_id);
        const { data: students } = await supabase
            .from('students')
            .select('id, grade')
            .in('id', studentIds);
            
        // Filtrar solicitudes donde el estudiante esté en un grado que maneja el docente
        return requests.filter(request => {
            const student = students.find(s => s.id === request.student_id);
            return student && teacherGrades.includes(student.grade);
        });
    } catch (error) {
        console.error('Error al filtrar solicitudes por grado:', error);
        return requests;
    }
}

// Cargar tabla de solicitudes
async function loadRequestsTable() {
    try {
        let query = supabase
            .from('excuse_permission_requests')
            .select(`
                *,
                students(full_name, grade, code)
            `)
            .order('created_at', { ascending: false });
            
        if (currentRole === 'coordinator') {
            query = query.eq('coordinator_status', 'pending');
        } else if (currentRole === 'teacher') {
            query = query
                .eq('coordinator_status', 'approved')
                .eq('teacher_status', 'pending');
        }
        
        const { data: requests } = await query;
        
        // Filtrar por grados del docente si es necesario
        let filteredRequests = requests;
        if (currentRole === 'teacher' && requests) {
            filteredRequests = await filterRequestsByTeacherGrades(requests);
        }
        
        const tableContainer = document.getElementById('requestsList');
        
        if (!filteredRequests || filteredRequests.length === 0) {
            tableContainer.innerHTML = '<p>No hay solicitudes pendientes</p>';
            return;
        }
        
        let tableHTML = `
            <table class="requests-table">
                <thead>
                    <tr>
                        <th>Radicado</th>
                        <th>Tipo</th>
                        <th>Estudiante</th>
                        <th>Grado</th>
                        <th>Fecha</th>
                        <th>Solicitante</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        filteredRequests.forEach(request => {
            tableHTML += `
                <tr>
                    <td>${request.filing_number}</td>
                    <td>${request.type}</td>
                    <td>${request.students.full_name}</td>
                    <td>${request.students.grade}</td>
                    <td>${request.start_date}</td>
                    <td>${request.registrant_name}</td>
                    <td>
                        <button class="btn-small btn-primary" onclick="reviewRequest('${request.id}')">
                            Revisar
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        tableContainer.innerHTML = tableHTML;
        
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
    }
}

// Revisar solicitud (función global)
window.reviewRequest = async function(requestId) {
    try {
        const { data: request } = await supabase
            .from('excuse_permission_requests')
            .select(`
                *,
                students(full_name, grade, code)
            `)
            .eq('id', requestId)
            .single();
            
        if (!request) return;
        
        const action = confirm(`¿Desea APROBAR la solicitud ${request.filing_number}?\n\nEstudiante: ${request.students.full_name}\nMotivo: ${request.reason}\nDescripción: ${request.description}\n\nOK = Aprobar | Cancelar = Rechazar`);
        
        let comments = '';
        let assignments = '';
        
        if (action) {
            comments = prompt('Comentarios de aprobación (opcional):') || '';
            if (currentRole === 'teacher') {
                assignments = prompt('Trabajos que debe presentar el estudiante (opcional):') || '';
            }
        } else {
            comments = prompt('Motivo del rechazo:');
            if (!comments) return;
        }
        
        const updateData = {};
        
        if (currentRole === 'coordinator') {
            updateData.coordinator_status = action ? 'approved' : 'rejected';
            updateData.coordinator_id = currentUser.id;
            updateData.coordinator_comments = comments;
            updateData.coordinator_date = new Date().toISOString();
        } else if (currentRole === 'teacher') {
            updateData.teacher_status = action ? 'approved' : 'rejected';
            updateData.teacher_id = currentUser.id;
            updateData.teacher_comments = comments;
            updateData.teacher_assignments = assignments;
            updateData.teacher_date = new Date().toISOString();
        }
        
        const { error } = await supabase
            .from('excuse_permission_requests')
            .update(updateData)
            .eq('id', requestId);
            
        if (error) throw error;
        
        alert('Solicitud procesada correctamente');
        await loadDashboard();
        
    } catch (error) {
        console.error('Error al procesar solicitud:', error);
        alert('Error al procesar la solicitud');
    }
};

// Inicializar role por defecto
currentRole = 'coordinator';


// Export funciones para pruebas
export { logout };
