import { createServerClient } from '@supabase/ssr';
import { cookies } from "next/headers";
import type { Database } from './types';

export function createSupabaseServer() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies }
  );
}
