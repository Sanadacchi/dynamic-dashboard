
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try to find .env file
const envPath = path.resolve(process.cwd(), '.env');
const envLocalPath = path.resolve(process.cwd(), '.env.local');
let envFile = envPath;
if (fs.existsSync(envLocalPath)) envFile = envLocalPath;

dotenv.config({ path: envFile });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env or .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking social_posts table...');
  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching from social_posts:', error.message);
    if (error.message.includes('column "liked_by" does not exist')) {
        console.log('CRITICAL: liked_by column is missing!');
    }
    if (error.message.includes('column "comments" does not exist')) {
        console.log('CRITICAL: comments column is missing!');
    }
  } else {
    console.log('Table fetch successful.');
    console.log('Columns found in first row:', Object.keys(data[0] || {}));
  }
}

checkSchema();
