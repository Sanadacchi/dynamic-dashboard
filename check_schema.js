import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('custom_widgets')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching custom_widgets:', error);
  } else {
    console.log('Columns in custom_widgets:', data.length > 0 ? Object.keys(data[0]) : 'No data, checking rpc or fallback');
  }

  // Fallback check via a known query that might fail if column is missing
  const { error: columnError } = await supabase
    .from('custom_widgets')
    .select('current_value')
    .limit(1);
    
  if (columnError) {
    console.log('current_value column is likely MISSING:', columnError.message);
  } else {
    console.log('current_value column EXISTS.');
  }
}

checkSchema();
