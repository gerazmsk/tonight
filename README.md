# Tonight

A mobile-first dating and social discovery web app focused on real-life offline introductions.

**Tagline:** Meet people who are actually open to meeting tonight.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth, Postgres, Storage, Realtime, RLS)
- **Hosting:** Deploy frontend to Vercel/Netlify; Supabase project: `Tonight` (`ztbcrbooicltbyqmmoug`)

## Quick Start

```bash
cd ~/tonight
npm install
npm run dev
```

Open http://localhost:5173

Environment variables are in `.env` (see `.env.example`).

## Supabase Project

- **URL:** https://ztbcrbooicltbyqmmoug.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/ztbcrbooicltbyqmmoug

Schema migrations are in `supabase/migrations/`.

## MVP Features

- Email/password auth with onboarding (4 steps)
- Profile photos via Supabase Storage
- Discover feed with like/pass and mutual matching
- Real-time chat between matches
- **Tonight Mode** — venue-based live discovery with privacy rules
- Female users hidden by default; revealed only to men they like
- Block & report safety features
- Admin dashboard (protected by admin email)

## Testing Female Privacy Logic

This is the core differentiator. Follow these steps with two browsers (or incognito):

### Setup test users

1. **Male user** (`male@test.com` / `password123`)
   - Sign up → complete onboarding as Male, interested in Women
   - Go to **Tonight** → Turn on Tonight Mode at "Komodo Miami"
   - Set intent: Drinks, duration: 2 hours

2. **Female user** (`female@test.com` / `password123`)
   - Sign up → complete onboarding as Female, interested in Men
   - Go to **Tonight** → browse venues
   - She should see Komodo Miami with the male user counted

### Privacy verification

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Male browses venue while female has Tonight on (Likes Only) | Male does **NOT** see female profile |
| 2 | Female likes male from venue list | `visibility_reveals` row created |
| 3 | Male refreshes venue / Tonight page | Male **CAN** now see female profile |
| 4 | Female sets visibility to Invisible | Male no longer sees her |
| 5 | Female sets Venue Visible | Users at same venue can see her (no exact coords) |

### Verify in Supabase SQL Editor

```sql
-- Check visibility reveals after female likes male
select * from visibility_reveals;

-- Check active tonight sessions
select p.full_name, p.gender, ts.visibility_mode, v.name
from tonight_sessions ts
join profiles p on p.id = ts.user_id
join venues v on v.id = ts.venue_id
where ts.status = 'active' and ts.expires_at > now();
```

## Admin Access

Add your email to `admin_users` table in Supabase:

```sql
insert into admin_users (email) values ('your@email.com');
```

Then visit `/admin` after logging in.

## Database Tables

`profiles`, `profile_photos`, `likes`, `passes`, `matches`, `messages`, `venues`, `tonight_sessions`, `visibility_reveals`, `reports`, `blocks`, `admin_users`

## GitHub

```bash
gh repo create tonight --public --source=. --remote=origin --push
```

## Privacy & Safety Notes

- Exact coordinates are never shown in the UI
- Geolocation is only requested when turning on Tonight Mode
- Female users default to **Likes Only** visibility
- Tonight sessions auto-expire after selected duration
- Users must be 18+ (enforced in onboarding and RLS)
