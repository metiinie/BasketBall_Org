import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Try to read .env if it exists
let supabaseUrl = ''
let supabaseKey = ''

const envPath = 'c:/Users/hp/Desktop/Qelem_Real/Basketball_Tracking_Magt/.env'
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8')
  supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]
  supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]
}

if (!supabaseUrl || !supabaseKey) {
    // Fallback if env check fails - try to find it in supabase.js
    console.log("Could not find env vars, check src/lib/supabase.js")
} else {
    const supabase = createClient(supabaseUrl, supabaseKey)
    async function getTeams() {
        const { data, error } = await supabase.from('teams').select('id, name, gender')
        if (error) console.error(error)
        else console.log(JSON.stringify(data, null, 2))
    }
    getTeams()
}
