# Mitigation portal: Supabase setup (one time)

The portal is `mitigation/index.html` (live at `https://sriramananth12.github.io/UFRMP/mitigation/`
once merged). Each programme card opens `programme.html?p=<programme>`, which has
every feature of the UFRMP dashboard and starts with no data apart from the
programme's states.

Everything typed into a programme page is written to Supabase the moment it is
saved, so it is shared and permanent, not kept in one browser. Each programme
keeps its data in its own schema (`landslide`, `drought`, `erosion`,
`resettlement`, `glof`, `riverine`, `earthquake`, `border_flood`, `coastal`), so
programmes never mix with each other or with the UFRMP data in `public`.

Until these steps are done, the programme pages can't load or save data.

## 0. Which Supabase project

`mitigation/supabase-config.js` already points at the UFRMP project
(`nejpqyqmcbchivhtovny`) and its Cloudflare proxy, so the portal can share that
project. That is the simplest route: skip to step 1.

To use a separate project instead:

1. At **supabase.com/dashboard** click **New project**, pick the organisation, give
   it a name (e.g. `mitigation-portal`), set a database password, pick the
   Mumbai (ap-south-1) region and click **Create new project**.
2. When it is ready, open **Project Settings → API** (or **Data API**). Copy the
   **Project URL** and the **anon public** key.
3. Put them in `mitigation/supabase-config.js`:

   ```js
   window.MITIGATION_SUPABASE = {
     url: 'https://<your-project-ref>.supabase.co',
     anonKey: '<the anon public key>',
     proxyUrl: ''   // see the last section if some networks can't reach Supabase
   };
   ```

   The anon key is meant to be public. The access rules from step 2 are what
   protect the data.

Then do steps 1 to 6 in that project.

## 1. Deploy the admin function

The User Logins page on each programme creates and edits logins through this
function. It holds the service role key on Supabase's side, so the key never
appears in a page.

1. **Edge Functions → Deploy a new function → Via Editor**.
2. Name it exactly `mitigation-admin`.
3. Replace the sample code with the contents of
   `mitigation/supabase/functions/mitigation-admin/index.ts`.
4. Click **Deploy function**. Leave **Verify JWT** on.

## 2. Create the tables and access rules

1. **SQL Editor → New query**.
2. Paste all of `mitigation/supabase/schema.sql` and click **Run**.

This creates one schema per programme with the tables (`works`, `gantt_data`,
`budget_matrix`, `kv_store`, `user_profiles`, `login_passwords`) and turns on
row-level security: nobody can read or write without signing in, the master
login sees and edits every state, and a state login sees and edits only its own
state. It doesn't touch the UFRMP tables and is safe to run again.

## 3. Expose the schemas to the API

**Project Settings → Data API → Exposed schemas** (older dashboards: **Project
Settings → API → Exposed schemas**). Add all nine, keeping `public` and
`graphql_public` as they are:

```
landslide, drought, erosion, resettlement, glof, riverine, earthquake, border_flood, coastal
```

Click **Save**. Without this, the pages get an "Invalid schema" error and can't
load data.

## 4. Turn off public sign-ups

**Authentication → Sign In / Providers**: switch off **Allow new users to sign
up** and keep the **Email** provider on. (If you use the UFRMP project, this is
already done.)

## 5. Create the master login

One master login works on every programme.

1. **Authentication → Users → Add user → Create new user**.
2. Email: `mitigation_ndma@mitigation.local`. (Usernames sign in as
   `<username>@mitigation.local` behind the scenes. No email is ever sent.)
3. Password: the master password you choose. Tick **Auto Confirm User**, then
   **Create user**.
4. Back in **SQL Editor → New query**, run:

   ```sql
   do $$
   declare s text; uid uuid;
   begin
     select id into uid from auth.users where email = 'mitigation_ndma@mitigation.local';
     foreach s in array array['landslide','drought','erosion','resettlement','glof','riverine','earthquake','border_flood','coastal'] loop
       execute format('insert into %I.user_profiles (user_id, username, role) values ($1, ''MITIGATION_NDMA'', ''master'')
                       on conflict (user_id) do update set username = excluded.username, role = ''master'', city_id = null', s)
         using uid;
     end loop;
   end $$;
   ```

   To check: `select username, role from landslide.user_profiles;` should list
   `MITIGATION_NDMA` as `master`.

## 6. Publish and sign in

Merge the pull request. Once GitHub Pages republishes, open
`/UFRMP/mitigation/`, pick a programme and sign in as `MITIGATION_NDMA`.
Usernames are not case-sensitive; passwords are.

The first master sign-in on a programme saves its states (from
`mitigation/programmes.js`) to Supabase. From there:

- **+ Add State / Programme** adds a state. Typing an Indian state's name fills in
  its map position.
- Each state page has the same tabs as a UFRMP city: Overview, Contact Details,
  Components & DPRs, Implementation Gantt, Budget Matrix, Approval Timeline, M&E
  and Data Entry.
- **User Logins** adds a login per state for that programme. State logins belong
  to one programme. Usernames must be unique across the whole portal.

The master login is shared by all programmes, so changing its password on any
programme's User Logins page changes it everywhere.

## If sign-in says "Could not reach the sign-in server"

Some networks block `supabase.co`. The pages then switch on their own to the
Cloudflare Worker in `proxyUrl`. With the UFRMP project, the existing
`ufrmp-proxy` worker already covers the portal. With a new project, set up a
worker as in `supabase/SETUP.md` (last section), but change `UPSTREAM` in the
worker code to the new project's URL, and put the worker's address in `proxyUrl`
in `mitigation/supabase-config.js`.

## Changing a programme

- Name, cost, timeline or states shown on the portal and in each programme's
  header: edit `mitigation/programmes.js`. States already saved for a programme
  are changed on its dashboard, not by editing this file.
- New programme: add an entry to `mitigation/programmes.js`, add
  `select public.mitigation_setup_schema('<schema>');` at the end of
  `schema.sql` and run that line, add the schema to `PROGRAMME_SCHEMAS` in the
  Edge Function and redeploy it, add it under Exposed schemas, and give the
  master a profile in it (step 5's SQL).
- Changes to the UFRMP dashboard: run `node mitigation/build.mjs` to rebuild
  `mitigation/programme.html` from `index.html`.
