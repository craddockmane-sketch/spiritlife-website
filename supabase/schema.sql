-- =========================================================
-- SPIRITLIFE INTERNATIONAL — DATABASE SETUP
-- =========================================================
-- Run this ONCE in your Supabase project's SQL Editor.
-- Full instructions: README.md, Step 3.
-- =========================================================

-- ---------- TABLE: site_settings ----------
-- One single row holds all the editable text on the site:
-- hero text, service times, bank details, contact info, etc.
create table if not exists site_settings (
  id int primary key default 1,
  hero_title text,
  hero_lead text,
  about_text_1 text,
  about_text_2 text,
  about_text_3 text,
  sunday_time text,
  sunday_address text,
  prayer_time text,
  prayer_address text,
  online_time text,
  contact_phone text,
  contact_phone_display text,
  contact_email text,
  bank_account_name text,
  bank_sort_code text,
  bank_account_number text,
  facebook_url text,
  instagram_url text,
  youtube_url text,
  constraint single_row check (id = 1)
);

insert into site_settings (
  id, hero_title, hero_lead, about_text_1, about_text_2, about_text_3,
  sunday_time, sunday_address, prayer_time, prayer_address, online_time,
  contact_phone, contact_phone_display, contact_email,
  bank_account_name, bank_sort_code, bank_account_number
) values (
  1,
  'The words He speaks are spirit, and they are life.',
  'SpiritLife International is a church family in Milton Keynes built on the word of God — gathering to worship, pray, and grow together every week.',
  'SpiritLife International is a church family built on the word of God and the life that comes from His Spirit. Our name comes from John 6:63, where Jesus says His words are spirit and they are life.',
  'We gather every Sunday to worship together, and we come together as a church family for prayer on the last Saturday of each month.',
  'Whether you''re exploring faith for the first time or you''ve walked with God for years, there''s a place for you here. Come as you are.',
  '10:00AM Prompt',
  'Hodge Lea Meeting Place, Milton Keynes, MK12 6JA',
  '10:00AM – 12:00PM, last Saturday of the month',
  'Hodge Lea Meeting Place, Milton Keynes, MK12 6JA',
  '8:30PM – 9:30PM, every Friday',
  '447928310130',
  '07928 310130',
  '',
  'SPIRIT LIFE INTERNATIONAL',
  '20-57-44',
  '93951065'
)
on conflict (id) do nothing;

-- ---------- TABLE: teachings ----------
create table if not exists teachings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Sunday Teaching',
  year int not null,
  audio_url text not null,
  cover_url text,
  created_at timestamptz default now()
);

-- ---------- TABLE: events ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  tag text,
  image_url text,
  created_at timestamptz default now()
);

-- =========================================================
-- SECURITY (Row Level Security)
-- Public visitors can READ everything.
-- Only a logged-in admin (you) can ADD, EDIT, or DELETE.
-- =========================================================

alter table site_settings enable row level security;
alter table teachings enable row level security;
alter table events enable row level security;

-- Public read access
create policy "Public can read site_settings" on site_settings for select using (true);
create policy "Public can read teachings" on teachings for select using (true);
create policy "Public can read events" on events for select using (true);

-- Admin (any authenticated user) can write
create policy "Admin can update site_settings" on site_settings for update using (auth.role() = 'authenticated');

create policy "Admin can insert teachings" on teachings for insert with check (auth.role() = 'authenticated');
create policy "Admin can update teachings" on teachings for update using (auth.role() = 'authenticated');
create policy "Admin can delete teachings" on teachings for delete using (auth.role() = 'authenticated');

create policy "Admin can insert events" on events for insert with check (auth.role() = 'authenticated');
create policy "Admin can update events" on events for update using (auth.role() = 'authenticated');
create policy "Admin can delete events" on events for delete using (auth.role() = 'authenticated');

-- =========================================================
-- STORAGE (for cover art images only — audio lives on R2)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "Public can view covers" on storage.objects for select using (bucket_id = 'covers');
create policy "Admin can upload covers" on storage.objects for insert with check (bucket_id = 'covers' and auth.role() = 'authenticated');
create policy "Admin can delete covers" on storage.objects for delete using (bucket_id = 'covers' and auth.role() = 'authenticated');

-- =========================================================
-- DONE. Next step: README.md Step 4 (create your admin login).
-- =========================================================
