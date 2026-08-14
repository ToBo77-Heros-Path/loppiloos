import { createClient } from '@supabase/supabase-js';
import { MenuItem } from '@/types/database';

const getValidUrl = (url?: string) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  return 'https://placeholder.supabase.co';
};

const supabaseUrl = getValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    (process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http://') || process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  );
};
