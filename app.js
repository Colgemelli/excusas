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
        await this.checkAuthStatus();
        this.updateStatus('🟢 Sistema listo');
        this.showView('homeView');
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

    getExcusaFormData() {
        return {
            fechaExcusa: document.getElementById('fechaExcusa').value,
            nombreEstudiante: document.getElementById('nombreEstudianteExcusa').value,
            grado: document.getElementById('gradoExcusa').value,
            diasInasistencia: document.getElementById('diasInasistencia').value,
            mesInasistencia: document.getElementById('mesInasistencia').value,
            motivoInasistencia: document.getElementById('motivoInasistencia').value,
            certificadoMedico: document.getElementById('certificadoMedico').checked,
            incapacidad: document.getElementById('incapacidad').checked,
            firmaPadre: document.getElementById('firmaPadreExcusa').value
        };
    }

    getPermisoFormData() {
        return {
            fechaPermiso: document.getElementById('fechaPermiso').value,
            nombreEstudiante: document.getElementById('nombreEstudiantePermiso').value,
            grado: document.getElementById('gradoPermiso').value,
            motivoPermiso: document.getElementById('motivoPermiso').value,
            horaSalida: document.getElementById('horaSalida').value,
            horaRegreso: document.getElementById('horaRegreso').value,
            firmaPadre: document.getElementById('firmaPadrePermiso').value
        };
    }

    generateRadicado() {
        const fecha = new Date();
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const prefix = `GEM${year}${month}`;
        const numero = String(this.radicadoCounter++).padStart(4, '0');
        return `${prefix}${numero}`;
    }

    showModalRadicado(radicado) {
        document.getElementById('numeroRadicadoGenerado').textContent = radicado;
        document.getElementById('modalRadicado').style.display = 'flex';
    }

    cerrarModalRadicado() {
        document.getElementById('modalRadicado').style.display = 'none';
        this.showView('homeView');
    }

    clearForm(formId) {
        document.getElementById(formId).reset();
        if (formId === 'excusaForm') {
            document.getElementById('archivoGroup').style.display = 'none';
        }
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
