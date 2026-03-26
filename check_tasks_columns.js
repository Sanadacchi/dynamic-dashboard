import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTasksSchema() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching tasks:', error.message);
  } else {
    console.log('Columns in tasks:', data.length > 0 ? Object.keys(data[0]) : 'No data in tasks table');
  }
}

checkTasksSchema();
