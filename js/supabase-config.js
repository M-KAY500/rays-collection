/* =========================================================
   Ray's Collection — Supabase connection
   Fill in your project's URL and public "anon" key below.
   Find both in: Supabase Dashboard → Project Settings → API.
   The anon key is safe to expose in frontend code — it only
   works within the limits of your Row Level Security (RLS)
   policies (see supabase-setup.sql).
   ========================================================= */

const SUPABASE_URL = "https://jihxygbcjmcylboahwiz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppaHh5Z2Jjam1jeWxib2Fod2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NTQxMDgsImV4cCI6MjEwMzUzMDEwOH0.HwsONsnWVKSJxfcSwedg3KKguwu6bt8ghpPkn3dYSB4";

/* Single shared client used by products.js and auth.js. */
const rcSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Name of the Storage bucket that holds product photos. */
const RC_IMAGE_BUCKET = "product-images";
