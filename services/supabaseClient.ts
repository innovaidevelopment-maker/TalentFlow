// @ts-ignore
const { createClient } = window.supabase;

// --- ¡IMPORTANTE! ---
// Estas variables deben ser configuradas en tu entorno de despliegue (ej. Vercel, Netlify).
// Se accede de forma segura para evitar errores si `process.env` no existe en el navegador.
// Vercel a menudo usa el prefijo NEXT_PUBLIC_ para las variables de entorno del lado del cliente.
const supabaseUrl: string | undefined = (typeof process !== 'undefined' && process.env)
    ? (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
    : undefined;
const supabaseAnonKey: string | undefined = (typeof process !== 'undefined' && process.env)
    ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
    : undefined;

let supabase;
export let isSupabaseConfigured = true;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("ADVERTENCIA: Las variables de entorno de Supabase (SUPABASE_URL, SUPABASE_ANON_KEY) no están configuradas. La aplicación se ejecutará en modo de demostración solo local. La autenticación real no funcionará.");
    
    isSupabaseConfigured = false;
    
    // Asigna un cliente falso para evitar que el resto del código falle al intentar usar `supabase`.
    supabase = { 
        auth: { 
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signInWithPassword: () => Promise.resolve({ data: { session: null }, error: { message: "Supabase not configured." } }),
            signOut: () => Promise.resolve({ error: null }),
            signUp: () => Promise.resolve({ data: { user: null }, error: { message: "Supabase not configured." } }),
        } 
    };
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
