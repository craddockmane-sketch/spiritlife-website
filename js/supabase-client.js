/* =========================================================
   SUPABASE CONNECTION
   =========================================================
   Already connected to the SpiritLife International Supabase
   project below — nothing to change here.

   These two values are SAFE to be visible in this file and
   on the live website — the anon/publishable key only allows
   the exact actions your database rules (Row Level Security)
   permit.
   ========================================================= */

const SUPABASE_URL = "https://azeykphrtnmtlborizjo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_E1LXd-mUkix0HDhSHEDRjA_sSzEvrJN";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
