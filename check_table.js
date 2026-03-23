import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTable() {
  const { data, error } = await supabase.from('api_keys').select('count', { count: 'exact', head: true });
  if (error) {
    console.log('api_keys table does not exist or error:', error.message);
  } else {
    console.log('api_keys table exists!');
  }
}

checkTable();
