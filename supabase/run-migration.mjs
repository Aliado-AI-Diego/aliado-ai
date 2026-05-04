// Script to run SQL migrations against Supabase
// Usage: node supabase/run-migration.mjs

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://mthjhhebmruiihzznenr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aGpoaGVibXJ1aWloenpuZW5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzY2NjgzNCwiZXhwIjoyMDkzMjQyODM0fQ.-oBqkphgn-5LTXGvU55a_5KvW-q68EGAsFpD5UA2t1I';

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  // Try the postgres query endpoint instead
  const pgResponse = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  return { status: pgResponse.status, text: await pgResponse.text() };
}

async function main() {
  const files = [
    'migrations/001_initial_schema.sql',
    'migrations/002_vector_search_function.sql',
  ];

  for (const file of files) {
    const sql = readFileSync(join(__dirname, file), 'utf-8');
    console.log(`Running ${file}...`);
    const result = await runSQL(sql);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response: ${result.text.substring(0, 200)}`);
  }
}

main().catch(console.error);
