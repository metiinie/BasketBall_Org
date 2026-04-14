const supabaseUrl = 'https://ydamkxbjjquthugpxeia.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYW1reGJqanF1dGh1Z3B4ZWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzE4NTYsImV4cCI6MjA5MTY0Nzg1Nn0.7fkA2SKntbW5dG7MxowRDhqpJMRPbJBD3Yys5S8vzs8'

const teamMapping = {
  'ሀዋሳ ከተማ': 'Hawassa City',
  'ወልቂጤ ከተማ': 'Welkite City',
  'ፋሲል ከነማ': 'Fasil Kenema',
  'ኢትዮጵያ ስፖርት አካዳሚ': 'Ethiopian Sports Academy',
  'ጋምቤላ ከተማ': 'Gambella City',
  'ሸገር ከተማ': 'Sheger City',
  'ባህርዳር ከተማ': 'Bahir Dar City'
};

async function migrate() {
    console.log('Starting DB migration: Adding name_en to teams...');
    
    // Step 1: Fetch all teams
    const resp = await fetch(`${supabaseUrl}/rest/v1/teams?select=id,name`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    const teams = await resp.json();
    console.log(`Found ${teams.length} teams.`);

    // Step 2: Update each team with English name
    for (const team of teams) {
        const nameEn = teamMapping[team.name] || team.name; // Fallback to original if no mapping
        console.log(`Updating ${team.name} -> ${nameEn}`);
        
        const updateResp = await fetch(`${supabaseUrl}/rest/v1/teams?id=eq.${team.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ name_en: nameEn })
        });

        if (!updateResp.ok) {
            const err = await updateResp.text();
            console.error(`Failed to update ${team.name}:`, err);
        } else {
            console.log(`Successfully updated ${team.name}`);
        }
    }
    console.log('Migration complete.');
}

migrate();
