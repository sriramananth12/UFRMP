// Supabase connection for every programme page in the mitigation portal.
// Setup steps: SETUP.md in this folder.
//
// url and anonKey: Supabase dashboard > Project Settings > API (the Project URL
// and the "anon" "public" key). The anon key is meant to be public; the access
// rules in supabase/schema.sql are what protect the data.
// proxyUrl: optional Cloudflare Worker for networks that block supabase.co
// (SETUP.md, last section). Leave it '' if you don't use one.
//
// These start out pointing at the UFRMP dashboard's Supabase project, so the
// portal shares that project and its proxy. Each programme keeps its data in
// its own schema there, apart from the UFRMP data in "public".
window.MITIGATION_SUPABASE = {
  url: 'https://nejpqyqmcbchivhtovny.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lanBxeXFtY2JjaGl2aHRvdm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MzY5OTUsImV4cCI6MjEwNjQxMjk5NX0.Dp3DpvDiLRY9PpOuKGDmrR5pH6mnRa3MTSH7NmGfNg0',
  proxyUrl: 'https://ufrmp-proxy.sriramananth12.workers.dev'
};
