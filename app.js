// ========== SISTEMA DE EXCUSAS - VERSIÓN SIMPLIFICADA Y ROBUSTA ==========
// Esta versión elimina problemas de inicialización y es más estable

console.log('🚀 Cargando sistema simplificado...');

// ========== CONFIGURACIÓN GLOBAL ==========
window.SISTEMA_CONFIG = {
    debug: true,
    useLocal: true,
    radicadoPrefix: 'RAD-',
    radicadoCounter: 1000,
    maxRetries: 3,
    timeout: 5000
};

// ========== CLASE PRINCIPAL SIMPLIFICADA ==========
class SistemaExcusasSimple {
    constructor() {
        this.currentView = 'homeView';
        this.currentUser = null;
        this.solicitudes = [];
        this.radicadoCounter = 1000;
        this.initStep = 0;
        this.maxSteps = 4;
        this.currentStepExcusa = 1;
        this.currentStepPermiso = 1;
        
        this.log('🎯 Constructor ejecutado');
        this.initSafe();
    }

    // ========== INICIALIZACIÓN SEGURA ==========
    async initSafe() {
        try {
            this.log('📋 Iniciando inicialización segura...');
            
            // Paso 1: Verificar DOM
            await this.waitForDOM();
            this.updateStatus('🔄 DOM listo...');
            
            // Paso 2: Cargar datos básicos
            this.loadBasicData();
            this.updateStatus('🔄 Datos básicos cargados...');
            
            // Paso 3: Configurar eventos (con timeout)
            setTimeout(() => this.setupEvents(), 100);
            this.updateStatus('🔄 Configurando eventos...');
            
            // Paso 4: Inicializar interfaces
            setTimeout(() => this.initInterfaces(), 200);
            this.updateStatus('🔄 Interfaces listas...');
            
            // Paso 5: Finalizar
            setTimeout(() => this.finishInit(), 500);
            
        } catch (error) {
            this.log('❌ Error en inicialización:', error);
            this.handleInitError(error);
        }
    }

