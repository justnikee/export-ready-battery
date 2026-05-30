import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during build-time when env vars are not available.
    // This allows Next.js to statically analyze the module without crashing.
    // Runtime calls will fail gracefully if env vars are still missing.
    return createClient('http://localhost:54321', 'dummy-key')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = getSupabaseClient()
