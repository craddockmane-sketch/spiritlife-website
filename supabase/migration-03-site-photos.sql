-- =========================================================
-- MIGRATION: Add dashboard-editable photo spots
-- =========================================================
-- Run this once in your Supabase SQL Editor. Adds four new
-- columns so the hero, About, and Sundays page photos can be
-- uploaded from the admin dashboard instead of via code.
-- =========================================================

alter table site_settings add column if not exists hero_image_url text;
alter table site_settings add column if not exists about_image_url text;
alter table site_settings add column if not exists sundays_image_1_url text;
alter table site_settings add column if not exists sundays_image_2_url text;
