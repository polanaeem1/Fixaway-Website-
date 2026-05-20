const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.from('technician_profiles')
    .select('*, user:users!inner(id, name, email, avatarUrl)', { count: 'exact' });

  if (error) {
    console.error('Supabase query error:', error);
  } else {
    console.log('Supabase technician query data:');
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
