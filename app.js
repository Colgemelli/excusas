// Configuración de Supabase
const SUPABASE_URL = 'https://nbpldfyisdhgnkmgwaix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icGxkZnlpc2RoZ25rbWd3YWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjY1MTUsImV4cCI6MjA2NjU0MjUxNX0.Pe4ImgTYLmRqOqG-RdhJI2SY0QPl_cyBENOxKvZB0DY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    hideLoading();
    setupEventListeners();
    setupFormValidation();
    await loadStudents();
});

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    elements.homeBtn.addEventListener('click', () => showView('home'));
    elements.consultBtn.addEventListener('click', () => showView('consult'));
    elements.loginBtn.addEventListener('click', () => showView('login'));
    elements.logoutBtn.addEventListener('click', logout);
    
    // Opciones de solicitud
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', (e) => {
            requestType = card.dataset.type;
            elements.formTitle.textContent = `Solicitud de ${requestType.charAt(0).toUpperCase() + requestType.slice(1)}`;
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
}

// Configurar validación del formulario
function setupFormValidation() {
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
    
    // Validación de fechas
    document.getElementById('startDate').addEventListener('change', validateDates);
    document.getElementById('endDate').addEventListener('change', validateDates);
}

// Mostrar/ocultar loading
function showLoading() {
    elements.loading.style.display = 'flex';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

// Navegación entre vistas
function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
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

// Cargar estudiantes
async function loadStudents() {
    try {
        const { data: students, error } = await supabase
            .from('students')
            .select('*')
            .order('grade', { ascending: true })
            .order('full_name', { ascending: true });
            
        if (error) throw error;
        
        window.studentsData = students;
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        alert('Error al cargar la información de estudiantes');
    }
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
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
        alert('La fecha de inicio no puede ser anterior a hoy');
        document.getElementById('startDate').value = '';
        return false;
    }
    
    if (endDate && endDate < startDate) {
        alert('La fecha de fin no puede ser anterior a la fecha de inicio');
        document.getElementById('endDate').value = '';
        return false;
    }
    
    return true;
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
        if (!document.getElementById('studentSelect').value) {
            alert('Debe seleccionar un estudiante');
            return false;
        }
    }
    
    if (currentStep === 4) {
        return validateDates();
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
    try {
        showLoading();
        
        const formData = getFormData();
        
        const { data, error } = await supabase
            .from('excuse_permission_requests')
            .insert([formData])
            .select();
            
        if (error) throw error;
        
        const filingNumber = data[0].filing_number;
        elements.generatedFiling.textContent = filingNumber;
        elements.successModal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error al enviar solicitud:', error);
        alert('Error al enviar la solicitud. Por favor intente nuevamente.');
    } finally {
        hideLoading();
    }
}

// Resetear formulario
function resetForm() {
    currentStep = 1;
    elements.requestForm.reset();
    updateStepper();
    updateFormStep();
    document.getElementById('otherRelationshipGroup').style.display = 'none';
    document.getElementById('studentSelect').disabled = true;
    document.getElementById('studentCode').value = '';
}

// Consultar radicado
async function consultFiling() {
    const filingNumber = document.getElementById('filingNumber').value;
    if (!filingNumber) {
        alert('Por favor ingrese un número de radicado');
        return;
    }
    
    try {
        showLoading();
        
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
            
        if (error) throw error;
        
        displayConsultResult(data);
        
    } catch (error) {
        console.error('Error al consultar radicado:', error);
        document.getElementById('consultResult').innerHTML = `
            <div class="alert alert-error">
                No se encontró información para el radicado: ${filingNumber}
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
    
    resultDiv.innerHTML = `
        <div class="request-details">
            <h3>Información de la Solicitud</h3>
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
                <div class="detail-item">
                    <strong>Motivo:</strong> ${data.reason}
                </div>
                <div class="detail-item full-width">
                    <strong>Descripción:</strong> ${data.description}
                </div>
            </div>
            
            <div class="status-section">
                <h4>Estado de Aprobaciones</h4>
                <div class="status-grid">
                    <div class="status-item">
                        <strong>Coordinación:</strong> ${getStatusBadge(data.coordinator_status)}
                        ${data.coordinator_comments ? `<p class="comments">${data.coordinator_comments}</p>` : ''}
                    </div>
                    <div class="status-item">
                        <strong>Docente:</strong> ${getStatusBadge(data.teacher_status)}
                        ${data.teacher_comments ? `<p class="comments">${data.teacher_comments}</p>` : ''}
                        ${data.teacher_assignments ? `<p class="assignments"><strong>Trabajos asignados:</strong> ${data.teacher_assignments}</p>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!currentRole) {
        alert('Por favor seleccione un tipo de usuario');
        return;
    }
    
    try {
        showLoading();
        
        const tableName = currentRole === 'coordinator' ? 'coordinators' : 
                         currentRole === 'teacher' ? 'teachers' : 'administrators';
        
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();
            
        if (error) throw error;
        
        currentUser = data;
        elements.userName.textContent = data.full_name;
        elements.userInfo.style.display = 'block';
        elements.loginBtn.style.display = 'none';
        
        showView('dashboard');
        
    } catch (error) {
        console.error('Error en login:', error);
        alert('Usuario o contraseña incorrectos');
    } finally {
        hideLoading();
    }
}

// Logout
function logout() {
    currentUser = null;
    currentRole = null;
    elements.userInfo.style.display = 'none';
    elements.loginBtn.style.display = 'block';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    showView('home');
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
