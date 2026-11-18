# Badminton platform (working name)

| Folder | What it is |
|---|---|
| `apps/web` | The website (Next.js): sign-in, profiles, clubs, members, invitations, family, sessions, registration. Mobile-first. |
| `packages/domain` | Shared rules: score validation, session standings, playing levels |
| `packages/rating` | Rating engine (spec v1.3) |
| `packages/matching` | Round generator: fair sit-outs, balanced doubles, explanations |
| `supabase` | Local database settings, migrations (`migrations/`) and safety checks (`checks/`) |
| `tools/simulator` | Engine simulation against agreed targets |

If plain `pnpm` does not work on your laptop, put `npx pnpm@10` in front instead, e.g. `npx pnpm@10 install`.

---

## Step A: run the app on your laptop

**Every time** you work on the app:

1. Start **Docker Desktop** and wait for "Engine running".
2. In the VS Code terminal (PowerShell), in the project folder:
   ```powershell
   pnpm install          # only needed after downloading new code
   pnpm db:start         # starts the local database and sign-in service (first time: 5–15 minutes of downloads)
   ```
   When it finishes it prints a list of local addresses. Keep Docker running.
3. **First time only** (and after `pnpm db:reset`): create the settings file for the app:
   ```powershell
   pnpm env:local
   ```
4. Start the website:
   ```powershell
   pnpm dev
   ```
5. Open **http://localhost:3000** in Chrome.

**Signing in locally:** no real emails are sent. Enter any email address (e.g. `organiser@test.local`), then open the
**test mailbox at http://127.0.0.1:54324**, open the newest message and click the link. Use the same browser.

**Try this:** sign in → create your profile → *Create a club* (e.g. 4 courts, UAE time) → see your club page.

**Look at the data:** the database viewer (Supabase Studio) is at **http://127.0.0.1:54323** → *Table editor*.

**When you finish:** stop the website with `Ctrl + C`, then `pnpm db:stop` (frees memory).

| Command | What it does |
|---|---|
| `pnpm db:start` / `pnpm db:stop` | Start / stop the local database services |
| `pnpm db:reset` | Wipe local data and re-apply all migrations (then run `pnpm env:local` again) |
| `pnpm db:status` | Show local addresses and keys |
| `pnpm dev` | Run the website at http://localhost:3000 |
| `pnpm test` | All automated tests |
| `pnpm simulate:quick` | Engine simulation |

### Try it on your phone (same home Wi-Fi)
Find your laptop's address with `ipconfig` (the "IPv4 Address", e.g. 192.168.1.20), then open
`http://192.168.1.20:3000` on the phone. Request the sign-in link **on the phone** and open the mailbox link
(`http://192.168.1.20:54324`) on the phone too. If Windows asks whether Node.js may use the network, allow *Private networks*.

### If something goes wrong
| Message | Fix |
|---|---|
| `Cannot connect to the Docker daemon` / `error during connect` | Start Docker Desktop and wait for "Engine running" |
| `port is already allocated` | Another copy is running: `pnpm db:stop`, then `pnpm db:start` |
| `Missing or invalid settings … Run "pnpm env:local"` | Run `pnpm env:local`, then restart `pnpm dev` |
| Sign-in link says it expired / different device | Request a new link and open it in the same browser |
| Very slow or laptop freezing | In Docker Desktop → Settings → Resources set Memory to 4 GB; close other apps |
| Anything else | Copy the last ~20 lines into our chat, or send a photo |

GitHub runs all checks automatically on every push (see the *Actions* tab of your repository).

---

## Step C2: sessions, registration and the waiting list — what to try

After copying in this version: `npx pnpm@10 install`, then **`npx pnpm@10 db:reset`** (new database tables; wipes local
test data), then `npx pnpm@10 env:local`, then `npx pnpm@10 dev`. Recreate your profile, club and a couple of members
(two browsers make this easy).

1. **Create a session** (club page → *New session*): try 22:30 to 01:00 — it shows "(+1 day)". Set places to **4**
   so the waiting list is easy to test. Add fees, e.g. 30 for members.
2. **Register** yourself and others (each person in their own browser, or add children via *My family*).
   The 5th person joins the **waiting list** with a number.
