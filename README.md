# SpiritLife International — Website Setup Guide

This guide takes you from this folder of files to a fully live website with
a working admin dashboard. No coding knowledge is needed — just follow the
steps in order. Each step builds on the one before it, so don't skip ahead.

Budget for **about 60–90 minutes** the first time. Nearly everything here is
completely free.

**What you'll end up with:**
- A live website at your own domain (spiritlifeinternational.org)
- A private admin dashboard where you can add teachings, events, and edit
  site content yourself — no code, ever, after today
- Audio teachings that play as a continuous "radio" stream
- Everything automated to keep running with no ongoing maintenance

> **Already done for you:** Supabase, Cloudflare R2, and Formspree are
> already connected in this copy of the project — their credentials are
> pre-filled in the code (Steps 2, 3, and 7 are marked accordingly below).
> You still need to complete the account setup on Supabase (running
> `schema.sql` and creating your admin login) and Cloudflare (confirming
> the bucket/CORS settings), since those actions happen on their websites,
> not in this code. GitHub, Vercel, and your domain still need setting up
> from scratch.

---

## Before you start: the accounts you'll need

All of these are free at the scale this church website needs. Create them
as you reach each step below — you don't need to do this in advance.

| Account | What it's for | Cost |
|---|---|---|
| Supabase | Stores your teachings, events, and site content; powers the admin dashboard login | Free |
| Cloudflare | Stores your audio teaching files | Free |
| GitHub | Stores your website's code | Free |
| Vercel | Takes the code from GitHub and makes it a live website | Free |
| Formspree | Delivers messages from your Contact page to your email | Free |
| A domain registrar (e.g. Hostinger, Namecheap) | Your domain name, spiritlifeinternational.org | ~£7–14/year |

---

## STEP 1 — Look at the site on your own computer first

Before setting anything up online, open `index.html` (double-click it) in
Chrome to see the site. It won't show live teachings or events yet — that
comes after Step 3 — but you can see the full design.

Keep this folder together as one unit. Every file refers to the others by
name (e.g. `styles.css`, `js/site.js`), so if you move `index.html` on its
own, the site will break. Always keep the whole folder intact.

---

## STEP 2 — Create your Supabase account and project

> **Credentials already filled in.** `js/supabase-client.js` in this project
> is already connected to the SpiritLife International Supabase project
> (URL: `azeykphrtnmtlborizjo.supabase.co`). You still need to log in and
> complete the setup below — running the database script and creating your
> admin login — since those are one-time actions that happen inside
> Supabase itself, not in the code.

Supabase is what stores your teachings, events, and all your editable site
text — and it's what powers your admin dashboard login.

