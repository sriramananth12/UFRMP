# Logins setup (one time)

The dashboard needs a sign-in. The **master** login sees and edits every city and
manages the other logins on the **User Logins** page. Each **city** login sees and
edits only its own city. Supabase enforces this on the server with row-level
security, so it holds even for someone who reads the page source.

Do these steps in the Supabase dashboard for project `nejpqyqmcbchivhtovny`, in
this order, then merge the pull request. Between step 2 and the merge, the live
page can't load data, so do them together.

## 1. Deploy the admin function

The User Logins page creates and edits logins through this function. It holds the
service role key on Supabase's side, so the key never appears in the page.

1. **Edge Functions → Deploy a new function → Via Editor**.
2. Name it exactly `ufrmp-admin`.
3. Replace the sample code with the contents of
   `supabase/functions/ufrmp-admin/index.ts` from this repo.
4. Click **Deploy function**. Leave **Verify JWT** on (the default).

## 2. Run the database script

1. **SQL Editor → New query**.
2. Paste all of `supabase/schema.sql` and click **Run**.

This adds the logins table, replaces the open access rules with per-city ones, and
moves the existing data into per-city rows. Nothing is deleted. It is safe to run
again.

## 3. Turn off public sign-ups

**Authentication → Sign In / Providers**: switch off **Allow new users to sign up**.
Keep the **Email** provider enabled. Logins are only created from the User Logins
page after this.

## 4. Create the master login

1. **Authentication → Users → Add user → Create new user**.
2. Email: `ufrmp_ndma@ufrmp.local`. (Usernames sign in as `<username>@ufrmp.local`
   behind the scenes. No email is ever sent to this address.)
3. Password: the master password you chose.
4. Tick **Auto Confirm User**, then **Create user**.
5. Back in **SQL Editor → New query**, run:

   ```sql
   insert into public.user_profiles (user_id, username, role)
   select id, 'UFRMP_NDMA', 'master' from auth.users where email = 'ufrmp_ndma@ufrmp.local'
   on conflict (user_id) do update set username = excluded.username, role = 'master', city_id = null;
   ```

   To check it worked, run `select username, role from public.user_profiles;`. It
   should list `UFRMP_NDMA` as `master`.

## 5. Publish the page

Merge the pull request. Once GitHub Pages has republished, open the dashboard and
sign in as `UFRMP_NDMA`. Usernames are not case-sensitive; passwords are.

Then open **User Logins** to add a login for each city. You can rename a login,
reset its password, move it to another city or remove it there. The master's own
username and password can be changed there too.

## If sign-in says "Could not reach the sign-in server"

Some networks block `supabase.co` (several Indian ISPs, JioFiber in particular, since
February 2026). The dashboard can go through a small Cloudflare Worker instead, and
switches to it on its own on any network where Supabase can't be reached. Set it up
once:

1. Sign up or log in at **dash.cloudflare.com** (the free plan is enough).
2. Open **Workers & Pages → Create → Create Worker** (start from "Hello World").
3. Name it `ufrmp-proxy` and click **Deploy**.
4. Click **Edit code**, replace everything with the contents of
   `supabase/proxy/worker.js` from this repo, then click **Deploy**.
5. Copy the worker's address, which looks like
   `https://ufrmp-proxy.<your-name>.workers.dev`. Opening
   `<that address>/auth/v1/health` on the blocked network should show a short line of
   text, not an error.
6. Put that address in `SUPABASE_PROXY_URL` near the top of the script in
   `index.html` and publish the page.

The worker only forwards requests to this Supabase project. It holds no keys, and
the same sign-in and per-city rules apply through it.
