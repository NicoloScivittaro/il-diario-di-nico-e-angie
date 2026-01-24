-- Create a new private bucket named 'tets'
insert into storage.buckets (id, name, public)
values ('tets', 'tets', true)
on conflict (id) do nothing;

-- Policy: Allow authenticated users to upload (INSERT) files to 'tets' bucket
create policy "Authenticated users can upload to tets"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'tets' );

-- Policy: Allow PUBLIC access to view (SELECT) files in 'tets' bucket
-- This is needed so images can be displayed in the UI
create policy "Public can view files in tets"
on storage.objects for select
to public
using ( bucket_id = 'tets' );

-- Policy: Allow authenticated users to update their own files
create policy "Users can update own files in tets"
on storage.objects for update
to authenticated
using ( bucket_id = 'tets' and auth.uid() = owner );

-- Policy: Allow authenticated users to delete their own files
create policy "Users can delete own files in tets"
on storage.objects for delete
to authenticated
using ( bucket_id = 'tets' and auth.uid() = owner );
