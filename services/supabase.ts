import { createClient } from '@supabase/supabase-js';

// Switched to Vite's standard `import.meta.env` for accessing environment variables.
// This is more robust and idiomatic for Vite projects deployed on platforms like Vercel.
// FIX: Switched to process.env to resolve TypeScript errors with import.meta.env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase config is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Vercel environment variables.");
}

// The createClient function will throw a descriptive error if the URL is missing.
// Using an empty string fallback to prevent build errors, but the runtime error is what we want if vars are missing.
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");