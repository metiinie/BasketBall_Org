const supabaseUrl = 'https://ydamkxbjjquthugpxeia.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYW1reGJqanF1dGh1Z3B4ZWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzE4NTYsImV4cCI6MjA5MTY0Nzg1Nn0.7fkA2SKntbW5dG7MxowRDhqpJMRPbJBD3Yys5S8vzs8'

const logoMapping = [
  { name: 'ሀዋሳ ከተማ', logo: '/logos/hawassa.png' },
  { name: 'ወልቂጤ ከተማ', logo: '/logos/welkite.png' },
  { name: 'ፋሲል ከነማ', logo: '/logos/fasil.png' },
  { name: 'ኢትዮጵያ ስፖርት አካዳሚ', logo: '/logos/academy.png' },
  { name: 'ጋምቤላ ከተማ', logo: '/logos/gambella.png' },
  { name: 'ባህርዳር ከተማ', logo: '/logos/bahirdar.png' },
  { name: 'ሸገር ከተማ', logo: '/logos/sheger.png' }
];

async function updateLogos() {
  console.log('Starting logo batch update...');
  
  for (const item of logoMapping) {
    console.log(`Updating teams matching: ${item.name} -> ${item.logo}`);
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/teams?name=eq.${item.name}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ logo_url: item.logo })
      });
      
      if (response.ok) {
        console.log(`Successfully updated ${item.name}`);
      } else {
        const error = await response.text();
        console.error(`Failed to update ${item.name}:`, error);
      }
    } catch (e) {
      console.error(`Error updating ${item.name}:`, e.message);
    }
  }
  
  console.log('Update complete.');
}

updateLogos();
