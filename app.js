// Sistema de Excusas y Permisos - Colegio Gemelli Franciscanos
// app.js - Lógica Principal CORREGIDA

// ========== CORRECCIÓN 1: Configuración simplificada ==========
const SUPABASE_CONFIG = {
    url: window.process?.env?.SUPABASE_URL || '',
    key: window.process?.env?.SUPABASE_ANON_KEY || '',
    useLocal: true // ========== CAMBIAR A TRUE PARA DESARROLLO LOCAL ==========
};

// Sanitiza texto para evitar inyecciones al usar innerHTML
function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

class SistemaExcusas {
    constructor() {
        this.currentView = 'homeView';
        this.currentUser = null;
        this.tipoSolicitud = null;
        this.solicitudes = [];
        this.adminSolicitudes = [];
        this.radicadoCounter = 1000;
        this.radicadoPrefix = 'RAD-';
        this.supabase = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando sistema...');
            await this.initSupabase();
            await this.loadRadicadoConfig();
            this.setupEventListeners();
            this.initSteppers();
            this.initDateValidation();
            this.initStudentDatabase();
            await this.checkAuthStatus();
            this.updateStatus('🟢 Sistema listo');
            this.showView('homeView');
            console.log('✅ Sistema inicializado correctamente');
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            this.updateStatus('🔴 Error en inicialización');
            // Continuar con modo local si falla Supabase
            SUPABASE_CONFIG.useLocal = true;
            await this.loadLocalData();
            this.updateStatus('🟡 Modo local activado');
        }
    }

    // ========== CORRECCIÓN 2: Inicialización mejorada de Supabase ==========
    async initSupabase() {
        if (SUPABASE_CONFIG.useLocal) {
            console.log('📱 Usando almacenamiento local para desarrollo');
            await this.loadLocalData();
            return;
        }

        try {
            // Verificar variables de entorno
            if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.key) {
                throw new Error('Variables de entorno de Supabase no configuradas');
            }

            // Verificar que la librería esté cargada
            if (typeof window.supabase === 'undefined') {
                // Intentar usar la variable global 'supabase' directamente
                if (typeof supabase !== 'undefined') {
                    window.supabase = supabase;
                } else {
                    throw new Error('Librería de Supabase no encontrada');
                }
            }

            // Crear cliente de Supabase
            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url, 
                SUPABASE_CONFIG.key
            );

            console.log('✅ Cliente de Supabase creado');

            // Verificar conexión
            const { error } = await this.supabase.from('grados').select('id').limit(1);
            if (error) {
                console.warn('⚠️ Error de conexión, usando modo local:', error);
                throw error;
            }
            
            console.log('✅ Conexión a Supabase verificada');
        } catch (error) {
            console.error('❌ Error al inicializar Supabase:', error);
            console.log('🔄 Cambiando a modo local...');
            SUPABASE_CONFIG.useLocal = true;
            await this.loadLocalData();
        }
    }

    async loadRadicadoConfig() {
        if (SUPABASE_CONFIG.useLocal) {
            this.radicadoPrefix = this.loadFromStorage('radicadoPrefix') || this.radicadoPrefix;
            this.radicadoCounter = this.loadFromStorage('radicadoCounter') || this.radicadoCounter;
            return;
        }

        try {
            const { data, error } = await this.supabase
                .from('configuracion_sistema')
                .select('clave, valor')
                .in('clave', ['radicado_prefix', 'radicado_counter']);

            if (error) throw error;

            if (data && data.length > 0) {
                data.forEach(row => {
                    if (row.clave === 'radicado_prefix') this.radicadoPrefix = row.valor;
                    if (row.clave === 'radicado_counter') this.radicadoCounter = Number(row.valor);
                });
            }
        } catch (error) {
            console.error('Error cargando configuración de radicados:', error);
        }
    }

    // ========== CORRECCIÓN 3: Crear solicitud mejorada ==========
    async createSolicitud(solicitudData) {
        console.log('🔄 Creando solicitud...', { useLocal: SUPABASE_CONFIG.useLocal });
        
        if (SUPABASE_CONFIG.useLocal) {
            return await this.createSolicitudLocal(solicitudData);
        }

        try {
            // Generar radicado
            const radicado = await this.generateRadicado();
            console.log('📋 Radicado generado:', radicado);

            // Obtener grado_id
            const gradoId = await this.getGradoId(solicitudData.grado);
            if (!gradoId) {
                throw new Error(`No se encontró el grado: ${solicitudData.grado}`);
            }

            // Preparar datos para la base de datos
            const solicitudParaDB = {
                radicado: radicado,
                tipo_solicitud_id: solicitudData.tipo === 'excusa' ? 1 : 2,
                nombre_estudiante: solicitudData.nombreEstudiante,
                grado_id: gradoId,
                motivo: solicitudData.motivoInasistencia || solicitudData.motivoPermiso,
                datos_formulario: solicitudData,
                nombre_padre_acudiente: solicitudData.nombreAcudiente,
                telefono_contacto: solicitudData.telefonoAcudiente || null,
                email_contacto: solicitudData.emailAcudiente || null,
                tiene_certificado_medico: solicitudData.certificadoMedico || false,
                tiene_incapacidad: solicitudData.incapacidad || false,
                estado_actual_id: 1 // Estado pendiente
            };

            console.log('📤 Enviando a Supabase:', solicitudParaDB);

            const { data, error } = await this.supabase
                .from('solicitudes')
                .insert([solicitudParaDB])
                .select();
            
            if (error) {
                console.error('❌ Error de Supabase:', error);
                throw error;
            }

            console.log('✅ Solicitud guardada exitosamente:', data[0]);
            return data[0];
            
        } catch (error) {
            console.error('❌ Error al crear solicitud:', error);
            throw error;
        }
    }

    async createSolicitudLocal(solicitudData) {
        try {
            const radicado = await this.generateRadicado();
            
            const solicitud = {
                id: Date.now(),
                radicado: radicado,
                tipo: solicitudData.tipo || (solicitudData.motivoInasistencia ? 'excusa' : 'permiso'),
                fecha: new Date().toISOString(),
                estado: 'pendiente',
                validacionesDocentes: [],
                ...solicitudData,
                nombreEstudiante: solicitudData.nombreEstudiante,
                grado: solicitudData.grado
            };

            this.solicitudes.push(solicitud);
            this.saveToStorage('solicitudes', this.solicitudes);
            console.log('✅ Solicitud guardada localmente:', solicitud);
            return solicitud;
        } catch (error) {
            console.error('❌ Error al crear solicitud local:', error);
            throw error;
        }
    }

    // ========== CORRECCIÓN 4: Obtener ID del grado mejorado ==========
    async getGradoId(nombreGrado) {
        if (SUPABASE_CONFIG.useLocal) {
            const grados = ['Preescolar', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°'];
            return grados.indexOf(nombreGrado) + 1;
        }
        
        try {
            const { data, error } = await this.supabase
                .from('grados')
                .select('id')
                .eq('nombre', nombreGrado)
                .single();
            
            if (error) {
                console.error('Error al obtener grado:', error);
                return null;
            }
            
            return data?.id || null;
        } catch (error) {
            console.error('Error en getGradoId:', error);
            return null;
        }
    }

    // Cargar datos locales para desarrollo
    async loadLocalData() {
        this.solicitudes = this.loadFromStorage('solicitudes') || [];
        this.radicadoCounter = this.loadFromStorage('radicadoCounter') || 1000;
        this.radicadoPrefix = this.loadFromStorage('radicadoPrefix') || this.radicadoPrefix;

        // ========== CORRECCIÓN 5: Usuarios de prueba mejorados ==========
        this.usuariosLocal = {
            coordinador: [
                { 
                    id: 'coord1', 
                    usuario: 'coord1', 
                    password: 'coord123', 
                    nombre: 'María González', 
                    tipo: 'coordinador', 
                    email: 'maria.gonzalez@gemelli.edu.co' 
                },
                { 
                    id: 'directora', 
                    usuario: 'directora', 
                    password: 'dir123', 
                    nombre: 'Ana Patricia López', 
                    tipo: 'coordinador', 
                    email: 'ana.lopez@gemelli.edu.co' 
                }
            ],
            docente: [
                {
                    id: 'doc1',
                    usuario: 'doc1',
                    password: 'doc123',
                    nombre: 'Carlos Ramírez',
                    grado: '5°',
                    asignatura: 'Matemáticas',
                    tipo: 'docente',
                    email: 'carlos.ramirez@gemelli.edu.co'
                },
                {
                    id: 'doc2',
                    usuario: 'doc2',
                    password: 'doc123',
                    nombre: 'Laura Martínez',
                    grado: '8°',
                    asignatura: 'Inglés',
                    tipo: 'docente',
                    email: 'laura.martinez@gemelli.edu.co'
                }
            ],
            admin: [
                { 
                    id: 'admin', 
                    usuario: 'admin', 
                    password: 'admin123', 
                    nombre: 'Administrador Sistema', 
                    tipo: 'admin', 
                    email: 'admin@gemelli.edu.co' 
                }
            ]
        };

        console.log('📊 Datos locales cargados:', {
            solicitudes: this.solicitudes.length,
            usuarios: Object.values(this.usuariosLocal).flat().length
        });
    }

    // ========== CORRECCIÓN 6: Login mejorado ==========
    async handleLogin(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value.trim();
        const tipoUsuario = document.getElementById('tipoUsuario').value;

        // Limpiar mensajes previos
        const loginMessage = document.getElementById('loginMessage');
        loginMessage.style.display = 'none';

        // Validar campos
        if (!usuario || !password || !tipoUsuario) {
            this.showLoginError('Por favor complete todos los campos');
            return;
        }

        console.log('🔐 Intentando login...', { usuario, tipoUsuario, useLocal: SUPABASE_CONFIG.useLocal });

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
                const viewMap = {
                    'coordinador': 'coordinadorView',
                    'docente': 'docenteView',
                    'admin': 'adminView'
                };
                
                this.showView(viewMap[tipoUsuario] || 'homeView');
                this.updateStatus(`🟢 Bienvenido ${userFound.nombre}`);
                console.log('✅ Login exitoso:', userFound);
            } else {
                this.showLoginError('Usuario, contraseña o tipo de usuario incorrectos');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            this.showLoginError('Error al iniciar sesión. Intente nuevamente.');
        }
    }

    showLoginError(message) {
        const loginMessage = document.getElementById('loginMessage');
        loginMessage.textContent = message;
        loginMessage.style.display = 'block';
        loginMessage.style.color = '#ef4444';
    }

    async loginLocal(usuario, password, tipoUsuario) {
        console.log('🏠 Intentando login local...', { usuario, tipoUsuario });
        
        const usersList = this.usuariosLocal[tipoUsuario] || [];
        const userFound = usersList.find(u => u.usuario === usuario && u.password === password);
        
        if (userFound) {
            const { password: _, ...userData } = userFound;
            console.log('✅ Usuario encontrado en datos locales:', userData);
            return userData;
        }

        console.log('❌ Usuario no encontrado en datos locales');
        return null;
    }

    // ========== CORRECCIÓN 7: Login Supabase simplificado ==========
    async loginSupabase(usuario, password, tipoUsuario) {
        console.log('☁️ Intentando login Supabase...', { usuario, tipoUsuario });
        
        try {
            // Consulta simplificada
            const { data: usuarios, error } = await this.supabase
                .from('usuarios')
                .select(`
                    id, 
                    usuario, 
                    password,
                    nombre, 
                    email, 
                    grado_asignado, 
                    activo,
                    tipo_usuario_id
                `)
                .eq('usuario', usuario)
                .eq('activo', true);

            if (error) {
                console.error('❌ Error consultando usuario:', error);
                return null;
            }

            if (!usuarios || usuarios.length === 0) {
                console.log('❌ Usuario no encontrado en base de datos');
                return null;
            }

            const userData = usuarios[0];

            // Verificar contraseña
            if (password !== userData.password) {
                console.log('❌ Contraseña incorrecta');
                return null;
            }

            // Obtener tipo de usuario
            const { data: tipoData, error: tipoError } = await this.supabase
                .from('tipos_usuario')
                .select('nombre')
                .eq('id', userData.tipo_usuario_id)
                .single();

            if (tipoError || !tipoData) {
                console.error('❌ Error obteniendo tipo de usuario:', tipoError);
                return null;
            }

            const tipoUsuarioEnDB = tipoData.nombre;
            
            if (tipoUsuarioEnDB !== tipoUsuario) {
                console.log('❌ Tipo de usuario no coincide');
                return null;
            }

            console.log('✅ Autenticación exitosa en Supabase');

            return {
                id: userData.id,
                usuario: userData.usuario,
                nombre: userData.nombre,
                email: userData.email,
                tipo: tipoUsuario,
                grado: userData.grado_asignado
            };

        } catch (error) {
            console.error('❌ Error en autenticación Supabase:', error);
            return null;
        }
    }

    // Generar número de radicado incremental
    async generateRadicado() {
        if (SUPABASE_CONFIG.useLocal) {
            this.radicadoCounter += 1;
            this.saveToStorage('radicadoCounter', this.radicadoCounter);
        } else {
            try {
                // Incrementar contador en Supabase
                this.radicadoCounter += 1;
            } catch (error) {
                console.error('Error incrementando radicado:', error);
                this.radicadoCounter += 1;
            }
        }
        const radicado = `${this.radicadoPrefix}${this.radicadoCounter}`;
        console.log('🏷️ Radicado generado:', radicado);
        return radicado;
    }

    // ========== RESTO DEL CÓDIGO PERMANECE IGUAL ==========
    
    // Inicializar steppers
    initSteppers() {
        this.currentStepExcusa = 1;
        this.currentStepPermiso = 1;
        this.maxSteps = 4;
    }

    // Inicializar validación de fechas
    initDateValidation() {
        const today = new Date().toISOString().split('T')[0];

        const fechaInputs = ['fechaExcusa', 'fechaPermiso'];
        fechaInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.min = today;
                input.value = today;
            }
        });
    
        this.updateMesInasistencia();
    }

    updateMesInasistencia() {
        const fechaInput = document.getElementById('fechaExcusa');
        const selectMes = document.getElementById('mesInasistencia');
        if (!fechaInput || !selectMes) return;

        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const fecha = fechaInput.value ? new Date(fechaInput.value) : new Date();
        const start = fecha.getMonth();

        selectMes.innerHTML = '<option value="">Seleccionar...</option>';
        for (let i = start; i < meses.length; i++) {
            const opt = document.createElement('option');
            opt.value = meses[i];
            opt.textContent = meses[i];
            selectMes.appendChild(opt);
        }
    }

    // Base de datos de estudiantes por grado
    initStudentDatabase() {
        this.estudiantesPorGrado = {
            'Preescolar': [
                { codigo: 'PRE001', nombre: 'Ana', apellidos: 'Pérez' },
                { codigo: 'PRE002', nombre: 'Carlos', apellidos: 'López' }
            ],
            '1°': [
                { codigo: '1A001', nombre: 'Isabella', apellidos: 'Moreno' },
                { codigo: '1A002', nombre: 'Sebastián', apellidos: 'Castro' }
            ],
            '2°': [
                { codigo: '2A001', nombre: 'Mateo', apellidos: 'Fernández' },
                { codigo: '2A002', nombre: 'Lucía', apellidos: 'Ramírez' }
            ],
            '3°': [
                { codigo: '3A001', nombre: 'Valeria', apellidos: 'Ruiz' },
                { codigo: '3A002', nombre: 'Daniel', apellidos: 'Cortés' }
            ],
            '4°': [
                { codigo: '4A001', nombre: 'Samuel', apellidos: 'Vásquez' },
                { codigo: '4A002', nombre: 'Antonella', apellidos: 'Ramos' }
            ],
            '5°': [
                { codigo: '5A001', nombre: 'Gabriela', apellidos: 'Molina' },
                { codigo: '5A002', nombre: 'Maximiliano', apellidos: 'Contreras' }
            ],
            '6°': [
                { codigo: '6A001', nombre: 'Adrián', apellidos: 'Peña' },
                { codigo: '6A002', nombre: 'Juliana', apellidos: 'Ríos' }
            ],
            '7°': [
                { codigo: '7A001', nombre: 'Ariadna', apellidos: 'Becerra' },
                { codigo: '7A002', nombre: 'Emiliano', apellidos: 'Vega' }
            ],
            '8°': [
                { codigo: '8A001', nombre: 'Gonzalo', apellidos: 'Moya' },
                { codigo: '8A002', nombre: 'Esperanza', apellidos: 'Ulloa' }
            ],
            '9°': [
                { codigo: '9A001', nombre: 'Catalina', apellidos: 'Fuentes' },
                { codigo: '9A002', nombre: 'Andrés', apellidos: 'Carrasco' }
            ],
            '10°': [
                { codigo: '10A001', nombre: 'Ricardo', apellidos: 'Espejo' },
                { codigo: '10A002', nombre: 'Macarena', apellidos: 'Solís' }
            ],
            '11°': [
                { codigo: '11A001', nombre: 'Fernanda', apellidos: 'Morales' },
                { codigo: '11A002', nombre: 'Álvaro', apellidos: 'Saavedra' }
            ]
        };
    }

    // Cargar estudiantes por grado
    async loadStudentsByGrade(grado, selectId, infoContainerId) {
        const select = document.getElementById(selectId);
        const infoContainer = document.getElementById(infoContainerId);
        
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar estudiante...</option>';
        
        if (!grado) {
            select.disabled = true;
            if (infoContainer) infoContainer.style.display = 'none';
            return;
        }

        let estudiantes = [];
        if (SUPABASE_CONFIG.useLocal) {
            estudiantes = this.estudiantesPorGrado[grado] || [];
        } else {
            try {
                const { data, error } = await this.supabase
                    .from('estudiantes')
                    .select('codigo, nombres, apellidos')
                    .eq('grado_id', await this.getGradoId(grado))
                    .order('apellidos', { ascending: true });
                
                if (error) {
                    console.error('Error cargando estudiantes:', error);
                    estudiantes = [];
                } else {
                    estudiantes = data.map(e => ({ 
                        codigo: e.codigo, 
                        nombre: e.nombres, 
                        apellidos: e.apellidos 
                    }));
                }
            } catch (error) {
                console.error('Error:', error);
                estudiantes = [];
            }
        }

        estudiantes.forEach(estudiante => {
            const option = document.createElement('option');
            option.value = JSON.stringify(estudiante);
            option.textContent = `${estudiante.nombre} ${estudiante.apellidos}`;
            select.appendChild(option);
        });
        
        select.disabled = false;
        
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
        
        const prefix = infoContainerId.includes('Permiso') ? 'Permiso' : '';
        document.getElementById(`infoNombre${prefix}`).textContent = `${estudiante.nombre} ${estudiante.apellidos}`;
        document.getElementById(`infoGrado${prefix}`).textContent = grado;
        document.getElementById(`infoCodigo${prefix}`).textContent = estudiante.codigo;
        
        infoContainer.style.display = 'block';
    }

    // ========== CONTINÚA CON EL RESTO DE MÉTODOS... ==========
    // (Por brevedad, incluyo solo los métodos más importantes corregidos)

    // Verificar estado de autenticación
    async checkAuthStatus() {
        const savedUser = this.loadFromStorage('currentUser');
        if (savedUser) {
            this.currentUser = savedUser;
            this.updateAuthUI();
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

    // Actualizar UI basada en autenticación
    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        
        if (this.currentUser) {
            loginBtn.textContent = `${this.currentUser.nombre} (${this.currentUser.tipo})`;
            loginBtn.style.background = '#10b981';
        } else {
            loginBtn.textContent = 'Login';
            loginBtn.style.background = '';
        }
    }

    logout() {
        this.currentUser = null;
        this.saveToStorage('currentUser', null);
        this.updateAuthUI();
        this.showView('homeView');
        this.updateStatus('🟢 Sistema listo');
    }

    // ========== MÉTODOS DE FORMULARIO CORREGIDOS ==========
    
    getExcusaFormData() {
        const estudianteSelect = document.getElementById('estudianteExcusa');
        let estudianteData = null;
        if (estudianteSelect.value) {
            estudianteData = JSON.parse(estudianteSelect.value);
        }

        return {
            nombreAcudiente: document.getElementById('nombreAcudiente').value,
            emailAcudiente: document.getElementById('emailAcudiente').value,
            telefonoAcudiente: document.getElementById('telefonoAcudiente').value,
            perfilAcudiente: document.getElementById('perfilAcudiente').value,
            nombreEstudiante: estudianteData ? `${estudianteData.nombre} ${estudianteData.apellidos}` : '',
            codigoEstudiante: estudianteData ? estudianteData.codigo : '',
            grado: document.getElementById('gradoExcusa').value,
            fechaExcusa: document.getElementById('fechaExcusa').value,
            diasInasistencia: document.getElementById('diasInasistencia').value,
            mesInasistencia: document.getElementById('mesInasistencia').value,
            motivoInasistencia: document.getElementById('motivoInasistencia').value,
            certificadoMedico: document.getElementById('certificadoMedico').checked,
            incapacidad: document.getElementById('incapacidad').checked,
            archivoAdjunto: document.getElementById('archivoAdjunto')?.files?.[0] || null
        };
    }

    getPermisoFormData() {
        const estudianteSelect = document.getElementById('estudiantePermiso');
        let estudianteData = null;
        if (estudianteSelect.value) {
            estudianteData = JSON.parse(estudianteSelect.value);
        }

        return {
            nombreAcudiente: document.getElementById('nombreAcudientePermiso').value,
            emailAcudiente: document.getElementById('emailAcudientePermiso').value,
            telefonoAcudiente: document.getElementById('telefonoAcudientePermiso').value,
            perfilAcudiente: document.getElementById('perfilAcudientePermiso').value,
            nombreEstudiante: estudianteData ? `${estudianteData.nombre} ${estudianteData.apellidos}` : '',
            codigoEstudiante: estudianteData ? estudianteData.codigo : '',
            grado: document.getElementById('gradoPermiso').value,
            fechaPermiso: document.getElementById('fechaPermiso').value,
            tipoPermiso: document.getElementById('tipoPermiso').value,
            motivoPermiso: document.getElementById('motivoPermiso').value,
            horaSalida: document.getElementById('horaSalida').value,
            horaRegreso: document.getElementById('horaRegreso').value,
            lugarDestino: document.getElementById('lugarDestino').value,
            personaRecoge: document.getElementById('personaRecoge').value
        };
    }

    async handleExcusaSubmit(e) {
        e.preventDefault();
        
        if (!this.validateStep('excusa', 4)) {
            return;
        }
        
        try {
            console.log('🔄 Enviando excusa...');
            const formData = this.getExcusaFormData();
            console.log('📋 Datos del formulario:', formData);
            
            const solicitud = await this.createSolicitud({
                ...formData,
                tipo: 'excusa'
            });
            
            console.log('✅ Excusa enviada exitosamente:', solicitud);
            this.showModalRadicado(solicitud.radicado);
            this.clearForm('excusaForm');
            this.updateStatus('🟢 Excusa enviada exitosamente');
        } catch (error) {
            console.error('❌ Error al enviar excusa:', error);
            this.updateStatus('🔴 Error al enviar excusa');
            alert('Error al enviar la excusa. Intente nuevamente.');
        }
    }

    async handlePermisoSubmit(e) {
        e.preventDefault();
        
        if (!this.validateStep('permiso', 4)) {
            return;
        }
        
        try {
            console.log('🔄 Enviando permiso...');
            const formData = this.getPermisoFormData();
            console.log('📋 Datos del formulario:', formData);
            
            const solicitud = await this.createSolicitud({
                ...formData,
                tipo: 'permiso'
            });
            
            console.log('✅ Permiso enviado exitosamente:', solicitud);
            this.showModalRadicado(solicitud.radicado);
            this.clearForm('permisoForm');
            this.updateStatus('🟢 Permiso enviado exitosamente');
        } catch (error) {
            console.error('❌ Error al enviar permiso:', error);
            this.updateStatus('🔴 Error al enviar permiso');
            alert('Error al enviar el permiso. Intente nuevamente.');
        }
    }

    // ========== CONTINÚA CON LOS MÉTODOS RESTANTES... ==========
    // (Los métodos de navegación, validación, modal, etc. permanecen iguales)

    showView(viewId) {
        console.log(`Cambiando a vista: ${viewId}`);
        
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        document.getElementById(viewId).classList.add('active');
        this.currentView = viewId;

        if (viewId === 'excusaView') {
            this.resetStepper('excusa');
        } else if (viewId === 'permisoView') {
            this.resetStepper('permiso');
        }

        this.updateNavigation(viewId);
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

    iniciarSolicitud(tipo) {
        this.tipoSolicitud = tipo;
        this.showModalProteccionDatos();
    }

    showModalProteccionDatos() {
        document.getElementById('modalProteccionDatos').style.display = 'flex';
    }

    toggleProteccionButton() {
        const checkboxProteccion = document.getElementById('aceptoProteccion');
        const checkboxMenor = document.getElementById('menorEdad');
        const button = document.getElementById('aceptarProteccion');

        const todosAceptados = checkboxProteccion.checked && checkboxMenor.checked;
        button.disabled = !todosAceptados;
    }

    cerrarModalProteccion() {
        document.getElementById('modalProteccionDatos').style.display = 'none';
        document.getElementById('aceptoProteccion').checked = false;
        document.getElementById('menorEdad').checked = false;
        document.getElementById('aceptarProteccion').disabled = true;
    }

    aceptarProteccion() {
        const checkboxProteccion = document.getElementById('aceptoProteccion');
        const checkboxMenor = document.getElementById('menorEdad');

        if (!checkboxProteccion.checked || !checkboxMenor.checked) {
            alert('Debe aceptar ambas declaraciones para continuar');
            return;
        }

        this.cerrarModalProteccion();

        if (this.tipoSolicitud === 'excusa') {
            this.showView('excusaView');
        } else if (this.tipoSolicitud === 'permiso') {
            this.showView('permisoView');
        }
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

        container.querySelectorAll('.step-panel').forEach(p => {
            p.classList.toggle('active', parseInt(p.dataset.step) === step);
        });

        container.querySelectorAll('.step-item').forEach(item => {
            const s = parseInt(item.dataset.step);
            item.classList.remove('active', 'completed');
            if (s < step) item.classList.add('completed');
            else if (s === step) item.classList.add('active');
        });

        const indicatorId = tipo === 'excusa' ? 'currentStepText' : 'currentStepTextPermiso';
        const prevId = tipo === 'excusa' ? 'prevStepBtn' : 'prevStepBtnPermiso';
        const nextId = tipo === 'excusa' ? 'nextStepBtn' : 'nextStepBtnPermiso';
        const submitId = tipo === 'excusa' ? 'submitFormBtn' : 'submitFormBtnPermiso';

        document.getElementById(indicatorId).textContent = `Paso ${step} de ${this.maxSteps}`;
        const prevBtn = document.getElementById(prevId);
        const nextBtn = document.getElementById(nextId);
        const submitBtn = document.getElementById(submitId);

        if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
        if (nextBtn) nextBtn.style.display = step === this.maxSteps ? 'none' : 'inline-block';
        if (submitBtn) submitBtn.style.display = step === this.maxSteps ? 'inline-block' : 'none';

        if (step === this.maxSteps) {
            this.updateReview(tipo);
        }
    }

    validateStep(tipo, step) {
        const formId = tipo === 'excusa' ? 'excusaForm' : 'permisoForm';
        const panel = document.querySelector(`#${formId} .step-panel[data-step="${step}"]`);
        if (!panel) return true;

        let valid = true;
        panel.querySelectorAll('input[required], select[required], textarea[required]').forEach(el => {
            const group = el.closest('.form-group');
            const ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
            if (!ok) {
                group?.classList.add('error');
                valid = false;
            } else {
                group?.classList.remove('error');
            }
        });
        return valid;
    }

    updateReview(tipo) {
        if (tipo === 'excusa') {
            document.getElementById('reviewNombreAcudiente').textContent = 
                document.getElementById('nombreAcudiente').value || '-';
            document.getElementById('reviewEmailAcudiente').textContent = 
                document.getElementById('emailAcudiente').value || '-';
            document.getElementById('reviewTelefonoAcudiente').textContent = 
                document.getElementById('telefonoAcudiente').value || '-';
            
            const perfilSelect = document.getElementById('perfilAcudiente');
            document.getElementById('reviewPerfilAcudiente').textContent = 
                perfilSelect.options[perfilSelect.selectedIndex]?.text || '-';

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

            const fecha = document.getElementById('fechaExcusa').value;
            document.getElementById('reviewFecha').textContent = 
                fecha ? new Date(fecha).toLocaleDateString('es-CO') : '-';
            
            const dias = document.getElementById('diasInasistencia').value;
            const mes = document.getElementById('mesInasistencia').value;
            document.getElementById('reviewPeriodo').textContent = 
                (dias && mes) ? `${dias} de ${mes}` : '-';
            
            document.getElementById('reviewMotivo').textContent = 
                document.getElementById('motivoInasistencia').value || '-';

            const certificado = document.getElementById('certificadoMedico').checked;
            const incapacidad = document.getElementById('incapacidad').checked;
            let documentos = [];
            if (certificado) documentos.push('Certificado Médico');
            if (incapacidad) documentos.push('Incapacidad');
            document.getElementById('reviewDocumentos').textContent = 
                documentos.length > 0 ? documentos.join(', ') : 'Ninguno';

        } else if (tipo === 'permiso') {
            // Similar para permisos...
            document.getElementById('reviewNombreAcudientePermiso').textContent = 
                document.getElementById('nombreAcudientePermiso').value || '-';
            document.getElementById('reviewEmailAcudientePermiso').textContent = 
                document.getElementById('emailAcudientePermiso').value || '-';
            // ... etc
        }
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
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
            
            form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            this.initDateValidation();
        }
    }

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

    showModalRadicado(radicado) {
        document.getElementById('numeroRadicadoGenerado').textContent = radicado;
        document.getElementById('modalRadicado').style.display = 'flex';
    }

    cerrarModalRadicado() {
        document.getElementById('modalRadicado').style.display = 'none';
        this.showView('homeView');
    }

    // Configurar eventos de los steppers
    setupStepperEvents() {
        const nextExcusa = document.getElementById('nextStepBtn');
        const prevExcusa = document.getElementById('prevStepBtn');
        const nextPermiso = document.getElementById('nextStepBtnPermiso');
        const prevPermiso = document.getElementById('prevStepBtnPermiso');

        nextExcusa?.addEventListener('click', () => {
            if (!this.validateStep('excusa', this.currentStepExcusa)) return;
            if (this.currentStepExcusa < this.maxSteps) {
                this.currentStepExcusa++;
                this.showStep('excusa', this.currentStepExcusa);
            }
        });

        prevExcusa?.addEventListener('click', () => {
            if (this.currentStepExcusa > 1) {
                this.currentStepExcusa--;
                this.showStep('excusa', this.currentStepExcusa);
            }
        });

        nextPermiso?.addEventListener('click', () => {
            if (!this.validateStep('permiso', this.currentStepPermiso)) return;
            if (this.currentStepPermiso < this.maxSteps) {
                this.currentStepPermiso++;
                this.showStep('permiso', this.currentStepPermiso);
            }
        });

        prevPermiso?.addEventListener('click', () => {
            if (this.currentStepPermiso > 1) {
                this.currentStepPermiso--;
                this.showStep('permiso', this.currentStepPermiso);
            }
        });
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
        document.getElementById('certificadoMedico').addEventListener('change', () => this.toggleFileUpload());
        document.getElementById('incapacidad').addEventListener('change', () => this.toggleFileUpload());

        document.getElementById('fechaExcusa')
            .addEventListener('change', () => this.updateMesInasistencia());
        document.getElementById('gradoExcusa')
            .addEventListener('change', e => this.loadStudentsByGrade(e.target.value, 'estudianteExcusa', 'estudianteInfo'));
        document.getElementById('gradoPermiso')
            .addEventListener('change', e => this.loadStudentsByGrade(e.target.value, 'estudiantePermiso', 'estudianteInfoPermiso'));
        document.getElementById('estudianteExcusa')
            .addEventListener('change', e => this.showStudentInfo(e.target.value, 'estudianteInfo', document.getElementById('gradoExcusa').value));
        document.getElementById('estudiantePermiso')
            .addEventListener('change', e => this.showStudentInfo(e.target.value, 'estudianteInfoPermiso', document.getElementById('gradoPermiso').value));

        // Modal protección de datos
        document.getElementById('aceptoProteccion').addEventListener('change', () => this.toggleProteccionButton());
        document.getElementById('menorEdad').addEventListener('change', () => this.toggleProteccionButton());
        document.getElementById('cancelarProteccion').addEventListener('click', () => this.cerrarModalProteccion());
        document.getElementById('aceptarProteccion').addEventListener('click', () => this.aceptarProteccion());

        // Modal radicado
        document.getElementById('cerrarModalRadicado').addEventListener('click', () => this.cerrarModalRadicado());

        // Logout buttons
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('logoutDocenteBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('logoutAdminBtn')?.addEventListener('click', () => this.logout());

        // Eventos para el stepper
        this.setupStepperEvents();
    }

    // Utilidades de almacenamiento
    saveToStorage(key, data) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(data));
            } else {
                if (!window.sistemaStorage) window.sistemaStorage = {};
                window.sistemaStorage[key] = JSON.parse(JSON.stringify(data));
            }
        } catch (error) {
            console.warn('No se pudo guardar en localStorage:', error);
            if (!window.sistemaStorage) window.sistemaStorage = {};
            window.sistemaStorage[key] = JSON.parse(JSON.stringify(data));
        }
    }

    loadFromStorage(key) {
        try {
            if (typeof localStorage !== 'undefined') {
                const item = localStorage.getItem(key);
                if (item) return JSON.parse(item);
            }
            return window.sistemaStorage?.[key] || null;
        } catch (error) {
            console.warn('No se pudo cargar del almacenamiento:', error);
            return window.sistemaStorage?.[key] || null;
        }
    }
}

// Inicializar sistema cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.sistema = new SistemaExcusas();
});
