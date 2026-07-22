-- =========================================================
-- MIGRATION: Add event flyer/image support
-- =========================================================
-- Your database already exists, so schema.sql won't re-run
-- automatically. Run this once in your Supabase SQL Editor
-- to add the new column for event images/flyers.
-- =========================================================

alter table events add column if not exists image_url text;
