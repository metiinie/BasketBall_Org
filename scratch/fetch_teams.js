const supabaseUrl = 'https://ydamkxbjjquthugpxeia.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYW1reGJqanF1dGh1Z3B4ZWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzE4NTYsImV4cCI6MjA5MTY0Nzg1Nn0.7fkA2SKntbW5dG7MxowRDhqpJMRPbJBD3Yys5S8vzs8'

async function getTeams() {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/teams?select=id,name,gender`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        })
        const data = await response.json()
        console.log(JSON.stringify(data, null, 2))
    } catch (e) {
        console.error(e)
    }
}
getTeams()
