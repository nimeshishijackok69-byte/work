-- Local bootstrap admin for development:
-- email: admin@formflow.com
-- password: admin123
DO $$
DECLARE
  v_auth_user_id UUID := '00000000-0000-0000-0000-000000000000';
  v_instance_id UUID := '00000000-0000-0000-0000-000000000000';
  v_email TEXT := 'admin@formflow.com';
  v_password TEXT := 'admin123';
  v_metadata JSONB := '{"provider":"email","providers":["email"]}'::jsonb;
  v_user_metadata JSONB := '{}'::jsonb;
  has_app_metadata BOOLEAN;
  has_user_metadata BOOLEAN;
  has_raw_app_meta_data BOOLEAN;
  has_raw_user_meta_data BOOLEAN;
  v_sql TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'app_metadata'
  ) INTO has_app_metadata;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'user_metadata'
  ) INTO has_user_metadata;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_app_meta_data'
  ) INTO has_raw_app_meta_data;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'raw_user_meta_data'
  ) INTO has_raw_user_meta_data;

  v_sql := 'INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at';

  IF has_app_metadata THEN
    v_sql := v_sql || ', app_metadata';
  ELSIF has_raw_app_meta_data THEN
    v_sql := v_sql || ', raw_app_meta_data';
  END IF;

  IF has_user_metadata THEN
    v_sql := v_sql || ', user_metadata';
  ELSIF has_raw_user_meta_data THEN
    v_sql := v_sql || ', raw_user_meta_data';
  END IF;

  v_sql := v_sql || ') VALUES ($1, $2, $3, $4, $5, crypt($6, gen_salt(''bf'')), now(), now(), now()';

  IF has_app_metadata OR has_raw_app_meta_data THEN
    v_sql := v_sql || ', $7';
  END IF;

  IF has_user_metadata OR has_raw_user_meta_data THEN
    v_sql := v_sql || ', $8';
  END IF;

  v_sql := v_sql || ')
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        updated_at = now()';

  EXECUTE v_sql
    USING v_auth_user_id, v_instance_id, 'authenticated', 'authenticated', v_email, v_password, v_metadata, v_user_metadata;
END $$;

INSERT INTO admin_profile (auth_user_id, name, email, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'Super Admin', 'admin@formflow.com', 'admin', true)
ON CONFLICT (email) DO UPDATE
SET
  auth_user_id = EXCLUDED.auth_user_id,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
