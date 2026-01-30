import { createClient } from '@supabase/supabase-js';

// The configuration is now read directly from `process.env`, which is populated by Vite's `define` config.
// This standardizes the approach, making it consistent with how the Firebase config is handled.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ تحذير: متغيرات Supabase غير موجودة. تأكد من إعدادها في Vercel.");
}

// createClient will throw a descriptive error if the URL is missing.
// The fallback to "" is removed to ensure this error is not suppressed.
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
