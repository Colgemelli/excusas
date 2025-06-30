// Sistema de Excusas y Permisos - Colegio Gemelli Franciscanos
// app.js - Lógica Principal con Supabase

// Configuración de Supabase
const SUPABASE_CONFIG = {
    url: 'TU_SUPABASE_URL', // Reemplazar con tu URL de Supabase
    key: 'TU_SUPABASE_ANON_KEY', // Reemplazar con tu clave anónima
    useLocal: true // Cambiar a false cuando tengas Supabase configurado
};

class SistemaExcusas {
    constructor() {
        this.currentView = 'homeView';
        this.currentUser = null;
        this.tipoSolicitud = null;
        this.solicitudes = [];
        this.radicadoCounter = 1000;
        this.supabase = null;
        
        this.init();
    }

    async init() {
        await this.initSupabase();
        this.setupEventListeners();
        this.initSteppers();
        this.initDateValidation();
        this.initStudentDatabase();
        await this.checkAuthStatus();
        this.updateStatus('🟢 Sistema listo');
        this.showView('homeView');
    }

    // Inicializar steppers
    initSteppers() {
        this.currentStepExcusa = 1;
        this.currentStepPermiso = 1;
        this.maxSteps = 4;
    }

    // Inicializar validación de fechas
    initDateValidation() {
        const today = new Date().toISOString().split('T')[0];
        
        // Establecer fecha mínima para todos los campos de fecha
        const fechaInputs = ['fechaExcusa', 'fechaPermiso'];
        fechaInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.min = today;
                input.value = today;
            }
        });
    }

    // Base de datos de estudiantes por grado
    initStudentDatabase() {
        this.estudiantesPorGrado = {
            'Preescolar': [
                { codigo: 'PRE001', nombre: 'Ana Sofía Pérez', apellidos: 'Pérez García' },
                { codigo: 'PRE002', nombre: 'Carlos Andrés', apellidos: 'López Martínez' },
                { codigo: 'PRE003', nombre: 'María José', apellidos: 'Rodríguez Silva' },
                { codigo: 'PRE004', nombre: 'Diego Alejandro', apellidos: 'Gómez Torres' },
                { codigo: 'PRE005', nombre: 'Valentina', apellidos: 'Hernández López' }
            ],
            '1°': [
                { codigo: '1A001', nombre: 'Isabella', apellidos: 'Moreno Ruiz' },
                { codigo: '1A002', nombre: 'Sebastián', apellidos: 'Castro Díaz' },
                { codigo: '1A003', nombre: 'Camila Andrea', apellidos: 'Vargas Peña' },
                { codigo: '1A004', nombre: 'Juan Pablo', apellidos: 'Jiménez Cruz' },
                { codigo: '1A005', nombre: 'Sophia', apellidos: 'Mendoza Reyes' }
            ],
            '2°': [
                { codigo: '2A001', nombre: 'Mateo', apellidos: 'Fernández Soto' },
                { codigo: '2A002', nombre: 'Lucía', apellidos: 'Ramírez Vega' },
                { codigo: '2A003', nombre: 'Nicolás', apellidos: 'Torres Aguilar' },
                { codigo: '2A004', nombre: 'Emma', apellidos: 'Salazar Ortiz' },
                { codigo: '2A005', nombre: 'Santiago', apellidos: 'Guerrero Luna' }
            ],
            '3°': [
                { codigo: '3A001', nombre: 'Valeria', apellidos: 'Ruiz Morales' },
                { codigo: '3A002', nombre: 'Daniel', apellidos: 'Cortés Rojas' },
                { codigo: '3A003', nombre: 'Martina', apellidos: 'Delgado Herrera' },
                { codigo: '3A004', nombre: 'Alejandro', apellidos: 'Medina Castro' },
                { codigo: '3A005', nombre: 'Zoe', apellidos: 'Paredes Silva' }
            ],
            '4°': [
                { codigo: '4A001', nombre: 'Samuel', apellidos: 'Vásquez Torres' },
                { codigo: '4A002', nombre: 'Antonella', apellidos: 'Ramos Figueroa' },
                { codigo: '4A003', nombre: 'Emilio', apellidos: 'Sandoval Peña' },
                { codigo: '4A004', nombre: 'Renata', apellidos: 'Espinoza Morales' },
                { codigo: '4A005', nombre: 'Joaquín', apellidos: 'Cabrera León' }
            ],
            '5°': [
                { codigo: '5A001', nombre: 'Gabriela', apellidos: 'Molina Vargas' },
                { codigo: '5A002', nombre: 'Maximiliano', apellidos: 'Contreras Ruiz' },
                { codigo: '5A003', nombre: 'Regina', apellidos: 'Campos Sánchez' },
                { codigo: '5A004', nombre: 'Benjamín', apellidos: 'Acosta Ramírez' },
                { codigo: '5A005', nombre: 'Violeta', apellidos: 'Navarro Cruz' }
            ],
            '6°': [
                { codigo: '6A001', nombre: 'Adrián', apellidos: 'Peña Gutiérrez' },
                { codigo: '6A002', nombre: 'Juliana', apellidos: 'Ríos Mendoza' },
                { codigo: '6A003', nombre: 'Leonardo', apellidos: 'Serrano López' },
                { codigo: '6A004', nombre: 'Mariana', apellidos: 'Aguilera Torres' },
                { codigo: '6A005', nombre: 'Rodrigo', apellidos: 'Lozano Díaz' }
            ],
            '7°': [
                { codigo: '7A001', nombre: 'Ariadna', apellidos: 'Becerra Silva' },
                { codigo: '7A002', nombre: 'Emiliano', apellidos: 'Vega Morales' },
                { codigo: '7A003', nombre: 'Paloma', apellidos: 'Cordero Ruiz' },
                { codigo: '7A004', nombre: 'Tomás', apellidos: 'Herrera Castro' },
                { codigo: '7A005', nombre: 'Constanza', apellidos: 'Ibarra Vásquez' }
            ],
            '8°': [
                { codigo: '8A001', nombre: 'Gonzalo', apellidos: 'Moya Fernández' },
                { codigo: '8A002', nombre: 'Esperanza', apellidos: 'Ulloa Jiménez' },
                { codigo: '8A003', nombre: 'Patricio', apellidos: 'Maldonado Rojas' },
                { codigo: '8A004', nombre: 'Francisca', apellidos: 'Valdés Moreno' },
                { codigo: '8A005', nombre: 'Ignacio', apellidos: 'Ponce Guerrero' }
            ],
            '9°': [
                { codigo: '9A001', nombre: 'Catalina', apellidos: 'Fuentes Delgado' },
                { codigo: '9A002', nombre: 'Andrés', apellidos: 'Carrasco Herrera' },
                { codigo: '9A003', nombre: 'Isadora', apellidos: 'Tapia Medina' },
                { codigo: '9A004', nombre: 'Felipe', apellidos: 'Montoya Paredes' },
                { codigo: '9A005', nombre: 'Almudena', apellidos: 'Figueroa Sandoval' }
            ],
            '10°': [
                { codigo: '10A001', nombre: 'Ricardo', apellidos: 'Espejo Ramos' },
                { codigo: '10A002', nombre: 'Macarena', apellidos: 'Solís Cabrera' },
                { codigo: '10A003', nombre: 'Esteban', apellidos: 'Pereira Molina' },
                { codigo: '10A004', nombre: 'Javiera', apellidos: 'Cáceres Contreras' },
                { codigo: '10A005', nombre: 'Cristóbal', apellidos: 'Henríquez Campos' }
            ],
            '11°': [
                { codigo: '11A001', nombre: 'Fernanda', apellidos: 'Morales Acosta' },
                { codigo: '11A002', nombre: 'Álvaro', apellidos: 'Saavedra Navarro' },
                { codigo: '11A003', nombre: 'Antonia', apellidos: 'Restrepo Peña' },
                { codigo: '11A004', nombre: 'Matías', apellidos: 'Quintero Ríos' },
                { codigo: '11A005', nombre: 'Sofía', apellidos: 'Cardenas Serrano' }
            ]
        };
    }

    // Cargar estudiantes por grado
    loadStudentsByGrade(grado, selectId, infoContainerId) {
        const select = document.getElementById(selectId);
        const infoContainer = document.getElementById(infoContainerId);
        
        if (!select || !this.estudiantesPorGrado[grado]) {
            return;
        }
        
        // Limpiar opciones anteriores
        select.innerHTML = '<option value="">Seleccionar estudiante...</option>';
        
        // Agregar estudiantes del grado seleccionado
        this.estudiantesPorGrado[grado].forEach(estudiante => {
            const option = document.createElement('option');
            option.value = JSON.stringify(estudiante);
            option.textContent = `${estudiante.nombre} ${estudiante.apellidos}`;
            select.appendChild(option);
        });
        
        // Habilitar el select
        select.disabled = false;
        
        // Ocultar info del estudiante
        if (infoContainer) {
            infoContainer.style.display = 'none';
        }
    }

    // Mostrar información del estudiante seleccionado
    showStudentInfo(estudianteData, infoContainerId, grado) {
        const infoContainer = document.getElementById(infoContainerId);
        
        if (!infoContainer || !estudianteData) {
            return;
        }
        
        const estudiante = JSON.parse(estudianteData);
        
        // Actualizar información
        const prefix = infoContainerId.includes('Permiso') ? 'Permiso' : '';
        document.getElementById(`infoNombre${prefix}`).textContent = `${estudiante.nombre} ${estudiante.apellidos}`;
        document.getElementById(`infoGrado${prefix}`).textContent = grado;
        document.getElementById(`infoCodigo${prefix}`).textContent = estudiante.codigo;
        
        // Mostrar contenedor
        infoContainer.style.display = 'block';
    }

    // Inicializar Supabase
    async initSupabase() {
        if (!SUPABASE_CONFIG.useLocal && typeof createClient !== 'undefined') {
            try {
                this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
                console.log('Supabase inicializado correctamente');
            } catch (error) {
                console.warn('Error al inicializar Supabase, usando almacenamiento local:', error);
                SUPABASE_CONFIG.useLocal = true;
            }
        }
        
        if (SUPABASE_CONFIG.useLocal) {
            console.log('Usando almacenamiento local para desarrollo');
            await this.loadLocalData();
        }
    }

    // Cargar datos locales para desarrollo
    async loadLocalData() {
        this.solicitudes = this.loadFromStorage('solicitudes') || [];
        this.radicadoCounter = this.loadFromStorage('radicadoCounter') || 1000;
        
        // Usuarios predefinidos para desarrollo local
        this.usuariosLocal = {
            coordinadores: [
                { id: 'coord1', usuario: 'coord1', password: 'coord123', nombre: 'María González', tipo: 'coordinador', email: 'maria.gonzalez@gemelli.edu.co' },
                { id: 'directora', usuario: 'directora', password: 'dir123', nombre: 'Ana Patricia López', tipo: 'coordinador', email: 'ana.lopez@gemelli.edu.co' }
            ],
            docentes: [
                { id: 'doc1', usuario: 'doc1', password: 'doc123', nombre: 'Carlos Ramírez', grado: '5°', tipo: 'docente', email: 'carlos.ramirez@gemelli.edu.co' },
                { id: 'doc2', usuario: 'doc2', password: 'doc123', nombre: 'Laura Martínez', grado: '8°', tipo: 'docente', email: 'laura.martinez@gemelli.edu.co' },
                { id: 'doc3', usuario: 'doc3', password: 'doc123', nombre: 'Pedro Silva', grado: '11°', tipo: 'docente', email: 'pedro.silva@gemelli.edu.co' }
            ],
            admin: [
                { id: 'admin', usuario: 'admin', password: 'admin123', nombre: 'Administrador Sistema', tipo: 'admin', email: 'admin@gemelli.edu.co' }
            ]
        };
    }

    // Verificar estado de autenticación
    async checkAuthStatus() {
        if (SUPABASE_CONFIG.useLocal) {
            const savedUser = this.loadFromStorage('currentUser');
            if (savedUser) {
                this.currentUser = savedUser;
                this.updateAuthUI();
            }
        } else if (this.supabase) {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.currentUser = await this.getUserProfile(session.user.id);
                this.updateAuthUI();
            }
        }
    }

    // Gestión de permisos
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const permissions = {
            'coordinador': ['aprobar_solicitudes', 'rechazar_solicitudes', 'ver_dashboard', 'ver_todas_solicitudes'],
            'docente': ['validar_solicitudes', 'asignar_trabajos', 'ver_estudiantes', 'ver_solicitudes_grado'],
            'admin': ['ver_estadisticas', 'gestionar_usuarios', 'acceso_completo', 'ver_todas_solicitudes']
        };
        
        const userPermissions = permissions[this.currentUser.tipo] || [];
        return userPermissions.includes(permission);
    }

    canViewSolicitud(solicitud) {
        if (!this.currentUser) return false;
        
        // Admins y coordinadores ven todo
        if (this.hasPermission('ver_todas_solicitudes')) return true;
        
        // Docentes solo ven solicitudes de su grado
        if (this.currentUser.tipo === 'docente') {
            return solicitud.grado === this.currentUser.grado;
        }
        
        return false;
    }

    // Actualizar UI basada en autenticación
    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const docentesBtn = document.getElementById('docentesBtn');
        
        if (this.currentUser) {
            loginBtn.textContent = `${this.currentUser.nombre} (${this.currentUser.tipo})`;
            loginBtn.style.background = '#10b981';
            
            // Mostrar botón de acceso directo para docentes
            if (this.currentUser.tipo === 'docente') {
                docentesBtn.style.display = 'block';
            }
        } else {
            loginBtn.textContent = 'Login';
            loginBtn.style.background = '';
            docentesBtn.style.display = 'none';
        }
    }

    // Obtener perfil de usuario desde Supabase
    async getUserProfile(userId) {
        if (SUPABASE_CONFIG.useLocal) return null;
        
        try {
            const { data, error } = await this.supabase
                .from('vista_usuarios_completa')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            return null;
        }
    }

    // CRUD Operations para Solicitudes
    async createSolicitud(solicitudData) {
        if (SUPABASE_CONFIG.useLocal) {
            return this.createSolicitudLocal(solicitudData);
        }
        
        try {
            const { data, error } = await this.supabase
                .from('solicitudes')
                .insert([{
                    radicado: this.generateRadicado(),
                    tipo_solicitud_id: solicitudData.tipo === 'excusa' ? 1 : 2,
                    nombre_estudiante: solicitudData.nombreEstudiante,
                    grado_id: await this.getGradoId(solicitudData.grado),
                    motivo: solicitudData.motivoInasistencia || solicitudData.motivoPermiso,
                    datos_formulario: solicitudData,
                    nombre_padre_acudiente: solicitudData.firmaPadre,
                    tiene_certificado_medico: solicitudData.certificadoMedico || false,
                    tiene_incapacidad: solicitudData.incapacidad || false
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error al crear solicitud:', error);
            throw error;
        }
    }

    createSolicitudLocal(solicitudData) {
        const radicado = this.generateRadicado();
        const solicitud = {
            id: Date.now(),
            radicado: radicado,
            tipo: solicitudData.tipo || (solicitudData.motivoInasistencia ? 'excusa' : 'permiso'),
            fecha: new Date().toISOString(),
            estado: 'pendiente',
            ...solicitudData
        };

        this.solicitudes.push(solicitud);
        this.saveToStorage('solicitudes', this.solicitudes);
        this.saveToStorage('radicadoCounter', this.radicadoCounter);
        
        return solicitud;
    }

    async getSolicitudes(filtros = {}) {
        if (SUPABASE_CONFIG.useLocal) {
            return this.getSolicitudesLocal(filtros);
        }
        
        try {
            let query = this.supabase.from('vista_solicitudes_completas').select('*');
            
            // Aplicar filtros de permisos
            if (this.currentUser && this.currentUser.tipo === 'docente') {
                query = query.eq('grado', this.currentUser.grado);
            }
            
            // Aplicar filtros adicionales
            if (filtros.estado) {
                query = query.eq('estado_actual', filtros.estado);
            }
            
            if (filtros.tipo) {
                query = query.eq('tipo_solicitud', filtros.tipo);
            }
            
            const { data, error } = await query.order('fecha_solicitud', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener solicitudes:', error);
            return [];
        }
    }

    getSolicitudesLocal(filtros = {}) {
        let solicitudes = [...this.solicitudes];
        
        // Aplicar filtros de permisos
        if (this.currentUser && this.currentUser.tipo === 'docente') {
            solicitudes = solicitudes.filter(s => s.grado === this.currentUser.grado);
        }
        
        // Aplicar filtros adicionales
        if (filtros.estado) {
            solicitudes = solicitudes.filter(s => s.estado === filtros.estado);
        }
        
        if (filtros.tipo) {
            solicitudes = solicitudes.filter(s => s.tipo === filtros.tipo);
        }
        
        return solicitudes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    async updateSolicitudEstado(solicitudId, nuevoEstado, observaciones = '') {
        if (SUPABASE_CONFIG.useLocal) {
            return this.updateSolicitudEstadoLocal(solicitudId, nuevoEstado, observaciones);
        }
        
        try {
            const updateData = {
                estado_actual_id: this.getEstadoId(nuevoEstado),
                observaciones: observaciones,
                updated_at: new Date().toISOString()
            };
            
            // Agregar campos específicos según el estado
            if (nuevoEstado === 'aprobado') {
                updateData.fecha_aprobacion = new Date().toISOString();
                updateData.aprobado_por_id = this.currentUser.id;
            } else if (nuevoEstado === 'rechazado') {
                updateData.fecha_rechazo = new Date().toISOString();
                updateData.rechazado_por_id = this.currentUser.id;
            } else if (nuevoEstado === 'validado') {
                updateData.fecha_validacion = new Date().toISOString();
                updateData.validado_por_id = this.currentUser.id;
            }
            
            const { data, error } = await this.supabase
                .from('solicitudes')
                .update(updateData)
                .eq('id', solicitudId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error al actualizar solicitud:', error);
            throw error;
        }
    }

    updateSolicitudEstadoLocal(solicitudId, nuevoEstado, observaciones = '') {
        const solicitud = this.solicitudes.find(s => s.id === solicitudId);
        if (solicitud) {
            solicitud.estado = nuevoEstado;
            solicitud.observaciones = observaciones;
            
            if (nuevoEstado === 'aprobado') {
                solicitud.fechaAprobacion = new Date().toISOString();
                solicitud.aprobadoPor = this.currentUser.nombre;
            } else if (nuevoEstado === 'rechazado') {
                solicitud.fechaRechazo = new Date().toISOString();
                solicitud.rechazadoPor = this.currentUser.nombre;
            } else if (nuevoEstado === 'validado') {
                solicitud.fechaValidacion = new Date().toISOString();
                solicitud.validadoPor = this.currentUser.nombre;
            }
            
            this.saveToStorage('solicitudes', this.solicitudes);
            return solicitud;
        }
        return null;
    }

    // Utilidades
    async getGradoId(nombreGrado) {
        if (SUPABASE_CONFIG.useLocal) {
            const grados = ['Preescolar', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°'];
            return grados.indexOf(nombreGrado) + 1;
        }
        
        const { data } = await this.supabase
            .from('grados')
            .select('id')
            .eq('nombre', nombreGrado)
            .single();
        
        return data?.id || 1;
    }

    getEstadoId(nombreEstado) {
        const estados = { 'pendiente': 1, 'aprobado': 2, 'rechazado': 3, 'validado': 4 };
        return estados[nombreEstado] || 1;
    }
    setupEventListeners() {
        // Navegación principal
        document.getElementById('inicioBtn').addEventListener('click', () => this.showView('homeView'));
        document.getElementById('consultarBtn').addEventListener('click', () => this.showView('consultarView'));
        document.getElementById('docentesBtn').addEventListener('click', () => this.showView('docenteView'));
        document.getElementById('loginBtn').addEventListener('click', () => this.showView('loginView'));

        // Botones de solicitud
        document.getElementById('excusaCard').addEventListener('click', () => this.iniciarSolicitud('excusa'));
        document.getElementById('permisoCard').addEventListener('click', () => this.iniciarSolicitud('permiso'));

        // Botones de volver
        document.getElementById('backToHome').addEventListener('click', () => this.showView('homeView'));
        document.getElementById('backToHomePermiso').addEventListener('click', () => this.showView('homeView'));

        // Formularios
        document.getElementById('excusaForm').addEventListener('submit', (e) => this.handleExcusaSubmit(e));
        document.getElementById('permisoForm').addEventListener('submit', (e) => this.handlePermisoSubmit(e));
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Checkboxes para mostrar upload
        document.getElementById('certificadoMedico').addEventListener('change', this.toggleFileUpload);
        document.getElementById('incapacidad').addEventListener('change', this.toggleFileUpload);

        // Consulta de radicado
        document.getElementById('buscarBtn').addEventListener('click', () => this.consultarRadicado());
        document.getElementById('numeroRadicado').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.consultarRadicado();
        });

        // Modal protección de datos
        document.getElementById('aceptoProteccion').addEventListener('change', this.toggleProteccionButton);
        document.getElementById('cancelarProteccion').addEventListener('click', this.cerrarModalProteccion);
        document.getElementById('aceptarProteccion').addEventListener('click', this.aceptarProteccion);

        // Modal radicado
        document.getElementById('cerrarModalRadicado').addEventListener('click', this.cerrarModalRadicado);

        // Logout buttons
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('logoutDocenteBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('logoutAdminBtn')?.addEventListener('click', () => this.logout());

        // Modal confirmación
        document.getElementById('cancelarAccion').addEventListener('click', this.cerrarModalConfirmacion);
        document.getElementById('confirmarAccion').addEventListener('click', this.ejecutarAccionConfirmacion);
    }

    // Navegación entre vistas
    showView(viewId) {
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Mostrar vista seleccionada
        document.getElementById(viewId).classList.add('active');
        this.currentView = viewId;

        // Actualizar navegación
        this.updateNavigation(viewId);

        // Cargar datos específicos de la vista
        if (viewId === 'coordinadorView') this.loadCoordinadorDashboard();
        if (viewId === 'docenteView') this.loadDocenteDashboard();
        if (viewId === 'adminView') this.loadAdminDashboard();
    }

    updateNavigation(activeView) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const viewToButtonMap = {
            'homeView': 'inicioBtn',
            'consultarView': 'consultarBtn',
            'docenteView': 'docentesBtn',
            'loginView': 'loginBtn'
        };

        const activeButton = viewToButtonMap[activeView];
        if (activeButton) {
            document.getElementById(activeButton).classList.add('active');
        }
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }

    // Iniciar proceso de solicitud
    iniciarSolicitud(tipo) {
        this.tipoSolicitud = tipo;
        this.showModalProteccionDatos();
    }

    // Modal de protección de datos
    showModalProteccionDatos() {
        document.getElementById('modalProteccionDatos').style.display = 'flex';
    }

    toggleProteccionButton() {
        const checkboxProteccion = document.getElementById('aceptoProteccion');
        const checkboxMenor = document.getElementById('menorEdad');
        const button = document.getElementById('aceptarProteccion');
        
        // Ambos checkboxes deben estar marcados para habilitar el botón
        const todosAceptados = checkboxProteccion.checked && checkboxMenor.checked;
        button.disabled = !todosAceptados;
        
        // Cambiar texto del botón según el estado
        if (todosAceptados) {
            button.innerHTML = '<i class="fas fa-check"></i> Acepto y Continúo';
        } else {
            button.innerHTML = '<i class="fas fa-check"></i> Acepto y Continúo';
        }
    }

    cerrarModalProteccion() {
        document.getElementById('modalProteccionDatos').style.display = 'none';
        document.getElementById('aceptoProteccion').checked = false;
        document.getElementById('menorEdad').checked = false;
        document.getElementById('aceptarProteccion').disabled = true;
    }

    aceptarProteccion() {
        // Validar que ambos checkboxes estén marcados
        const checkboxProteccion = document.getElementById('aceptoProteccion');
        const checkboxMenor = document.getElementById('menorEdad');
        
        if (!checkboxProteccion.checked || !checkboxMenor.checked) {
            alert('Debe aceptar ambas declaraciones para continuar');
            return;
        }
        
        // Registrar la aceptación con timestamp
        const aceptacion = {
            fecha: new Date().toISOString(),
            ip: 'sistema_local', // En producción obtener IP real
            tipoSolicitud: this.tipoSolicitud
        };
        
        // Guardar registro de aceptación
        this.saveToStorage('ultimaAceptacionDatos', aceptacion);
        
        this.cerrarModalProteccion();
        
        if (this.tipoSolicitud === 'excusa') {
            this.showView('excusaView');
        } else if (this.tipoSolicitud === 'permiso') {
            this.showView('permisoView');
        }
    }

    // Toggle file upload
    toggleFileUpload() {
        const certificado = document.getElementById('certificadoMedico').checked;
        const incapacidad = document.getElementById('incapacidad').checked;
        const archivoGroup = document.getElementById('archivoGroup');
        
        if (certificado || incapacidad) {
            archivoGroup.style.display = 'block';
        } else {
            archivoGroup.style.display = 'none';
        }
    }

    // Manejo de formularios
    async handleExcusaSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = this.getExcusaFormData();
            const solicitud = await this.createSolicitud({
                ...formData,
                tipo: 'excusa'
            });
            
            this.showModalRadicado(solicitud.radicado);
            this.clearForm('excusaForm');
            this.updateStatus('🟢 Excusa enviada exitosamente');
        } catch (error) {
            console.error('Error al enviar excusa:', error);
            this.updateStatus('🔴 Error al enviar excusa');
            alert('Error al enviar la excusa. Intente nuevamente.');
        }
    }

    async handlePermisoSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = this.getPermisoFormData();
            const solicitud = await this.createSolicitud({
                ...formData,
                tipo: 'permiso'
            });
            
            this.showModalRadicado(solicitud.radicado);
            this.clearForm('permisoForm');
            this.updateStatus('🟢 Permiso enviado exitosamente');
        } catch (error) {
            console.error('Error al enviar permiso:', error);
            this.updateStatus('🔴 Error al enviar permiso');
            alert('Error al enviar el permiso. Intente nuevamente.');
        }
    }

    // Consulta de radicado
    async consultarRadicado() {
        const numeroRadicado = document.getElementById('numeroRadicado').value.trim();
        if (!numeroRadicado) {
            alert('Por favor ingrese un número de radicado');
            return;
        }

        const resultadoDiv = document.getElementById('resultadoConsulta');
        
        try {
            let solicitud = null;
            
            if (SUPABASE_CONFIG.useLocal) {
                solicitud = this.solicitudes.find(s => s.radicado === numeroRadicado);
            } else {
                const { data, error } = await this.supabase
                    .from('vista_solicitudes_completas')
                    .select('*')
                    .eq('radicado', numeroRadicado)
                    .single();
                
                if (error && error.code !== 'PGRST116') {
                    throw error;
                }
                solicitud = data;
            }

            if (solicitud) {
                resultadoDiv.innerHTML = this.generateConsultaHTML(solicitud);
                resultadoDiv.style.display = 'block';
                this.updateStatus('🟢 Solicitud encontrada');
            } else {
                resultadoDiv.innerHTML = `
                    <div class="no-encontrado">
                        <i class="fas fa-search"></i>
                        <h3>No se encontró la solicitud</h3>
                        <p>El número de radicado <strong>${numeroRadicado}</strong> no existe en nuestros registros.</p>
                    </div>
                `;
                resultadoDiv.style.display = 'block';
                this.updateStatus('🟡 Solicitud no encontrada');
            }
        } catch (error) {
            console.error('Error al consultar radicado:', error);
            resultadoDiv.innerHTML = `
                <div class="no-encontrado">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error en la consulta</h3>
                    <p>Ocurrió un error al buscar la solicitud. Intente nuevamente.</p>
                </div>
            `;
            resultadoDiv.style.display = 'block';
            this.updateStatus('🔴 Error en consulta');
        }
    }

    generateConsultaHTML(solicitud) {
        const estadoClass = {
            'pendiente': 'estado-pendiente',
            'aprobado': 'estado-aprobado',
            'rechazado': 'estado-rechazado',
            'validado': 'estado-validado'
        };

        const estadoTexto = {
            'pendiente': 'Pendiente de revisión',
            'aprobado': 'Aprobado por coordinación',
            'rechazado': 'Rechazado',
            'validado': 'Validado por docente'
        };

        const estado = solicitud.estado || solicitud.estado_actual || 'pendiente';
        const nombreEstudiante = solicitud.nombreEstudiante || solicitud.nombre_estudiante || 'No especificado';
        const grado = solicitud.grado || 'No especificado';
        const fecha = solicitud.fecha || solicitud.fecha_solicitud || new Date().toISOString();
        const tipo = solicitud.tipo || solicitud.tipo_solicitud || 'solicitud';

        return `
            <div class="solicitud-detalle">
                <div class="solicitud-header">
                    <h3>Solicitud de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>
                    <span class="estado ${estadoClass[estado]}">${estadoTexto[estado]}</span>
                </div>
                <div class="solicitud-info">
                    <p><strong>Radicado:</strong> ${solicitud.radicado}</p>
                    <p><strong>Estudiante:</strong> ${nombreEstudiante}</p>
                    <p><strong>Grado:</strong> ${grado}</p>
                    <p><strong>Fecha de solicitud:</strong> ${new Date(fecha).toLocaleString()}</p>
                    ${solicitud.observaciones ? `<p><strong>Observaciones:</strong> ${solicitud.observaciones}</p>` : ''}
                </div>
            </div>
        `;
    }

    // Funciones auxiliares compartidas entre modales
    showModalConfirmacion(titulo, mensaje, accion, mostrarObservaciones = false) {
        document.getElementById('tituloConfirmacion').textContent = titulo;
        document.getElementById('mensajeConfirmacion').textContent = mensaje;
        document.getElementById('observacionesGroup').style.display = mostrarObservaciones ? 'block' : 'none';
        
        this.accionPendiente = accion;
        document.getElementById('modalConfirmacion').style.display = 'flex';
    }

    cerrarModalConfirmacion() {
        document.getElementById('modalConfirmacion').style.display = 'none';
        document.getElementById('observaciones').value = '';
        this.accionPendiente = null;
    }

    ejecutarAccionConfirmacion() {
        if (this.accionPendiente) {
            this.accionPendiente();
        }
        this.cerrarModalConfirmacion();
    }

    // Autenticación
    async handleLogin(e) {
        e.preventDefault();
        const usuario = document.getElementById('usuario').value;
        const password = document.getElementById('password').value;
        const tipoUsuario = document.getElementById('tipoUsuario').value;

        try {
            let userFound = null;
            
            if (SUPABASE_CONFIG.useLocal) {
                userFound = await this.loginLocal(usuario, password, tipoUsuario);
            } else {
                userFound = await this.loginSupabase(usuario, password, tipoUsuario);
            }

            if (userFound) {
                this.currentUser = userFound;
                this.saveToStorage('currentUser', userFound);
                this.clearForm('loginForm');
                this.updateAuthUI();
                
                // Redirigir según el tipo de usuario
                if (tipoUsuario === 'coordinador') {
                    this.showView('coordinadorView');
                } else if (tipoUsuario === 'docente') {
                    this.showView('docenteView');
                } else if (tipoUsuario === 'admin') {
                    this.showView('adminView');
                }
                
                this.updateStatus(`🟢 Bienvenido ${userFound.nombre}`);
            } else {
                alert('Usuario o contraseña incorrectos');
            }
        } catch (error) {
            console.error('Error en login:', error);
            alert('Error al iniciar sesión. Intente nuevamente.');
        }
    }

    async loginLocal(usuario, password, tipoUsuario) {
        let userFound = null;
        
        if (tipoUsuario === 'coordinador') {
            userFound = this.usuariosLocal.coordinadores.find(u => u.usuario === usuario && u.password === password);
        } else if (tipoUsuario === 'docente') {
            userFound = this.usuariosLocal.docentes.find(u => u.usuario === usuario && u.password === password);
        } else if (tipoUsuario === 'admin') {
            userFound = this.usuariosLocal.admin.find(u => u.usuario === usuario && u.password === password);
        }
        
        return userFound;
    }

    async loginSupabase(usuario, password, tipoUsuario) {
        try {
            // Buscar usuario en la base de datos
            const { data: userData, error: userError } = await this.supabase
                .from('usuarios')
                .select(`
                    id, usuario, nombre, email, grado_asignado,
                    tipos_usuario!inner(nombre)
                `)
                .eq('usuario', usuario)
                .eq('activo', true)
                .eq('tipos_usuario.nombre', tipoUsuario)
                .single();

            if (userError || !userData) {
                console.error('Usuario no encontrado:', userError);
                return null;
            }

            // En producción, aquí verificarías el hash de la contraseña
            // Por ahora, verificamos la contraseña en texto plano (solo para desarrollo)
            const { data: authData, error: authError } = await this.supabase
                .from('usuarios')
                .select('password_hash')
                .eq('id', userData.id)
                .eq('password_hash', password) // En producción usar bcrypt
                .single();

            if (authError || !authData) {
                console.log('Contraseña incorrecta');
                return null;
            }

            // Autenticar con Supabase Auth (opcional)
            const email = userData.email || `${usuario}@gemelli.edu.co`;
            
            return {
                id: userData.id,
                usuario: userData.usuario,
                nombre: userData.nombre,
                email: userData.email,
                tipo: tipoUsuario,
                grado: userData.grado_asignado
            };

        } catch (error) {
            console.error('Error en autenticación Supabase:', error);
            return null;
        }
    }

    logout() {
        this.currentUser = null;
        this.saveToStorage('currentUser', null);
        this.updateAuthUI();
        this.showView('homeView');
        this.updateStatus('🟢 Sistema listo');
    }

    // Dashboard Coordinador
    async loadCoordinadorDashboard() {
        if (!this.currentUser || !this.hasPermission('ver_dashboard')) {
            this.showView('loginView');
            return;
        }

        try {
            const solicitudes = await this.getSolicitudes();
            
            const pendientes = solicitudes.filter(s => s.estado === 'pendiente' || s.estado_actual === 'pendiente');
            const aprobadasHoy = solicitudes.filter(s => {
                const estado = s.estado || s.estado_actual;
                const fecha = s.fecha || s.fecha_solicitud;
                return estado === 'aprobado' && 
                       new Date(fecha).toDateString() === new Date().toDateString();
            });
            const totalMes = solicitudes.filter(s => {
                const fecha = new Date(s.fecha || s.fecha_solicitud);
                const ahora = new Date();
                return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
            });

            document.getElementById('pendientesCount').textContent = pendientes.length;
            document.getElementById('aprobadasHoy').textContent = aprobadasHoy.length;
            document.getElementById('totalMes').textContent = totalMes.length;

            await this.renderSolicitudesPendientes(pendientes);
        } catch (error) {
            console.error('Error al cargar dashboard coordinador:', error);
            this.updateStatus('🔴 Error al cargar datos');
        }
    }

    async renderSolicitudesPendientes(solicitudes) {
        const container = document.getElementById('listaSolicitudes');
        
        if (solicitudes.length === 0) {
            container.innerHTML = '<p class="no-solicitudes">No hay solicitudes pendientes</p>';
            return;
        }

        container.innerHTML = solicitudes.map(solicitud => {
            const motivo = solicitud.motivo || solicitud.motivoInasistencia || solicitud.motivoPermiso || 'No especificado';
            const tipo = solicitud.tipo || solicitud.tipo_solicitud || 'solicitud';
            const estudiante = solicitud.nombreEstudiante || solicitud.nombre_estudiante || 'No especificado';
            const grado = solicitud.grado || 'No especificado';
            const fecha = solicitud.fecha || solicitud.fecha_solicitud || new Date().toISOString();
            const radicado = solicitud.radicado || 'Sin radicado';
            
            return `
                <div class="solicitud-card" data-id="${solicitud.id}">
                    <div class="solicitud-info">
                        <h4>${tipo.charAt(0).toUpperCase() + tipo.slice(1)} - ${radicado}</h4>
                        <p><strong>Estudiante:</strong> ${estudiante} (${grado})</p>
                        <p><strong>Fecha:</strong> ${new Date(fecha).toLocaleString()}</p>
                        <p><strong>Motivo:</strong> ${motivo}</p>
                    </div>
                    <div class="solicitud-actions">
                        <button class="btn-success" onclick="sistema.aprobarSolicitud('${solicitud.id}')">
                            <i class="fas fa-check"></i> Aprobar
                        </button>
                        <button class="btn-danger" onclick="sistema.rechazarSolicitud('${solicitud.id}')">
                            <i class="fas fa-times"></i> Rechazar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async aprobarSolicitud(id) {
        if (!this.hasPermission('aprobar_solicitudes')) {
            alert('No tiene permisos para aprobar solicitudes');
            return;
        }
        
        this.showModalConfirmacion(
            'Aprobar Solicitud',
            '¿Está seguro de que desea aprobar esta solicitud?',
            () => this.ejecutarAprobacion(id)
        );
    }

    async rechazarSolicitud(id) {
        if (!this.hasPermission('rechazar_solicitudes')) {
            alert('No tiene permisos para rechazar solicitudes');
            return;
        }
        
        this.showModalConfirmacion(
            'Rechazar Solicitud',
            '¿Está seguro de que desea rechazar esta solicitud?',
            () => this.ejecutarRechazo(id),
            true
        );
    }

    async ejecutarAprobacion(id) {
        try {
            await this.updateSolicitudEstado(id, 'aprobado');
            await this.loadCoordinadorDashboard();
            this.updateStatus('🟢 Solicitud aprobada exitosamente');
        } catch (error) {
            console.error('Error al aprobar solicitud:', error);
            this.updateStatus('🔴 Error al aprobar solicitud');
            alert('Error al aprobar la solicitud');
        }
    }

    async ejecutarRechazo(id) {
        try {
            const observaciones = document.getElementById('observaciones').value;
            await this.updateSolicitudEstado(id, 'rechazado', observaciones);
            await this.loadCoordinadorDashboard();
            this.updateStatus('🟢 Solicitud rechazada');
        } catch (error) {
            console.error('Error al rechazar solicitud:', error);
            this.updateStatus('🔴 Error al rechazar solicitud');
            alert('Error al rechazar la solicitud');
        }
    }

    // Dashboard Docente
    async loadDocenteDashboard() {
        if (!this.currentUser || !this.hasPermission('validar_solicitudes')) {
            this.showView('loginView');
            return;
        }

        try {
            const solicitudesAprobadas = await this.getSolicitudes({ estado: 'aprobado' });
            await this.renderSolicitudesDocente(solicitudesAprobadas);
        } catch (error) {
            console.error('Error al cargar dashboard docente:', error);
            this.updateStatus('🔴 Error al cargar datos');
        }
    }

    async renderSolicitudesDocente(solicitudes) {
        const container = document.getElementById('solicitudesDocente');
        
        if (solicitudes.length === 0) {
            container.innerHTML = '<p class="no-solicitudes">No hay solicitudes para validar</p>';
            return;
        }

        container.innerHTML = solicitudes.map(solicitud => {
            const motivo = solicitud.motivo || solicitud.motivoInasistencia || solicitud.motivoPermiso || 'No especificado';
            const tipo = solicitud.tipo || solicitud.tipo_solicitud || 'solicitud';
            const estudiante = solicitud.nombreEstudiante || solicitud.nombre_estudiante || 'No especificado';
            const aprobadoPor = solicitud.aprobadoPor || solicitud.aprobado_por || 'Sistema';
            const radicado = solicitud.radicado || 'Sin radicado';
            
            return `
                <div class="solicitud-card" data-id="${solicitud.id}">
                    <div class="solicitud-info">
                        <h4>${tipo.charAt(0).toUpperCase() + tipo.slice(1)} - ${radicado}</h4>
                        <p><strong>Estudiante:</strong> ${estudiante} (${solicitud.grado})</p>
                        <p><strong>Aprobado por:</strong> ${aprobadoPor}</p>
                        <p><strong>Motivo:</strong> ${motivo}</p>
                    </div>
                    <div class="solicitud-actions">
                        <button class="btn-primary" onclick="sistema.validarSolicitud('${solicitud.id}')">
                            <i class="fas fa-stamp"></i> Validar
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async validarSolicitud(id) {
        if (!this.hasPermission('validar_solicitudes')) {
            alert('No tiene permisos para validar solicitudes');
            return;
        }

        try {
            await this.updateSolicitudEstado(id, 'validado');
            await this.loadDocenteDashboard();
            this.updateStatus('🟢 Solicitud validada exitosamente');
        } catch (error) {
            console.error('Error al validar solicitud:', error);
            this.updateStatus('🔴 Error al validar solicitud');
            alert('Error al validar la solicitud');
        }
    }

    // Dashboard Admin
    async loadAdminDashboard() {
        if (!this.currentUser || !this.hasPermission('ver_estadisticas')) {
            this.showView('loginView');
            return;
        }

        try {
            const solicitudes = await this.getSolicitudes();
            
            const total = solicitudes.length;
            const aprobadas = solicitudes.filter(s => {
                const estado = s.estado || s.estado_actual;
                return estado === 'aprobado' || estado === 'validado';
            }).length;
            const tasa = total > 0 ? Math.round((aprobadas / total) * 100) : 0;
            const promedio = this.calcularPromedioDiario(solicitudes);

            document.getElementById('totalSolicitudes').textContent = total;
            document.getElementById('tasaAprobacion').textContent = `${tasa}%`;
            document.getElementById('promedioDiario').textContent = promedio;

            this.renderAdminCharts(solicitudes);
        } catch (error) {
            console.error('Error al cargar dashboard admin:', error);
            this.updateStatus('🔴 Error al cargar estadísticas');
        }
    }

    calcularPromedioDiario(solicitudes) {
        if (solicitudes.length === 0) return 0;
        
        const fechas = solicitudes.map(s => {
            const fecha = s.fecha || s.fecha_solicitud;
            return new Date(fecha).toDateString();
        });
        const fechasUnicas = [...new Set(fechas)];
        
        return Math.round(solicitudes.length / Math.max(fechasUnicas.length, 1));
    }

    renderAdminCharts(solicitudes) {
        // Gráfico de grados (simplificado)
        const gradosCount = {};
        solicitudes.forEach(s => {
            const grado = s.grado || 'Sin grado';
            gradosCount[grado] = (gradosCount[grado] || 0) + 1;
        });

        const gradosChart = document.getElementById('gradosChart');
        gradosChart.innerHTML = Object.entries(gradosCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([grado, count]) => `
                <div class="chart-bar">
                    <span class="chart-label">${grado}</span>
                    <div class="chart-value">${count}</div>
                </div>
            `).join('');

        // Histórico mensual (simplificado)
        const mesesCount = {};
        solicitudes.forEach(s => {
            const fecha = new Date(s.fecha || s.fecha_solicitud);
            const mes = fecha.toLocaleDateString('es', { month: 'short', year: 'numeric' });
            mesesCount[mes] = (mesesCount[mes] || 0) + 1;
        });

        const historicoChart = document.getElementById('historicoChart');
        historicoChart.innerHTML = Object.entries(mesesCount)
            .slice(-6)
            .map(([mes, count]) => `
                <div class="chart-bar">
                    <span class="chart-label">${mes}</span>
                    <div class="chart-value">${count}</div>
                </div>
            `).join('');
    }

    // Actualizar sección de revisión
    updateReview(tipo) {
        if (tipo === 'excusa') {
            // Información del acudiente
            document.getElementById('reviewNombreAcudiente').textContent = 
                document.getElementById('nombreAcudiente').value || '-';
            document.getElementById('reviewEmailAcudiente').textContent = 
                document.getElementById('emailAcudiente').value || '-';
            document.getElementById('reviewTelefonoAcudiente').textContent = 
                document.getElementById('telefonoAcudiente').value || '-';
            
            const perfilSelect = document.getElementById('perfilAcudiente');
            document.getElementById('reviewPerfilAcudiente').textContent = 
                perfilSelect.options[perfilSelect.selectedIndex]?.text || '-';

            // Información del estudiante
            const estudianteSelect = document.getElementById('estudianteExcusa');
            if (estudianteSelect.value) {
                const estudiante = JSON.parse(estudianteSelect.value);
                document.getElementById('reviewEstudiante').textContent = 
                    `${estudiante.nombre} ${estudiante.apellidos}`;
            } else {
                document.getElementById('reviewEstudiante').textContent = '-';
            }
            document.getElementById('reviewGrado').textContent = 
                document.getElementById('gradoExcusa').value || '-';

            // Detalles de la excusa
            const fecha = document.getElementById('fechaExcusa').value;
            document.getElementById('reviewFecha').textContent = 
                fecha ? new Date(fecha).toLocaleDateString('es-CO') : '-';
            
            const dias = document.getElementById('diasInasistencia').value;
            const mes = document.getElementById('mesInasistencia').value;
            document.getElementById('reviewPeriodo').textContent = 
                (dias && mes) ? `${dias} de ${mes}` : '-';
            
            document.getElementById('reviewMotivo').textContent = 
                document.getElementById('motivoInasistencia').value || '-';

            // Documentos
            const certificado = document.getElementById('certificadoMedico').checked;
            const incapacidad = document.getElementById('incapacidad').checked;
            let documentos = [];
            if (certificado) documentos.push('Certificado Médico');
            if (incapacidad) documentos.push('Incapacidad');
            document.getElementById('reviewDocumentos').textContent = 
                documentos.length > 0 ? documentos.join(', ') : 'Ninguno';

        } else if (tipo === 'permiso') {
            // Información del acudiente
            document.getElementById('reviewNombreAcudientePermiso').textContent = 
                document.getElementById('nombreAcudientePermiso').value || '-';
            document.getElementById('reviewEmailAcudientePermiso').textContent = 
                document.getElementById('emailAcudientePermiso').value || '-';
            document.getElementById('reviewTelefonoAcudientePermiso').textContent = 
                document.getElementById('telefonoAcudientePermiso').value || '-';
            
            const perfilSelect = document.getElementById('perfilAcudientePermiso');
            document.getElementById('reviewPerfilAcudientePermiso').textContent = 
                perfilSelect.options[perfilSelect.selectedIndex]?.text || '-';

            // Información del estudiante
            const estudianteSelect = document.getElementById('estudiantePermiso');
            if (estudianteSelect.value) {
                const estudiante = JSON.parse(estudianteSelect.value);
                document.getElementById('reviewEstudiantePermiso').textContent = 
                    `${estudiante.nombre} ${estudiante.apellidos}`;
            } else {
                document.getElementById('reviewEstudiantePermiso').textContent = '-';
            }
            document.getElementById('reviewGradoPermiso').textContent = 
                document.getElementById('gradoPermiso').value || '-';

            // Detalles del permiso
            const fecha = document.getElementById('fechaPermiso').value;
            document.getElementById('reviewFechaPermiso').textContent = 
                fecha ? new Date(fecha).toLocaleDateString('es-CO') : '-';
            
            const tipoSelect = document.getElementById('tipoPermiso');
            document.getElementById('reviewTipoPermiso').textContent = 
                tipoSelect.options[tipoSelect.selectedIndex]?.text || '-';

            const horaSalida = document.getElementById('horaSalida').value;
            const horaRegreso = document.getElementById('horaRegreso').value;
            let horario = horaSalida ? `Salida: ${horaSalida}` : '';
            if (horaRegreso) horario += ` - Regreso: ${horaRegreso}`;
            document.getElementById('reviewHorarioPermiso').textContent = horario || '-';

            document.getElementById('reviewPersonaRecoge').textContent = 
                document.getElementById('personaRecoge').value || '-';
            
            document.getElementById('reviewMotivoPermiso').textContent = 
                document.getElementById('motivoPermiso').value || '-';
        }
    }

    // Navegación entre vistas (actualizada con reconfiguración de eventos)
    showView(viewId) {
        console.log(`Cambiando a vista: ${viewId}`);
        
        // Verificar permisos para vistas protegidas
        if (viewId === 'coordinadorView' && (!this.currentUser || !this.hasPermission('ver_dashboard'))) {
            this.showView('loginView');
            return;
        }
        
        if (viewId === 'docenteView' && (!this.currentUser || !this.hasPermission('validar_solicitudes'))) {
            this.showView('loginView');
            return;
        }
        
        if (viewId === 'adminView' && (!this.currentUser || !this.hasPermission('ver_estadisticas'))) {
            this.showView('loginView');
            return;
        }

        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Mostrar vista seleccionada
        document.getElementById(viewId).classList.add('active');
        this.currentView = viewId;

        // Resetear steppers si se va a una vista de formulario
        if (viewId === 'excusaView') {
            this.resetStepper('excusa');
            // Reconfigurar eventos después de mostrar la vista
            setTimeout(() => {
                this.setupStepperEvents();
            }, 100);
        } else if (viewId === 'permisoView') {
            this.resetStepper('permiso');
            // Reconfigurar eventos después de mostrar la vista
            setTimeout(() => {
                this.setupStepperEvents();
            }, 100);
        }

        // Actualizar navegación
        this.updateNavigation(viewId);

        // Cargar datos específicos de la vista
        if (viewId === 'coordinadorView') this.loadCoordinadorDashboard();
        if (viewId === 'docenteView') this.loadDocenteDashboard();
        if (viewId === 'adminView') this.loadAdminDashboard();
    }

    // Resetear stepper
    resetStepper(tipo) {
        if (tipo === 'excusa') {
            this.currentStepExcusa = 1;
            this.showStep('excusa', 1);
        } else {
            this.currentStepPermiso = 1;
            this.showStep('permiso', 1);
        }
    }

    // Actualizar getExcusaFormData (sin documento)
    getExcusaFormData() {
        // Obtener información del estudiante seleccionado
        const estudianteSelect = document.getElementById('estudianteExcusa');
        let estudianteData = null;
        if (estudianteSelect.value) {
            estudianteData = JSON.parse(estudianteSelect.value);
        }

        return {
            // Información del acudiente
            nombreAcudiente: document.getElementById('nombreAcudiente').value,
            emailAcudiente: document.getElementById('emailAcudiente').value,
            telefonoAcudiente: document.getElementById('telefonoAcudiente').value,
            perfilAcudiente: document.getElementById('perfilAcudiente').value,
            
            // Información del estudiante
            nombreEstudiante: estudianteData ? `${estudianteData.nombre} ${estudianteData.apellidos}` : '',
            codigoEstudiante: estudianteData ? estudianteData.codigo : '',
            grado: document.getElementById('gradoExcusa').value,
            
            // Detalles de la excusa
            fechaExcusa: document.getElementById('fechaExcusa').value,
            diasInasistencia: document.getElementById('diasInasistencia').value,
            mesInasistencia: document.getElementById('mesInasistencia').value,
            motivoInasistencia: document.getElementById('motivoInasistencia').value,
            certificadoMedico: document.getElementById('certificadoMedico').checked,
            incapacidad: document.getElementById('incapacidad').checked
        };
    }

    // Actualizar getPermisoFormData (sin documento)
    getPermisoFormData() {
        // Obtener información del estudiante seleccionado
        const estudianteSelect = document.getElementById('estudiantePermiso');
        let estudianteData = null;
        if (estudianteSelect.value) {
            estudianteData = JSON.parse(estudianteSelect.value);
        }

        return {
            // Información del acudiente
            nombreAcudiente: document.getElementById('nombreAcudientePermiso').value,
            emailAcudiente: document.getElementById('emailAcudientePermiso').value,
            telefonoAcudiente: document.getElementById('telefonoAcudientePermiso').value,
            perfilAcudiente: document.getElementById('perfilAcudientePermiso').value,
            
            // Información del estudiante
            nombreEstudiante: estudianteData ? `${estudianteData.nombre} ${estudianteData.apellidos}` : '',
            codigoEstudiante: estudianteData ? estudianteData.codigo : '',
            grado: document.getElementById('gradoPermiso').value,
            
            // Detalles del permiso
            fechaPermiso: document.getElementById('fechaPermiso').value,
            tipoPermiso: document.getElementById('tipoPermiso').value,
            motivoPermiso: document.getElementById('motivoPermiso').value,
            horaSalida: document.getElementById('horaSalida').value,
            horaRegreso: document.getElementById('horaRegreso').value,
            lugarDestino: document.getElementById('lugarDestino').value,
            personaRecoge: document.getElementById('personaRecoge').value
        };
    }

    // Limpiar formularios
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Resetear selectores de estudiante
            if (formId === 'excusaForm') {
                document.getElementById('estudianteExcusa').disabled = true;
                document.getElementById('estudianteInfo').style.display = 'none';
                document.getElementById('archivoGroup').style.display = 'none';
                this.resetStepper('excusa');
            } else if (formId === 'permisoForm') {
                document.getElementById('estudiantePermiso').disabled = true;
                document.getElementById('estudianteInfoPermiso').style.display = 'none';
                this.resetStepper('permiso');
            }
            
            // Limpiar errores
            form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            
            // Resetear fecha mínima
            this.initDateValidation();
        }
    }

    // Toggle file upload (actualizado)
    toggleFileUpload() {
        const certificado = document.getElementById('certificadoMedico').checked;
        const incapacidad = document.getElementById('incapacidad').checked;
        const archivoGroup = document.getElementById('archivoGroup');
        
        if (certificado || incapacidad) {
            archivoGroup.style.display = 'block';
            document.getElementById('archivoAdjunto').required = true;
        } else {
            archivoGroup.style.display = 'none';
            document.getElementById('archivoAdjunto').required = false;
        }
    }

    // Manejar envío de formularios (actualizado)
    async handleExcusaSubmit(e) {
        e.preventDefault();
        
        // Validar paso final
        if (!this.validateStep('excusa', 4)) {
            return;
        }
        
        try {
            const formData = this.getExcusaFormData();
            const solicitud = await this.createSolicitud({
                ...formData,
                tipo: 'excusa'
            });
            
            this.showModalRadicado(solicitud.radicado);
            this.clearForm('excusaForm');
            this.updateStatus('🟢 Excusa enviada exitosamente');
        } catch (error) {
            console.error('Error al enviar excusa:', error);
            this.updateStatus('🔴 Error al enviar excusa');
            alert('Error al enviar la excusa. Intente nuevamente.');
        }
    }

    async handlePermisoSubmit(e) {
        e.preventDefault();
        
        // Validar paso final
        if (!this.validateStep('permiso', 4)) {
            return;
        }
        
        try {
            const formData = this.getPermisoFormData();
            const solicitud = await this.createSolicitud({
                ...formData,
                tipo: 'permiso'
            });
            
            this.showModalRadicado(solicitud.radicado);
            this.clearForm('permisoForm');
            this.updateStatus('🟢 Permiso enviado exitosamente');
        } catch (error) {
            console.error('Error al enviar permiso:', error);
            this.updateStatus('🔴 Error al enviar permiso');
            alert('Error al enviar el permiso. Intente nuevamente.');
        }
    }

    // Función para mostrar modal de radicado y volver a home
    showModalRadicado(radicado) {
        document.getElementById('numeroRadicadoGenerado').textContent = radicado;
        document.getElementById('modalRadicado').style.display = 'flex';
    }

    cerrarModalRadicado() {
        document.getElementById('modalRadicado').style.display = 'none';
        this.showView('homeView');
    }

    // Event Listeners
    setupEventListeners() {
        // Navegación principal
        document.getElementById('inicioBtn').addEventListener('click', () => this.showView('homeView'));
        document.getElementById('consultarBtn').addEventListener('click', () => this.showView('consultarView'));
        document.getElementById('docentesBtn').addEventListener('click', () => {
            if (this.currentUser && this.currentUser.tipo === 'docente') {
                this.showView('docenteView');
            } else {
                this.showView('loginView');
            }
        });
        document.getElementById('loginBtn').addEventListener('click', () => {
            if (this.currentUser) {
                this.logout();
            } else {
                this.showView('loginView');
            }
        });

        // Botones de solicitud
        document.getElementById('excusaCard').addEventListener('click', () => this.iniciarSolicitud('excusa'));
        document.getElementById('permisoCard').addEventListener('click', () => this.iniciarSolicitud('permiso'));

        // Botones de volver
        document.getElementById('backToHome').addEventListener('click', () => this.showView('homeView'));
        document.getElementById('backToHomePermiso').addEventListener('click', () => this.showView('homeView'));

        // Formularios
        document.getElementById('excusaForm').addEventListener('submit', (e) => this.handleExcusaSubmit(e));
        document.getElementById('permisoForm').addEventListener('submit', (e) => this.handlePermisoSubmit(e));
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Checkboxes para mostrar upload
        document.getElementById('certificadoMedico').addEventListener('change', this.toggleFileUpload);
        document.getElementById('incapacidad').addEventListener('change', this.toggleFileUpload);

        // Consulta de radicado
        document.getElementById('buscarBtn').addEventListener('click', () => this.consultarRadicado());
        document.getElementById('numeroRadicado').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.consultarRadicado();
        });

        // Modal protección de datos
        document.getElementById('aceptoProteccion').addEventListener('change', this.toggleProteccionButton);
        document.getElementById('menorEdad').addEventListener('change', this.toggleProteccionButton);
        document.getElementById('cancelarProteccion').addEventListener('click', () => this.cerrarModalProteccion());
        document.getElementById('aceptarProteccion').addEventListener('click', () => this.aceptarProteccion());

        // Modal radicado
        document.getElementById('cerrarModalRadicado').addEventListener('click', () => this.cerrarModalRadicado());

        // Logout buttons
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('logoutDocenteBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('logoutAdminBtn')?.addEventListener('click', () => this.logout());

        // Modal confirmación
        document.getElementById('cancelarAccion').addEventListener('click', () => this.cerrarModalConfirmacion());
        document.getElementById('confirmarAccion').addEventListener('click', () => this.ejecutarAccionConfirmacion());
    }

    // Navegación entre vistas
    showView(viewId) {
        // Verificar permisos para vistas protegidas
        if (viewId === 'coordinadorView' && (!this.currentUser || !this.hasPermission('ver_dashboard'))) {
            this.showView('loginView');
            return;
        }
        
        if (viewId === 'docenteView' && (!this.currentUser || !this.hasPermission('validar_solicitudes'))) {
            this.showView('loginView');
            return;
        }
        
        if (viewId === 'adminView' && (!this.currentUser || !this.hasPermission('ver_estadisticas'))) {
            this.showView('loginView');
            return;
        }

        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Mostrar vista seleccionada
        document.getElementById(viewId).classList.add('active');
        this.currentView = viewId;

        // Actualizar navegación
        this.updateNavigation(viewId);

        // Cargar datos específicos de la vista
        if (viewId === 'coordinadorView') this.loadCoordinadorDashboard();
        if (viewId === 'docenteView') this.loadDocenteDashboard();
        if (viewId === 'adminView') this.loadAdminDashboard();
    }

    updateNavigation(activeView) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const viewToButtonMap = {
            'homeView': 'inicioBtn',
            'consultarView': 'consultarBtn',
            'docenteView': 'docentesBtn',
            'loginView': 'loginBtn'
        };

        const activeButton = viewToButtonMap[activeView];
        if (activeButton) {
            document.getElementById(activeButton).classList.add('active');
        }
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }

    // Iniciar proceso de solicitud
    iniciarSolicitud(tipo) {
        this.tipoSolicitud = tipo;
        this.showModalProteccionDatos();
    }

    // Modal de protección de datos
    showModalProteccionDatos() {
        document.getElementById('modalProteccionDatos').style.display = 'flex';
    }

    toggleProteccionButton() {
        const checkbox = document.getElementById('aceptoProteccion');
        const button = document.getElementById('aceptarProteccion');
        button.disabled = !checkbox.checked;
    }

    cerrarModalProteccion() {
        document.getElementById('modalProteccionDatos').style.display = 'none';
        document.getElementById('aceptoProteccion').checked = false;
        document.getElementById('aceptarProteccion').disabled = true;
    }

    aceptarProteccion() {
        this.cerrarModalProteccion();
        if (this.tipoSolicitud === 'excusa') {
            this.showView('excusaView');
        } else if (this.tipoSolicitud === 'permiso') {
            this.showView('permisoView');
        }
    }

    // Toggle file upload
    toggleFileUpload() {
        const certificado = document.getElementById('certificadoMedico').checked;
        const incapacidad = document.getElementById('incapacidad').checked;
        const archivoGroup = document.getElementById('archivoGroup');
        
        if (certificado || incapacidad) {
            archivoGroup.style.display = 'block';
        } else {
            archivoGroup.style.display = 'none';
        }
    }

    // Utilidades de almacenamiento
    saveToStorage(key, data) {
        try {
            // Usar almacenamiento en memoria para el entorno de Claude
            if (!window.sistemaStorage) {
                window.sistemaStorage = {};
            }
            window.sistemaStorage[key] = JSON.parse(JSON.stringify(data));
        } catch (error) {
            console.warn('No se pudo guardar en almacenamiento:', error);
        }
    }

    loadFromStorage(key) {
        try {
            return window.sistemaStorage?.[key] || null;
        } catch (error) {
            console.warn('No se pudo cargar del almacenamiento:', error);
            return null;
        }
    }
}

// Inicializar sistema cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.sistema = new SistemaExcusas();
});

// Exponer globalmente para eventos onclick
if (typeof window !== 'undefined') {
    window.sistema = new SistemaExcusas();
}
