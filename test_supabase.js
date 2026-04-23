import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Error] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment. Copy .env.example to .env and fill in your values.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('matches').select('venue').limit(1)
  if (error) {
    console.error("ERROR:", error.message)
    process.exit(1)
  }
  console.log("SUCCESS, data:", data)
}
test()
