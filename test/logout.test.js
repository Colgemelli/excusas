import assert from 'assert';

// Stub DOM
global.document = {
  getElementById: () => ({ style: {} }),
  querySelector: () => ({ style: {} }),
  querySelectorAll: () => [{ style: {} }],
  addEventListener: () => {},
};

global.alert = (msg) => { global.__alertMessage = msg; };

let supabaseClient = {
  auth: {
    signOut: async () => ({ error: null }),
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => {},
  },
};
global.supabase = supabaseClient;
global.window = { supabase: { createClient: () => supabaseClient } };

let logout;

// Dynamically import app.js after stubs are set up
const appModulePromise = import('../app.js').then(mod => {
  logout = mod.logout;
});

async function testErrorDisplayed() {
  global.__alertMessage = null;
  supabaseClient.auth.signOut = async () => ({ error: { message: 'fail' } });
  await logout();
  assert.strictEqual(global.__alertMessage, 'Error al cerrar sesión: fail');
  console.log('logout shows alert on error: ok');
}

async function testNoAlertOnSuccess() {
  global.__alertMessage = null;
  supabaseClient.auth.signOut = async () => ({ error: null });
  await logout();
  assert.strictEqual(global.__alertMessage, null);
  console.log('logout without error: ok');
}

(async () => {
  await appModulePromise; // ensure module loaded
  await testErrorDisplayed();
  await testNoAlertOnSuccess();
})();
