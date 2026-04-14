-- Inserting a demo admin for local testing if running locally
-- Ensure the auth user is created first. In a real environment, auth.users is managed by Supabase Auth (or NextAuth in our custom auth setup if we don't rely only on Supabase Auth. But wait, NextAuth is doing credentials, meaning we must maintain our own tables for admins, or map it. Wait, the schema says auth_user_id references auth.users).
-- Actually, since we are using NextAuth, auth.users might be tricky if we don't use Supabase Auth.
-- But the PRD states NextAuth.js v5 with credentials provider. The schema says: auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id).
-- Wait! NextAuth doesn't inherently use auth.users from Supabase unless we use Supabase Auth. If we just have credentials provider in NextAuth, how is auth.users populated? Next.js Agent must use Supabase adapter or something.
-- If auth_user_id references auth.users, we should use Supabase auth or seed an auth.user manually in seed.sql.
-- Let's just create a dummy auth.user for the seed if we need one!

INSERT INTO auth.users (id, instance_id, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, app_metadata, user_metadata, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'admin@formflow.local', '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_profile (auth_user_id, name, email, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'Super Admin', 'admin@formflow.local', 'admin', true)
ON CONFLICT (email) DO NOTHING;
