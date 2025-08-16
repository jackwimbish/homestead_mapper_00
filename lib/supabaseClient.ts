import { createClient } from '@supabase/supabase-js'

// These variables are validated to exist by the logic below.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in .env.local')
}

// Create a single, shared Supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey)