// Cloudflare Worker that forwards the dashboard's Supabase requests, for
// networks that block supabase.co. It only reaches this one Supabase project
// and only the parts the dashboard uses; the page's own anon key and sign-in
// token travel with each request, so the same access rules apply.
// Setup: supabase/SETUP.md, "If sign-in says Failed to fetch".
const UPSTREAM = 'https://nejpqyqmcbchivhtovny.supabase.co';
const ALLOWED_PATHS = ['/auth/v1/', '/rest/v1/', '/functions/v1/'];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!ALLOWED_PATHS.some(p => url.pathname.startsWith(p))) return new Response('Not found', { status: 404 });
    return fetch(new Request(UPSTREAM + url.pathname + url.search, request));
  },
};
