import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ydamkxbjjquthugpxeia.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYW1reGJqanF1dGh1Z3B4ZWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzE4NTYsImV4cCI6MjA5MTY0Nzg1Nn0.7fkA2SKntbW5dG7MxowRDhqpJMRPbJBD3Yys5S8vzs8'

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
