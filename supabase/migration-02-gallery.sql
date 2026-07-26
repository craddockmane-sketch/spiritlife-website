-- =========================================================
-- MIGRATION: Add photo gallery support
-- =========================================================
-- Your database already exists, so schema.sql won't re-run
-- automatically. Run this once in your Supabase SQL Editor
-- to add the gallery feature.
-- =========================================================

create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

alter table gallery_images enable row level security;

create policy "Public can read gallery_images" on gallery_images for select using (true);
create policy "Admin can insert gallery_images" on gallery_images for insert with check (auth.role() = 'authenticated');
create policy "Admin can delete gallery_images" on gallery_images for delete using (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "Public can view gallery" on storage.objects for select using (bucket_id = 'gallery');
create policy "Admin can upload gallery" on storage.objects for insert with check (bucket_id = 'gallery' and auth.role() = 'authenticated');
create policy "Admin can delete gallery" on storage.objects for delete using (bucket_id = 'gallery' and auth.role() = 'authenticated');
