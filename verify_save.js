import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verify() {
  const tenantId = 1;
  const panelType = 'sidePanel';
  const title = 'Diagnostic Test Title';
  const items = [
    { label: 'Test Item 1', value: 'Sync Test Success', trend: 'up', trendLabel: 'Just now' },
    { label: 'Test Item 2', value: '100%', trend: 'neutral', trendLabel: 'Stable' },
    { label: 'Test Item 3', value: 'Verified', trend: 'up', trendLabel: 'Diagnostic' }
  ];

  console.log('--- Starting Diagnostic ---');
  
  // 1. Fetch
  const { data: tenant, error: fetchError } = await supabase
    .from('tenants')
    .select('custom_labels')
    .eq('id', tenantId)
    .single();

  if (fetchError) {
    console.error('Fetch Error:', fetchError);
    return;
  }
  
  console.log('Fetched Labels:', JSON.stringify(tenant.custom_labels));

  // 2. Merge
  const payload = { sidePanel: { title, items } };
  const existing = tenant?.custom_labels ? (typeof tenant.custom_labels === 'string' ? JSON.parse(tenant.custom_labels) : tenant.custom_labels) : {};
  const merged = { ...existing, ...payload };
  
  console.log('Merged Labels:', JSON.stringify(merged));

  // 3. Update
  const { error: updateError } = await supabase
    .from('tenants')
    .update({ custom_labels: merged })
    .eq('id', tenantId);

  if (updateError) {
    console.error('Update Error:', updateError);
  } else {
    console.log('Update Success!');
    
    // 4. Verify
    const { data: final } = await supabase
      .from('tenants')
      .select('custom_labels')
      .eq('id', tenantId)
      .single();
    console.log('Final Labels in DB:', JSON.stringify(final.custom_labels));
  }
}

verify();
