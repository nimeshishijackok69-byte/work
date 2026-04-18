-- Create the Form-Uploads Bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('form-uploads', 'form-uploads', true, false, 20971520, NULL)
ON CONFLICT (id) DO UPDATE SET public = true;



-- Allow public read access to the form-uploads bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'form-uploads');

-- Note: No INSERT policy is needed here because all uploads are processed securely 
-- on the Next.js server via `createAdminClient()` (the service role) which bypasses RLS.
