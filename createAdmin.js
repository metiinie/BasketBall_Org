import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Error] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment. Copy .env.example to .env and fill in your values.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('[Error] Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment.')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('[Error] ADMIN_PASSWORD must be at least 8 characters.')
    process.exit(1)
  }

  console.log(`[Auth Setup] Creating admin officer: ${email}...`)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('already registered')) {
      console.log(`[Success] User ${email} is already registered. You can log in immediately.`)
    } else {
      console.error('[Error]', error.message)
    }
  } else {
    console.log(`[Success] User ${email} created successfully!`)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      console.log('[Info] Note: This email was previously registered or might flag an identity conflict, but signup processed.')
    }
    console.log('[Info] Try logging in at http://localhost:5173/login')
  }
}

createAdmin()
