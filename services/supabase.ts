
import { createClient } from '@supabase/supabase-js';

// استرجاع القيم من متغيرات البيئة
// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ تحذير: متغيرات Supabase غير موجودة في ملف .env");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
