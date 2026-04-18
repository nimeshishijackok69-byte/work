const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('admin_profile').select('id').limit(1);
  if (error) {
    console.error("Error connecting to admin_profile:", error.message);
  } else {
    console.log("Success! Data:", data);
  }
}

check();
