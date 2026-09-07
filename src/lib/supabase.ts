// Supabase 数据库客户端
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Vite 会从 .env（VITE_ 前缀）注入这些变量到 import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // 未配置时给出明确错误，避免静默使用空连接
  throw new Error(
    '缺少 Supabase 连接配置：请在 .env 中设置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY',
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export default supabase;