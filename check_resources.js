import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkResources() {
  // Check bucket
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error('Error listing buckets:', bucketError);
  } else {
    const hasDocuments = buckets.some(b => b.name === 'documents');
    console.log('Documents bucket exists:', hasDocuments);
    if (!hasDocuments) {
       console.log('CRITICAL: documents bucket is MISSING.');
    }
  }

  // Check custom_widgets column (re-confirming)
  const { error: widgetError } = await supabase.from('custom_widgets').select('current_value').limit(1);
  if (widgetError) {
    console.log('custom_widgets.current_value is MISSING.');
  } else {
    console.log('custom_widgets.current_value exists.');
  }
}

checkResources();
