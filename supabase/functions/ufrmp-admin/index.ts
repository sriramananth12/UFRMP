// ufrmp-admin: lets the dashboard's master login create, edit and remove
// city logins. It runs on Supabase with the service role key, which never
// leaves the server, and refuses anyone whose profile is not the master.
// Deploy steps: supabase/SETUP.md.
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOGIN_EMAIL_DOMAIN = 'ufrmp.local'; // must match index.html
const USERNAME_RE = /^[A-Za-z0-9._-]{3,32}$/;
const MIN_PASSWORD_LENGTH = 8;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

class Fail extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
function toEmail(username: string) { return username.toLowerCase() + '@' + LOGIN_EMAIL_DOMAIN; }
function cleanUsername(value: unknown) {
  const username = String(value ?? '').trim();
  if (!USERNAME_RE.test(username)) throw new Fail(400, 'Usernames need 3–32 characters: letters, numbers, dot, underscore or hyphen.');
  return username;
}
function checkPassword(value: unknown) {
  const password = String(value ?? '');
  if (password.length < MIN_PASSWORD_LENGTH) throw new Fail(400, `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`);
  return password;
}
function authMessage(error: { message?: string }) {
  const m = error.message || 'The login service refused the change.';
  return /already (been )?registered|already exists/i.test(m) ? 'That username is already taken.' : m;
}

async function requireMaster(admin: any, req: Request) {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) throw new Fail(401, 'Sign in first.');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) throw new Fail(401, 'Your sign-in has expired. Sign in again.');
  const { data: profile, error: pErr } = await admin.from('user_profiles').select('role').eq('user_id', data.user.id).maybeSingle();
  if (pErr) throw pErr;
  if (profile?.role !== 'master') throw new Fail(403, 'Only the master login can manage logins.');
  return data.user.id as string;
}

async function ensureUsernameFree(admin: any, username: string, exceptUserId?: string) {
  const { data, error } = await admin.from('user_profiles').select('user_id,username');
  if (error) throw error;
  const taken = (data ?? []).some((p: any) => p.user_id !== exceptUserId && p.username.toLowerCase() === username.toLowerCase());
  if (taken) throw new Fail(400, 'That username is already taken.');
}

async function checkCity(admin: any, value: unknown) {
  const cityId = String(value ?? '');
  const { data, error } = await admin.from('kv_store').select('key').eq('key', 'cityProgrammes@' + cityId).maybeSingle();
  if (error) throw error;
  if (!cityId || !data) throw new Fail(400, 'Pick a city from the list.');
  return cityId;
}

async function getProfile(admin: any, userId: unknown) {
  const { data, error } = await admin.from('user_profiles').select('user_id,username,role,city_id').eq('user_id', String(userId ?? '')).maybeSingle();
  if (error) throw error;
  if (!data) throw new Fail(404, 'That login no longer exists.');
  return data;
}

// Keeps the master's readable copy of a password. A failure here never undoes
// the login change itself; the copy is just missing until the next reset.
async function savePasswordCopy(admin: any, userId: string, password: string) {
  const { error } = await admin.from('login_passwords').upsert({ user_id: userId, password, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) console.error('Could not save the password copy:', error.message);
}

async function createLogin(admin: any, body: any) {
  const username = cleanUsername(body.username);
  const password = checkPassword(body.password);
  const cityId = await checkCity(admin, body.cityId);
  await ensureUsernameFree(admin, username);
  const { data, error } = await admin.auth.admin.createUser({ email: toEmail(username), password, email_confirm: true });
  if (error) throw new Fail(400, authMessage(error));
  const { error: pErr } = await admin.from('user_profiles').insert({ user_id: data.user.id, username, role: 'city', city_id: cityId });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Fail(400, pErr.code === '23505' ? 'That username is already taken.' : pErr.message);
  }
  await savePasswordCopy(admin, data.user.id, password);
  return { ok: true, userId: data.user.id };
}

async function updateLogin(admin: any, body: any) {
  const target = await getProfile(admin, body.userId);
  const profilePatch: Record<string, string> = {};
  const authPatch: Record<string, unknown> = {};
  if (body.username !== undefined && body.username !== target.username) {
    const username = cleanUsername(body.username);
    await ensureUsernameFree(admin, username, target.user_id);
    profilePatch.username = username;
    if (username.toLowerCase() !== target.username.toLowerCase()) {
      authPatch.email = toEmail(username);
      authPatch.email_confirm = true;
    }
  }
  if (body.password) authPatch.password = checkPassword(body.password);
  if (body.cityId !== undefined && target.role === 'city' && body.cityId !== target.city_id) {
    profilePatch.city_id = await checkCity(admin, body.cityId);
  }

  // Profile first (its unique index settles username races), then the sign-in
  // details; if those are refused, put the profile back.
  if (Object.keys(profilePatch).length) {
    const { error } = await admin.from('user_profiles').update(profilePatch).eq('user_id', target.user_id);
    if (error) throw new Fail(400, error.code === '23505' ? 'That username is already taken.' : error.message);
  }
  if (Object.keys(authPatch).length) {
    const { error } = await admin.auth.admin.updateUserById(target.user_id, authPatch);
    if (error) {
      if (Object.keys(profilePatch).length) {
        await admin.from('user_profiles').update({ username: target.username, city_id: target.city_id }).eq('user_id', target.user_id);
      }
      throw new Fail(400, authMessage(error));
    }
    if (authPatch.password) await savePasswordCopy(admin, target.user_id, authPatch.password as string);
  }
  return { ok: true };
}

async function deleteLogin(admin: any, body: any) {
  const target = await getProfile(admin, body.userId);
  if (target.role === 'master') throw new Fail(400, "The master login can't be removed.");
  const { error } = await admin.auth.admin.deleteUser(target.user_id); // the profile goes with it
  if (error) throw new Fail(400, authMessage(error));
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'Use POST.' });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await requireMaster(admin, req);
    const body = await req.json().catch(() => ({}));
    if (body.action === 'create') return json(200, await createLogin(admin, body));
    if (body.action === 'update') return json(200, await updateLogin(admin, body));
    if (body.action === 'delete') return json(200, await deleteLogin(admin, body));
    throw new Fail(400, 'Unknown action.');
  } catch (e) {
    if (e instanceof Fail) return json(e.status, { error: e.message });
    console.error(e);
    return json(500, { error: 'Something went wrong on the server. Try again.' });
  }
});