1. Log into **supabase.com** using the account that owns the
   `azeykphrtnmtlborizjo` project (skip this if you already have access —
   the project itself is already created, so you don't need to make a new one).

### Run the database setup

4. Once you're in the project, look in the left sidebar for **SQL Editor**.
5. Click **New Query**.
6. Open the file `supabase/schema.sql` from this project folder (open it in
   Notepad, TextEdit, or any text editor), select all the text, and copy it.
7. Paste it into the Supabase SQL Editor and click **Run** (bottom right).
8. You should see a success message. This has created all the tables your
   website needs, with your real service times and bank details already
   filled in as a starting point. **This step still needs doing even though
   the connection is already set up — the tables don't exist until you run this.**

### Connection details (already done)

9. `js/supabase-client.js` already has this project's URL and publishable
   key filled in — nothing to do here. (If you ever need to reconnect to a
   *different* Supabase project, this is where those values would go:
   **Project Settings** → **API**.)

### Create your admin login

13. In the left sidebar, go to **Authentication** → **Users**.
14. Click **Add User** → **Create new user**.
15. Enter the email and password you (the church admin) want to use to log
    into the dashboard. Untick "Auto Confirm User" if present, or leave it
    ticked — either is fine for a single admin account.
16. This email + password is what you'll use to log into `/admin.html` once
    the site is live.

You can repeat steps 13–15 later to add more admin users if someone else
should also be able to manage the site.

---

## STEP 3 — Your Cloudflare R2 bucket (already set up)

This is where your teaching audio files live.

> **Already done:** the bucket (`spiritlife`) is already created, Public
> Access is already enabled, and its public URL always starts with:
> `https://pub-41b50dc9dcb043c0be3fe821e284bf3e.r2.dev/`
>
> Double-check the **CORS policy** is saved on the bucket (Settings → CORS
> Policy) — if it's ever missing or gets removed, add it back:
> ```json
> [
>   {
>     "AllowedOrigins": ["*"],
>     "AllowedMethods": ["GET"],
>     "AllowedHeaders": ["*"]
>   }
> ]
> ```

### Uploading a teaching's audio file

Whenever you want to add a new teaching:

1. Log into **cloudflare.com** with the account that owns this bucket.
2. Go to your R2 bucket (`spiritlife`) → **Upload** → choose your audio file.
3. Once uploaded, click on the file and copy its **public URL** — it will
   look like `https://pub-41b50dc9dcb043c0be3fe821e284bf3e.r2.dev/YourFileName.wav`
4. Paste that URL into the admin dashboard when adding the teaching (see Step 8 below).

---

## STEP 4 — Create your GitHub account and upload the code

GitHub stores your website's code and connects to Vercel to publish it.

1. Go to **github.com** and sign up for a free account, if you don't have one.
2. Click the **+** icon (top right) → **New repository**.
   - **Repository name**: `spiritlife-website`
   - Keep it **Public** (this is fine — there are no secrets in this code;
     your Supabase keys are designed to be public, and your admin password
     is stored securely inside Supabase, not in this code)
   - Click **Create repository**
3. On the new repository page, click **uploading an existing file**.
4. Drag the **entire contents** of this project folder (all the files and
   folders — `index.html`, `styles.css`, `js`, `supabase`, `.github`, etc.)
   into the upload box. Wait for everything to upload.
5. Scroll down and click **Commit changes**.

Your code is now on GitHub.

---

## STEP 5 — Create your Vercel account and go live

Vercel takes the code from GitHub and turns it into a real, working website.

1. Go to **vercel.com** and sign up using **your GitHub account** (this
   makes connecting the two automatic).
2. Click **Add New** → **Project**.
3. Find `spiritlife-website` in the list and click **Import**.
4. Leave all settings as default and click **Deploy**.
5. Wait about a minute. Vercel will give you a working link like
   `spiritlife-website.vercel.app` — click it. Your site is now live on the internet.

### Connect your real domain

6. Once you've bought spiritlifeinternational.org from your domain
   provider, go back to your project in Vercel → **Settings** → **Domains**.
7. Type in `spiritlifeinternational.org` and click **Add**.
8. Vercel will show you one or two DNS records (usually an "A record" and/or
   a "CNAME record") that you need to add at your domain provider.
9. Log into wherever you bought the domain (e.g. Hostinger) → find **DNS
   / Nameservers settings** for that domain → add the records exactly as
   Vercel showed you.
10. This can take anywhere from a few minutes to a few hours to fully
    activate. Vercel's Domains page will show a green tick once it's working.

Your site is now live at your real domain.

---

## STEP 6 — Set up the automatic "keep-alive" (do this once, forget it forever)

Supabase's free tier pauses a project if it goes 7 days with no activity.
This project includes an automated fix: a scheduled task that quietly
pings your Supabase project twice a week, forever, so this never happens.

1. On GitHub, go to your `spiritlife-website` repository.
2. Click **Settings** (top of the repo, not your account settings) →
   **Secrets and variables** → **Actions**.
3. Click **New repository secret**.
   - Name: `SUPABASE_URL`
   - Value: your Project URL from Step 2 (e.g. `https://xxxxx.supabase.co`)
   - Click **Add secret**
4. Click **New repository secret** again.
   - Name: `SUPABASE_ANON_KEY`
   - Value: your anon public key from Step 2
   - Click **Add secret**

That's it. From now on, GitHub automatically pings your Supabase project
every Monday and Thursday, and you never have to think about it again. You
can check it's working under the **Actions** tab of your repository — you
should see "Keep Supabase Awake" runs appearing there over time.

---

## STEP 7 — Your Contact form (already connected)

This makes the Contact page's message form actually deliver to your email.

> **Already done:** `contact.html` is already connected to a live Formspree
> form (`xnjebzqp`). Nothing to change here — once the site is deployed
> (Step 5), the Contact form will work immediately.

If you ever want messages going to a different email address, or want to
create a fresh form:

1. Go to **formspree.io** and log into the account that owns this form (or
   sign up for a new one if starting fresh).
2. Under your form's settings, you can change the destination email address
   at any time — no code changes needed for that.
3. If you create a brand new form instead, you'll get a new Form ID. Open
   `contact.html`, find the line starting with `action="https://formspree.io/f/`
   and replace `xnjebzqp` with your new ID, then re-upload `contact.html`
   to GitHub (same way as Step 4 — GitHub will ask if you want to replace
   the existing file; say yes). Vercel automatically redeploys within
   about a minute.

---

## STEP 8 — Log into your dashboard and add real content

1. Go to `spiritlifeinternational.org/admin.html` (or `yoursite.vercel.app/admin.html`
   before your domain is connected).
2. Log in with the email and password you created in Step 2.
3. You'll see three tabs:
   - **Teachings** — click "+ Add Teaching", paste your R2 audio URL (Step 3),
     upload cover art, fill in the title/category/year, and save. Cover art
     is automatically resized and compressed the moment you upload it — a
     large phone photo will typically shrink down to under 150KB — so
     Supabase's free 1GB storage comfortably covers thousands of cover
     images, not just a couple hundred.
   - **Events** — click "+ Add Event" to add upcoming dates.
   - **Site Settings** — edit any text on the site: service times, bank
     details, phone numbers, About page text, hero text, social links.
     Click "Save Changes" at the bottom.

Every change you make here appears on the live website immediately — no
code, no redeploying, nothing else to do.

---

## Ongoing: how to make changes forever

You will **never need to edit code again** for routine updates. Just log
into `/admin.html` any time to:
- Add a new teaching (upload audio to R2 first, then add it in the dashboard)
- Add or remove events
- Update service times, phone numbers, bank details, or any page text

The only time you'd need to touch the actual code files again is for a
structural change (a whole new page, a new section) — for that, come back
for help.

---

## STEP 9 — If your domain isn't spiritlifeinternational.org

The SEO files (`sitemap.xml`, `robots.txt`) and the social-preview tags in
every page's `<head>` are already set up using **spiritlifeinternational.org**.
If you registered that exact domain, skip this step — everything already matches.

If you chose a different domain, open `sitemap.xml`, `robots.txt`, and each
`.html` file, and replace every instance of `spiritlifeinternational.org`
with your actual domain, then re-upload the changed files to GitHub (Step 4).

---

## Troubleshooting

**The site loads but teachings/events don't show up.**
Double-check `js/supabase-client.js` has your real Project URL and anon key
pasted in correctly (Step 2), and that you ran `supabase/schema.sql`
successfully in the SQL Editor.

**I can't log into /admin.html.**
Make sure you created a user under Supabase → Authentication → Users
(Step 2), and that you're using that exact email and password.

**Audio won't play on the website.**
Check that your R2 bucket's Public Access is turned ON and the CORS policy
was added correctly (Step 3).

**The site works on vercel.app but not my real domain.**
DNS changes can take a few hours. Check Vercel → Settings → Domains for a
green checkmark confirming it's connected properly.

**I made a mistake in Site Settings and want to undo it.**
Just go back into the Site Settings tab and type the correct text back in,
then Save again. There's no complicated undo needed — it's just a text field.

---

*Built for SpiritLife International, Milton Keynes. This project is
designed so that anyone — not just the original developer — can pick up
this folder and get the site fully live by following the numbered steps
above in order.*
