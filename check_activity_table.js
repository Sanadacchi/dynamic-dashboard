import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .limit(1);

  if (error) {
    console.log('activity_log table error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('CRITICAL: activity_log table MISSING from Supabase.');
    }
  } else {
    console.log('activity_log table EXISTS.');
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}

checkTable();
