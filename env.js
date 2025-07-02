// ========== CONFIGURACIÓN DE VARIABLES DE ENTORNO CORREGIDA ==========
// env.js - Variables de entorno para el sistema de excusas

// ========== CONFIGURACIÓN SUPABASE ==========
// Reemplaza con tus credenciales reales de Supabase cuando estés listo para producción

window.process = window.process || {};
window.process.env = window.process.env || {};

// ========== CREDENCIALES DE SUPABASE (ACTUALIZA ESTOS VALORES) ==========
window.process.env.SUPABASE_URL = 'https://zkbnpjmtwkhcvqizpmhj.supabase.co';
window.process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYm5wam10d2toY3ZxaXpwbWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTQyNDksImV4cCI6MjA2NjczMDI0OX0.McMyTT8-Myp6L0nIjTN4chedAPunB0dwymQKhiNp6uI';

// ========== CONFIGURACIÓN DE DESARROLLO ==========
// IMPORTANTE: El sistema está configurado para usar modo LOCAL por defecto
// Esto significa que funcionará sin Supabase para pruebas
window.SUPABASE_LOCAL_MODE = true; // ← true = modo local, false = usar Supabase

// ========== CONFIGURACIÓN DE LA APLICACIÓN ==========
window.APP_CONFIG = {
    // Información del colegio
    nombreColegio: 'Colegio Franciscano Agustín Gemelli',
    version: '1.0.0',
    
    // Configuración de desarrollo
    debug: true, // Mostrar logs detallados en consola
    
    // Configuración de archivos
    maxFileSize: 5 * 1024 * 1024, // 5MB máximo
    allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
    
    // Configuración de radicados
    radicadoPrefix: 'RAD-',
    radicadoStart: 1000,
    
    // Usuarios de prueba para desarrollo
    testUsers: {
        admin: { usuario: 'admin', password: 'admin123', tipo: 'admin' },
        coordinador: { usuario: 'coord1', password: 'coord123', tipo: 'coordinador' },
        docente: { usuario: 'doc1', password: 'doc123', tipo: 'docente' }
    }
};

// ========== VALIDACIÓN Y DEBUG ==========
console.log('🔧 Configuración de entorno cargada:', {
    supabaseUrl: window.process.env.SUPABASE_URL ? '✅ Configurada' : '❌ Falta configurar',
    supabaseKey: window.process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Falta configurar',
    modoLocal: window.SUPABASE_LOCAL_MODE ? '🏠 Modo LOCAL activado' : '☁️ Modo SUPABASE activado',
    debug: window.APP_CONFIG.debug ? '🐛 Debug ACTIVADO' : '🔇 Debug desactivado'
});

// ========== FUNCIÓN DE DIAGNÓSTICO ==========
window.diagnosticarSistema = function() {
    console.log('🩺 DIAGNÓSTICO DEL SISTEMA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Verificar variables de entorno
    console.log('📊 Variables de entorno:');
    console.log('  - SUPABASE_URL:', window.process.env.SUPABASE_URL ? '✅' : '❌');
    console.log('  - SUPABASE_ANON_KEY:', window.process.env.SUPABASE_ANON_KEY ? '✅' : '❌');
    console.log('  - Modo local:', window.SUPABASE_LOCAL_MODE ? '✅ Activado' : '❌ Desactivado');
    
    // Verificar elementos DOM críticos
    console.log('🔍 Elementos DOM críticos:');
    const elementosCriticos = [
        'excusaForm', 'permisoForm', 'loginForm', 
        'statusText', 'modalProteccionDatos', 'modalRadicado'
    ];
    
    elementosCriticos.forEach(id => {
        const elemento = document.getElementById(id);
        console.log(`  - ${id}:`, elemento ? '✅' : '❌');
    });
    
    // Verificar sistema de almacenamiento
    console.log('💾 Sistema de almacenamiento:');
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('  - localStorage: ✅');
    } catch(e) {
        console.log('  - localStorage: ❌', e.message);
    }
    
    // Verificar usuarios de prueba
    console.log('👤 Usuarios de prueba disponibles:');
    Object.entries(window.APP_CONFIG.testUsers).forEach(([tipo, datos]) => {
        console.log(`  - ${tipo}: ${datos.usuario}/${datos.password}`);
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Diagnóstico completado');
};

// ========== INSTRUCCIONES DE USO ==========
console.log(`
🎯 INSTRUCCIONES DE USO DEL SISTEMA:

1. 📝 CREAR EXCUSA O PERMISO:
   - Ir a inicio y hacer clic en "Solicitar Excusa" o "Solicitar Permiso"
   - Aceptar política de datos
   - Completar formulario paso a paso
   - Obtener número de radicado

2. 🔐 ACCESO ADMINISTRATIVO:
   - Hacer clic en "Login"
   - Usar credenciales de prueba:
     * Admin: admin/admin123
     * Coordinador: coord1/coord123  
     * Docente: doc1/doc123

3. 🔍 CONSULTAR SOLICITUD:
   - Hacer clic en "Consultar Radicado"
   - Introducir número de radicado (ej: RAD-1001)

4. 🐛 DIAGNOSTICAR PROBLEMAS:
   - Abrir consola del navegador (F12)
   - Ejecutar: diagnosticarSistema()

📞 Si necesitas ayuda adicional, revisa la consola del navegador para logs detallados.
`);

// ========== CONFIGURACIÓN AUTOMÁTICA ==========
// Verificar si estamos en desarrollo local
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.SUPABASE_LOCAL_MODE = true;
    console.log('🏠 Modo local detectado automáticamente');
}

// ========== EXPORTAR CONFIGURACIÓN ==========
window.ENV_CONFIG = {
    supabaseUrl: window.process.env.SUPABASE_URL,
    supabaseKey: window.process.env.SUPABASE_ANON_KEY,
    localMode: window.SUPABASE_LOCAL_MODE,
    appConfig: window.APP_CONFIG
};
