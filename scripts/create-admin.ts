
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const email = 'admin@nadinkollections.com';
  const password = 'Williams123+';

  console.log(`Checking if user ${email} exists...`);

  // 1. Check if user exists (by trying to sign in or list users if possible, but list users needs admin api)
  // We can just try to signUp. If it fails saying user exists, we update.

  // Using admin auth client to list users is better
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingUser = users.find(u => u.email === email);
  let userId;

  if (existingUser) {
    console.log('User exists. Updating password...');
    userId = existingUser.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: password,
      email_confirm: true
    });
    if (updateError) {
      console.error('Error updating password:', updateError);
      return;
    }
    console.log('Password updated.');
  } else {
    console.log('User does not exist. Creating...');
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    userId = data.user.id;
    console.log('User created.');
  }

  // 2. Update Profile Role
  console.log('Updating profile role to admin...');

  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
     console.error('Error checking profile:', profileError);
  }

  if (!profile) {
      console.log('Profile not found, creating...');
      const { error: insertError } = await supabase.from('profiles').insert({
          id: userId,
          email: email,
          role: 'admin',
          full_name: 'Admin User'
      });
      if (insertError) console.error('Error inserting profile:', insertError);
      else console.log('Profile created with admin role.');
  } else {
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId);

      if (updateProfileError) console.error('Error updating profile role:', updateProfileError);
      else console.log('Profile role updated to admin.');
  }

  console.log('Admin setup complete.');
}

createAdmin();