    async waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
            }
        });
    }

    loadBasicData() {
        this.log('📊 Cargando datos básicos...');
        
        // Datos de estudiantes simplificados
        this.estudiantes = {
            'Preescolar': [
                { codigo: 'PRE001', nombre: 'Ana Pérez' },
                { codigo: 'PRE002', nombre: 'Carlos López' }
            ],
            '1°': [
                { codigo: '1A001', nombre: 'Isabella Moreno' },
                { codigo: '1A002', nombre: 'Sebastián Castro' }
            ],
            '5°': [
                { codigo: '5A001', nombre: 'Gabriela Molina' },
                { codigo: '5A002', nombre: 'Maximiliano Contreras' }
            ],
            '11°': [
                { codigo: '11A001', nombre: 'Fernanda Morales' },
                { codigo: '11A002', nombre: 'Álvaro Saavedra' }
            ]
        };

        // Usuarios de prueba
        this.usuarios = {
            admin: { usuario: 'admin', password: 'admin123', nombre: 'Administrador', tipo: 'admin' },
            coord1: { usuario: 'coord1', password: 'coord123', nombre: 'María González', tipo: 'coordinador' },
            doc1: { usuario: 'doc1', password: 'doc123', nombre: 'Carlos Ramírez', tipo: 'docente' }
        };

        // Cargar datos del localStorage
        this.solicitudes = this.loadFromStorage('solicitudes') || [];
        this.radicadoCounter = this.loadFromStorage('radicadoCounter') || 1000;
        
        this.log('✅ Datos básicos cargados');
    }

    setupEvents() {
        try {
            this.log('🔗 Configurando eventos...');

            // Navegación principal
            this.addEvent('inicioBtn', 'click', () => this.showView('homeView'));
            this.addEvent('consultarBtn', 'click', () => this.showView('consultarView'));
            this.addEvent('loginBtn', 'click', () => this.toggleLogin());

            // Solicitudes
            this.addEvent('excusaCard', 'click', () => this.iniciarExcusa());
            this.addEvent('permisoCard', 'click', () => this.iniciarPermiso());

            // Botones de volver
            this.addEvent('backToHome', 'click', () => this.showView('homeView'));
            this.addEvent('backToHomePermiso', 'click', () => this.showView('homeView'));

            // Formularios
            this.addEvent('loginForm', 'submit', (e) => this.handleLogin(e));
            this.addEvent('excusaForm', 'submit', (e) => this.handleExcusaSubmit(e));
            this.addEvent('permisoForm', 'submit', (e) => this.handlePermisoSubmit(e));

            // Steppers
            this.addEvent('nextStepBtn', 'click', () => this.nextStep('excusa'));
            this.addEvent('prevStepBtn', 'click', () => this.prevStep('excusa'));
            this.addEvent('nextStepBtnPermiso', 'click', () => this.nextStep('permiso'));
            this.addEvent('prevStepBtnPermiso', 'click', () => this.prevStep('permiso'));

            // Cambios en selects
            this.addEvent('gradoExcusa', 'change', (e) => this.loadStudents(e.target.value, 'estudianteExcusa'));
            this.addEvent('gradoPermiso', 'change', (e) => this.loadStudents(e.target.value, 'estudiantePermiso'));

            // Modales
            this.addEvent('cerrarModalRadicado', 'click', () => this.closeModal('modalRadicado'));

            // Consulta
            this.addEvent('buscarBtn', 'click', () => this.consultarRadicado());

            this.log('✅ Eventos configurados');
        } catch (error) {
            this.log('❌ Error configurando eventos:', error);
        }
    }

    addEvent(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            this.log(`⚠️ Elemento no encontrado: ${elementId}`);
        }
    }

    initInterfaces() {
        try {
            this.log('🎨 Inicializando interfaces...');

            // Configurar fechas mínimas
            const today = new Date().toISOString().split('T')[0];
            const fechaInputs = ['fechaExcusa', 'fechaPermiso'];
            fechaInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.min = today;
                    input.value = today;
                }
            });

            // Resetear steppers
            this.resetStepper('excusa');
            this.resetStepper('permiso');

            this.log('✅ Interfaces inicializadas');
        } catch (error) {
            this.log('❌ Error en interfaces:', error);
        }
    }

    finishInit() {
        try {
            this.log('🎉 Finalizando inicialización...');
            
            this.updateStatus('🟢 Sistema listo');
            this.showView('homeView');
            
            this.log('✅ ¡Sistema inicializado exitosamente!');
        } catch (error) {
            this.log('❌ Error finalizando:', error);
            this.updateStatus('🔴 Error de inicialización');
        }
    }

    handleInitError(error) {
        this.log('🚨 Manejando error de inicialización:', error);
        this.updateStatus('🔴 Error - Modo seguro activado');
        
        // Modo seguro básico
        setTimeout(() => {
            this.updateStatus('🟡 Modo seguro - Funcionalidad limitada');
            this.showView('homeView');
        }, 1000);
    }

    // ========== MÉTODOS DE UTILIDAD ==========
    log(message, ...args) {
        if (window.SISTEMA_CONFIG?.debug) {
            console.log(`[Sistema] ${message}`, ...args);
        }
    }

    updateStatus(message) {
        const statusEl = document.getElementById('statusText');
        if (statusEl) {
            statusEl.textContent = message;
        }
        this.log(`Status: ${message}`);
    }

    showView(viewId) {
        this.log(`📱 Cambiando a vista: ${viewId}`);
        
        try {
            // Ocultar todas las vistas
            document.querySelectorAll('.view').forEach(view => {
                view.classList.remove('active');
            });

            // Mostrar vista objetivo
            const targetView = document.getElementById(viewId);
            if (targetView) {
                targetView.classList.add('active');
                this.currentView = viewId;
            } else {
                this.log(`❌ Vista no encontrada: ${viewId}`);
            }

            // Actualizar navegación
            this.updateNavigation(viewId);
        } catch (error) {
            this.log('❌ Error cambiando vista:', error);
        }
    }

    updateNavigation(activeView) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const viewMap = {
            'homeView': 'inicioBtn',
            'consultarView': 'consultarBtn',
            'loginView': 'loginBtn'
        };

        const activeBtn = viewMap[activeView];
        if (activeBtn) {
            const btn = document.getElementById(activeBtn);
            if (btn) btn.classList.add('active');
        }
    }

    // ========== GESTIÓN DE EXCUSAS Y PERMISOS ==========
    iniciarExcusa() {
        this.log('📝 Iniciando excusa...');
        this.showView('excusaView');
        this.resetStepper('excusa');
    }

    iniciarPermiso() {
        this.log('🕐 Iniciando permiso...');
        this.showView('permisoView');
        this.resetStepper('permiso');
    }

    resetStepper(tipo) {
        if (tipo === 'excusa') {
            this.currentStepExcusa = 1;
            this.showStep('excusa', 1);
        } else {
            this.currentStepPermiso = 1;
            this.showStep('permiso', 1);
        }
    }

    showStep(tipo, step) {
        const formId = tipo === 'excusa' ? 'excusaForm' : 'permisoForm';
        const container = document.getElementById(formId)?.closest('.stepper-container');
        if (!container) return;

        // Mostrar panel activo
        container.querySelectorAll('.step-panel').forEach(panel => {
            panel.classList.toggle('active', parseInt(panel.dataset.step) === step);
        });

        // Actualizar indicadores
        const currentStepId = tipo === 'excusa' ? 'currentStepText' : 'currentStepTextPermiso';
        const currentStepEl = document.getElementById(currentStepId);
        if (currentStepEl) {
            currentStepEl.textContent = `Paso ${step} de 4`;
        }

        // Mostrar/ocultar botones
        this.updateStepButtons(tipo, step);
    }

    updateStepButtons(tipo, step) {
        const prevId = tipo === 'excusa' ? 'prevStepBtn' : 'prevStepBtnPermiso';
        const nextId = tipo === 'excusa' ? 'nextStepBtn' : 'nextStepBtnPermiso';
        const submitId = tipo === 'excusa' ? 'submitFormBtn' : 'submitFormBtnPermiso';

        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);
        const submitBtn = document.getElementById(submitId);

        if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
        if (nextBtn) nextBtn.style.display = step === 4 ? 'none' : 'inline-block';
        if (submitBtn) submitBtn.style.display = step === 4 ? 'inline-block' : 'none';
    }

    nextStep(tipo) {
        const currentStep = tipo === 'excusa' ? this.currentStepExcusa : this.currentStepPermiso;
        
        if (currentStep < 4) {
            if (tipo === 'excusa') {
                this.currentStepExcusa++;
                this.showStep('excusa', this.currentStepExcusa);
            } else {
                this.currentStepPermiso++;
                this.showStep('permiso', this.currentStepPermiso);
            }
        }
    }

    prevStep(tipo) {
        const currentStep = tipo === 'excusa' ? this.currentStepExcusa : this.currentStepPermiso;
        
        if (currentStep > 1) {
            if (tipo === 'excusa') {
                this.currentStepExcusa--;
                this.showStep('excusa', this.currentStepExcusa);
            } else {
                this.currentStepPermiso--;
                this.showStep('permiso', this.currentStepPermiso);
            }
        }
    }

    // ========== GESTIÓN DE ESTUDIANTES ==========
    loadStudents(grado, selectId) {
        const select = document.getElementById(selectId);
        if (!select || !grado) return;

        select.innerHTML = '<option value="">Seleccionar estudiante...</option>';
        
        const estudiantes = this.estudiantes[grado] || [];
        estudiantes.forEach(estudiante => {
            const option = document.createElement('option');
            option.value = estudiante.nombre;
            option.textContent = `${estudiante.nombre} (${estudiante.codigo})`;
            select.appendChild(option);
        });

        select.disabled = estudiantes.length === 0;
    }

    // ========== AUTENTICACIÓN ==========
    toggleLogin() {
        if (this.currentUser) {
            this.logout();
        } else {
            this.showView('loginView');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value.trim();
        const tipo = document.getElementById('tipoUsuario').value;

        this.log('🔐 Intento de login:', { usuario, tipo });

        // Verificar credenciales
        const user = Object.values(this.usuarios).find(u => 
            u.usuario === usuario && u.password === password && u.tipo === tipo
        );

        if (user) {
            this.currentUser = user;
            this.updateStatus(`🟢 Bienvenido ${user.nombre}`);
            this.updateAuthUI();
            
            // Redirigir según tipo
            const viewMap = {
                'admin': 'homeView',
                'coordinador': 'homeView',
                'docente': 'homeView'
            };
            this.showView(viewMap[tipo] || 'homeView');
            
            // Limpiar formulario
            document.getElementById('loginForm').reset();
        } else {
            this.showError('Usuario, contraseña o tipo incorrectos');
        }
    }

    logout() {
        this.currentUser = null;
        this.updateAuthUI();
        this.updateStatus('🟢 Sistema listo');
        this.showView('homeView');
    }

    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            if (this.currentUser) {
                loginBtn.textContent = `${this.currentUser.nombre}`;
                loginBtn.style.background = '#10b981';
            } else {
                loginBtn.textContent = 'Login';
                loginBtn.style.background = '';
            }
        }
    }

    // ========== ENVÍO DE FORMULARIOS ==========
    handleExcusaSubmit(e) {
        e.preventDefault();
        this.log('📤 Enviando excusa...');

        try {
            const formData = this.getFormData('excusa');
            const radicado = this.generateRadicado();
            
            const solicitud = {
                id: Date.now(),
                radicado: radicado,
                tipo: 'excusa',
                fecha: new Date().toISOString(),
                estado: 'pendiente',
                ...formData
            };

            this.solicitudes.push(solicitud);
            this.saveToStorage('solicitudes', this.solicitudes);

            this.showRadicado(radicado);
            this.clearForm('excusaForm');
            this.updateStatus('🟢 Excusa enviada exitosamente');
        } catch (error) {
            this.log('❌ Error enviando excusa:', error);
            this.showError('Error al enviar la excusa');
        }
    }

    handlePermisoSubmit(e) {
        e.preventDefault();
        this.log('📤 Enviando permiso...');

        try {
            const formData = this.getFormData('permiso');
            const radicado = this.generateRadicado();
            
            const solicitud = {
                id: Date.now(),
                radicado: radicado,
                tipo: 'permiso',
                fecha: new Date().toISOString(),
                estado: 'pendiente',
                ...formData
            };

            this.solicitudes.push(solicitud);
            this.saveToStorage('solicitudes', this.solicitudes);

            this.showRadicado(radicado);
            this.clearForm('permisoForm');
            this.updateStatus('🟢 Permiso enviado exitosamente');
        } catch (error) {
            this.log('❌ Error enviando permiso:', error);
            this.showError('Error al enviar el permiso');
        }
    }

    getFormData(tipo) {
        if (tipo === 'excusa') {
            return {
                nombreAcudiente: document.getElementById('nombreAcudiente')?.value || '',
                emailAcudiente: document.getElementById('emailAcudiente')?.value || '',
                telefonoAcudiente: document.getElementById('telefonoAcudiente')?.value || '',
                grado: document.getElementById('gradoExcusa')?.value || '',
                estudiante: document.getElementById('estudianteExcusa')?.value || '',
                fechaExcusa: document.getElementById('fechaExcusa')?.value || '',
                motivo: document.getElementById('motivoInasistencia')?.value || ''
            };
        } else {
            return {
                nombreAcudiente: document.getElementById('nombreAcudientePermiso')?.value || '',
                emailAcudiente: document.getElementById('emailAcudientePermiso')?.value || '',
                telefonoAcudiente: document.getElementById('telefonoAcudientePermiso')?.value || '',
                grado: document.getElementById('gradoPermiso')?.value || '',
                estudiante: document.getElementById('estudiantePermiso')?.value || '',
                fechaPermiso: document.getElementById('fechaPermiso')?.value || '',
                motivo: document.getElementById('motivoPermiso')?.value || ''
            };
        }
    }

    generateRadicado() {
        this.radicadoCounter++;
        this.saveToStorage('radicadoCounter', this.radicadoCounter);
        return `RAD-${this.radicadoCounter}`;
    }

    // ========== CONSULTA DE RADICADO ==========
    consultarRadicado() {
        const numeroRadicado = document.getElementById('numeroRadicado')?.value?.trim();
        if (!numeroRadicado) {
            this.showError('Ingrese un número de radicado');
            return;
        }

        const solicitud = this.solicitudes.find(s => s.radicado === numeroRadicado);
        const resultadoDiv = document.getElementById('resultadoConsulta');
        
        if (solicitud && resultadoDiv) {
            resultadoDiv.innerHTML = this.generateConsultaHTML(solicitud);
            resultadoDiv.style.display = 'block';
        } else if (resultadoDiv) {
            resultadoDiv.innerHTML = `
                <div class="no-encontrado">
                    <h3>No se encontró la solicitud</h3>
                    <p>El radicado ${numeroRadicado} no existe en nuestros registros.</p>
                </div>
            `;
            resultadoDiv.style.display = 'block';
        }
    }

    generateConsultaHTML(solicitud) {
        return `
            <div class="solicitud-detalle">
                <h3>Solicitud de ${solicitud.tipo}</h3>
                <p><strong>Radicado:</strong> ${solicitud.radicado}</p>
                <p><strong>Fecha:</strong> ${new Date(solicitud.fecha).toLocaleDateString()}</p>
                <p><strong>Estado:</strong> ${solicitud.estado}</p>
                <p><strong>Acudiente:</strong> ${solicitud.nombreAcudiente}</p>
                <p><strong>Estudiante:</strong> ${solicitud.estudiante}</p>
                <p><strong>Grado:</strong> ${solicitud.grado}</p>
                <p><strong>Motivo:</strong> ${solicitud.motivo}</p>
            </div>
        `;
    }

    // ========== MODALES ==========
    showRadicado(radicado) {
        const modal = document.getElementById('modalRadicado');
        const radicadoEl = document.getElementById('numeroRadicadoGenerado');
        
        if (modal && radicadoEl) {
            radicadoEl.textContent = radicado;
            modal.style.display = 'flex';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            this.showView('homeView');
        }
    }

    // ========== UTILIDADES ==========
    showError(message) {
        this.log('❌ Error:', message);
        alert(message); // Temporal, se puede mejorar con modal
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            this.log('⚠️ Error guardando en localStorage:', error);
        }
    }

    loadFromStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            this.log('⚠️ Error cargando de localStorage:', error);
            return null;
        }
    }
}

// ========== INICIALIZACIÓN AUTOMÁTICA ==========
console.log('⏳ Esperando DOM...');

function initSistema() {
    try {
        console.log('🎯 Inicializando sistema...');
        window.sistema = new SistemaExcusasSimple();
        console.log('✅ Sistema creado exitosamente');
    } catch (error) {
        console.error('❌ Error crítico al crear sistema:', error);
        
        // Fallback de emergencia
        document.getElementById('statusText').textContent = '🔴 Error crítico';
    }
}

// Inicializar cuando DOM esté listo
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initSistema, 100);
} else {
    document.addEventListener('DOMContentLoaded', initSistema);
}

// Timeout de seguridad
setTimeout(() => {
    if (!window.sistema) {
        console.warn('⚠️ Sistema no inicializado, intentando recuperación...');
        initSistema();
    }
}, 3000);

console.log('📋 Script de sistema simplificado cargado');
