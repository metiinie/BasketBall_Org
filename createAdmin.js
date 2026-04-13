import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydamkxbjjquthugpxeia.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYW1reGJqanF1dGh1Z3B4ZWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzE4NTYsImV4cCI6MjA5MTY0Nzg1Nn0.7fkA2SKntbW5dG7MxowRDhqpJMRPbJBD3Yys5S8vzs8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdmin() {
  const email = 'oriontheman1828@gmail.com'
  const password = '123456' // Must be at least 6 characters in Supabase

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
