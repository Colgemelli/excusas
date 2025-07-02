// ========== CONFIGURACIÓN DE SUPABASE ==========
// env.js - Variables de entorno para el sistema de excusas

// ========== IMPORTANTE: REEMPLAZA ESTOS VALORES ==========
// Sustituye las URLs y claves por las reales de tu proyecto Supabase

window.process = window.process || {};
window.process.env = window.process.env || {};

// ========== CONFIGURACIÓN SUPABASE ==========
// Ve a https://supabase.com -> Tu proyecto -> Settings -> API
// Copia la URL del proyecto y la clave pública (anon key)

window.process.env.SUPABASE_URL = 'https://zkbnpjmtwkhcvqizpmhj.supabase.co';
window.process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprYm5wam10d2toY3ZxaXpwbWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTQyNDksImV4cCI6MjA2NjczMDI0OX0.McMyTT8-Myp6L0nIjTN4chedAPunB0dwymQKhiNp6uI';

// ========== EJEMPLO DE CONFIGURACIÓN ==========
// window.process.env.SUPABASE_URL = 'https://tuproyecto.supabase.co';
// window.process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ========== CONFIGURACIÓN DE DESARROLLO ==========
// Para usar datos locales durante desarrollo, cambia a true
// Para usar Supabase, cambia a false
window.SUPABASE_LOCAL_MODE = false; // ← Cambia según necesites

// ========== DEBUG ==========
console.log('🔧 Variables de entorno cargadas:', {
    supabaseUrl: window.process.env.SUPABASE_URL ? '✅ Configurada' : '❌ Falta configurar',
    supabaseKey: window.process.env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Falta configurar',
    localMode: window.SUPABASE_LOCAL_MODE ? '🏠 Modo local' : '☁️ Modo Supabase'
});

// ========== VERIFICACIÓN ==========
if (!window.process.env.SUPABASE_URL || !window.process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️ CONFIGURACIÓN INCOMPLETA: Faltan variables de Supabase');
    console.log('📚 Para configurar:');
    console.log('1. Ve a https://supabase.com');
    console.log('2. Abre tu proyecto');
    console.log('3. Ve a Settings > API');
    console.log('4. Copia la URL y la anon key');
    console.log('5. Reemplaza los valores en este archivo (env.js)');
}

// ========== CONFIGURACIÓN ADICIONAL ==========
window.APP_CONFIG = {
    // Nombre de la aplicación
    appName: 'Sistema de Excusas - Colegio Gemelli',
    
    // Versión
    version: '1.0.0',
    
    // Configuración de desarrollo
    debug: true, // Cambia a false en producción
    
    // Configuración de carga de archivos
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
    
    // Configuración de radicados
    radicadoPrefix: 'RAD-',
    radicadoStart: 1000
};

// ========== FUNCIONES DE UTILIDAD ==========
window.checkSupabaseConnection = async function() {
    if (!window.process.env.SUPABASE_URL || !window.process.env.SUPABASE_ANON_KEY) {
        console.error('❌ Variables de Supabase no configuradas');
        return false;
    }
    
    try {
        const response = await fetch(`${window.process.env.SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': window.process.env.SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Conexión a Supabase exitosa');
            return true;
        } else {
            console.error('❌ Error de conexión a Supabase:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ No se pudo conectar a Supabase:', error);
        return false;
    }
};

// ========== INSTRUCCIONES DE CONFIGURACIÓN ==========
/*
PASOS PARA CONFIGURAR SUPABASE:

1. CREAR PROYECTO EN SUPABASE:
   - Ve a https://supabase.com
   - Crea una cuenta o inicia sesión
   - Crea un nuevo proyecto
   - Espera a que se complete la configuración

2. OBTENER CREDENCIALES:
   - En tu proyecto, ve a Settings > API
   - Copia la "Project URL"
   - Copia la "anon public" key

3. CONFIGURAR ESTE ARCHIVO:
   - Reemplaza 'TU_SUPABASE_URL_AQUI' con tu Project URL
   - Reemplaza 'TU_SUPABASE_ANON_KEY_AQUI' con tu anon key

4. CONFIGURAR BASE DE DATOS:
   - Ejecuta el archivo schema.sql en tu base de datos Supabase
   - Ve a Table Editor y verifica que las tablas se crearon
   - Ve a Authentication > Users y crea usuarios de prueba

5. CONFIGURAR RLS (Row Level Security):
   - Ve a Authentication > Policies
   - Configura las políticas según el esquema

EJEMPLO DE CONFIGURACIÓN:
window.process.env.SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
window.process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNTc3NzI0MCwiZXhwIjoxOTUxMzUzMjQwfQ.example_key_here';

USUARIOS DE PRUEBA RECOMENDADOS:
- Admin: usuario='admin', contraseña='admin123', tipo='admin'
- Coordinador: usuario='coord1', contraseña='coord123', tipo='coordinador'
- Docente: usuario='doc1', contraseña='doc123', tipo='docente'
*/
