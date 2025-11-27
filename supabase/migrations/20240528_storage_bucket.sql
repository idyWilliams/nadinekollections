-- Create a new storage bucket for product images (using user-provided name)
INSERT INTO storage.buckets (id, name, public)
VALUES ('NadineKollections', 'NadineKollections', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'NadineKollections' );

-- Policy to allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'NadineKollections' AND
  auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to update their images
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'NadineKollections' AND
  auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'NadineKollections' AND
  auth.role() = 'authenticated'
);
