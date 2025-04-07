// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', { 
    urlExists: !!supabaseUrl, 
    keyExists: !!supabaseKey 
  })
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
)