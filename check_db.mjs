import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SUPABASE_URL = 'https://mthjhhebmruiihzznenr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aGpoaGVibXJ1aWloenpuZW5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY2NjgzNCwiZXhwIjoyMDkzMjQyODM0fQ.-oBqkphgn-5LTXGvU55a_5KvW-q68EGAsFpD5UA2t1I';

async function checkTables() {
  // Let's do a simple REST API call to check if 'profiles' exists
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
    method: 'GET',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });

  console.log(`Status: ${response.status}`);
  const text = await response.text();
  console.log(`Response: ${text}`);
}

checkTables().catch(console.error);
