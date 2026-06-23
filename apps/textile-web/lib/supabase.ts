import { createClient } from '@supabase/supabase-js'

// Supabase client for browser-side operations
// Used for file uploads to Supabase Storage

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
