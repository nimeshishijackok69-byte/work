import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // Anon key is fine or Service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Needs to be passed

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data: admin } = await supabase.from('admin_profile').select('*').limit(1).single();
  if(!admin) {
    console.log("No admin found!");
    return;
  }
  
  const { data, error } = await supabase.from('event_master').insert({
    title: 'Test Event from script',
    description: 'Testing the Database error querying schema error',
    form_schema: { fields: [] },
    review_layers: 1,
    scoring_type: 'numeric',
    grade_config: null,
    max_score: 100,
    status: 'draft',
    share_slug: 'scripts1',
    expiration_date: null,
    teacher_fields: ['name','email','school_name'],
    created_by: admin.id,
  }).select('*').single();
  
  if (error) {
    console.error("Error creating event:", error);
  } else {
    console.log("Event created successfully:", data.id);
  }
}

testInsert();