3. **Cancel** one registration: the first person waiting gets the place automatically. Check *Updates* (top right)
   and the test mailbox (http://127.0.0.1:54324) for "You have a place".
4. **Manage registrations** (organiser): move someone to the waiting list, reorder with Up/Down, give a place even when
   full ("over capacity" warning), remove someone.
5. **Edit** the session: change the time — everyone registered gets an update and an email. Lower the places — the
   latest registrations move to the top of the waiting list.
6. **Copy to next week** creates a draft; players cannot see it until you click *Open registration*.
7. **Cancel the session** with a reason — everyone is told.
8. Your *My page* shows **Coming up** with your places and waiting-list numbers (and your children's).

---

## Step C1: members and invitations — what to try

After copying in this version: run `npx pnpm@10 install`, then **`npx pnpm@10 db:reset`** (applies the new
database changes; this wipes local test data), then **`npx pnpm@10 env:local`** (adds the email setting), then `npx pnpm@10 dev`.
You will need to sign in and create your profile and club again.

Use **two browsers** (e.g. Chrome and Edge, or Chrome + a private window) to act as two different people.

1. **Organiser (browser 1):** sign in as `owner@test.local`, create your profile and a club. On the club page, copy the join link.
2. **Player (browser 2):** open the join link, sign in as `ben@test.local`, create a profile — you land in the club.
3. **Roles:** as the owner, open *Members*, make Ben an *Organiser*. As Ben, add a guest (e.g. "Mark").
4. **Email invitation:** as the owner, *Invite by email* `fatima@test.local`. Open the test mailbox (http://127.0.0.1:54324):
   you will see the invitation email. Open its link in browser 2 after signing out and signing in as `fatima@test.local`.
   Try opening it while signed in as someone else: it explains the invitation is for another address.
5. **Family:** as any member, *My page → My family → Add a child*, then on the club page *Add [child] to this club*.
   In *Members → Juniors* the child shows as first name + initial, with no email.
6. **Link reset:** as the owner, *Create a new link*, then try the old link — it no longer works.
7. **Approval clubs:** create a second club with "an owner or admin approves". Join it from browser 2 and approve the request.
8. **Table editor:** see `club_members`, `club_invites` and every action in `audit_log`.

**Developer note:** database integration tests run when `TEST_DATABASE_URL` points to an empty PostgreSQL database
(GitHub does this automatically). On your laptop they are skipped, so `pnpm test` shows some tests as skipped.

---

## Step B: rating and matching engines

Working name only. This repository will grow into the full app; Step B contains the
**engines** that make the platform fair, plus tests and a simulator that proves they work.

| Folder | What it is |
|---|---|
| `packages/domain` | Shared rules: single-game score validation, session standings (win %), seeded random numbers |
| `packages/rating` | Rating engine: rating + uncertainty, confidence badges, review prompt, replay after corrections |
| `packages/matching` | Round generator: fair sit-outs, balanced doubles, partner variety, fixed partners, locks, explanations |
| `tools/simulator` | Synthetic clubs played rally by rally to check the engines against agreed targets |

Specifications: `product-research/rating-and-matching.md` (v1.3). Findings from the first
simulation: `SIMULATION-FINDINGS.md`.

---

## Run it on Windows (first time)

You need **Git**, **Node.js LTS** and **pnpm** (see the setup message). Then:

1. Unzip this folder to `C:\dev\badminton-platform` (avoid OneDrive/Desktop folders; they slow things down).
2. Open **PowerShell** and go to the folder:
   ```powershell
   cd C:\dev\badminton-platform
   ```
3. Install the project's tools (about 1 minute, needs internet):
   ```powershell
   pnpm install
   ```
4. Run the automated tests (about 10–20 seconds):
   ```powershell
   pnpm test
   ```
   Expected: `Test Files 8 passed`, `Tests 74 passed`.
5. Run the quick simulation (about 1–2 minutes):
   ```powershell
   pnpm simulate:quick
   ```
   Expected: `11/11 checks passed` and two `INFO` lines. A readable copy is written to
   `simulation-report.md` — open it in VS Code (right-click → *Open Preview*).
6. Optional: full simulation with more seeds (about 3–5 minutes): `pnpm simulate`
7. Optional: type check (catches programming mistakes): `pnpm typecheck`

One command does steps 4–5 plus the type check: `pnpm check`.

### If something goes wrong
| Message | Fix |
|---|---|
| `pnpm : File ... cannot be loaded because running scripts is disabled` | Run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` and answer **Y**, then retry. Or use **Command Prompt** instead of PowerShell. |
| `pnpm is not recognized` | Close and reopen PowerShell; if still missing: `npm install -g pnpm` |
| pnpm asks to download version 10.34.7 | Allow it — the project pins the tested pnpm version |
| `Unsupported engine` / Node version error | Install the current **LTS** Node.js from nodejs.org |
| Anything else | Copy the last ~20 lines of the output (or a screenshot) into our chat |

---

## Save it to GitHub (recommended after the tests pass)

1. On github.com create a **private** repository named `badminton-platform` (no README, no .gitignore).
2. In PowerShell, inside the project folder:
   ```powershell
   git init
   git add .
   git commit -m "Step B: rating and matching engines"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/badminton-platform.git
   git push -u origin main
   ```
   The first push opens a browser window to sign in to GitHub.

`node_modules` and reports are excluded by `.gitignore`, so the upload is small.

---

## What the engines guarantee (checked automatically)

- A game score is valid only under the session rules (e.g. 21–19 ✔, 21–20 ✘, 30–29 ✔).
- Ratings change by **performance minus expectation**: an expected 21–9 win barely moves a rating; an upset moves it a lot.
- With the agreed guardrail, a win never lowers a rating.
- Nobody sits out twice in a row when it can be avoided; games played stay within 1 of each other.
- Fixed partners (e.g. parent and child) always play together and sit out together.
- The same inputs and seed always give the same round and the same ratings (so every result can be explained and reproduced).
- A round for 60 players on 12 courts is generated in well under a second.
