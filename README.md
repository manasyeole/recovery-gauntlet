# The Recovery Gauntlet 🦵

A single-page roast-and-record site you send to a friend who just had leg surgery.
Instead of a boring "get well soon" text, they land on a page that greets them,
teases them, and walks them through **20 steps** of dumb questions and
prove-you're-actually-resting activities. Every answer is saved so you can read
their responses afterwards like a guestbook.

Built as a **reusable template** — re-skin it for the next friend who decides
gravity is optional by changing a handful of env vars.

---

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3.4, mobile-first, dark mode via `prefers-color-scheme` |
| Animation | CSS keyframes + `canvas-confetti` (lazy-loaded, respects `prefers-reduced-motion`) |
| Database | Postgres (Vercel Postgres / Neon / Supabase) |
| ORM | Prisma 6 |
| Hosting | Vercel |

**Why a real DB and not a JSON file:** Vercel's serverless functions have an
ephemeral, read-only-at-runtime filesystem. Anything written to a local file
vanishes when the request ends. Postgres is the only reliable way to persist
answers.

---

## Local setup

```bash
npm install
cp .env.example .env.local        # then fill in DATABASE_URL + ADMIN_PASSWORD
npx prisma db push                # creates the Session/Answer tables
npm run dev                       # http://localhost:3000
```

Without a `DATABASE_URL` the site still runs end to end — answers are kept in
`localStorage` and the certificate works — but nothing reaches `/admin`.

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. **Vercel → Add New → Project → Import** the repo. Zero config needed.
3. **Vercel → Storage → Create Database → Postgres (Neon)** and connect it to
   the project. Vercel injects `DATABASE_URL` / `POSTGRES_*` automatically.
4. **Settings → Environment Variables**, add:
   - `ADMIN_PASSWORD` — required, gates `/admin`
   - `NEXT_PUBLIC_FRIEND_NAME`, `NEXT_PUBLIC_INJURY`, `NEXT_PUBLIC_SURGERY_DATE`
   - `NEXT_PUBLIC_FOLLOWUP_DATE` — optional, powers the countdown widget
   - `NEXT_PUBLIC_SITE_URL` — your production URL, used by the Share button
5. Create the tables against the production database once:
   ```bash
   vercel env pull .env.production.local
   npx dotenv -e .env.production.local -- npx prisma db push
   ```
   (Or just paste the `DATABASE_URL` into your shell and run `npx prisma db push`.)
6. Redeploy so the `NEXT_PUBLIC_*` values get inlined into the client bundle.

> `NEXT_PUBLIC_*` vars are baked in at build time — changing one needs a redeploy,
> not just a restart.

---

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing + greeting. Teases them by name from `?name=Rahul` or the input. |
| `/gauntlet` | The 20-step wizard. Progress bar, arrow keys on desktop, swipe on mobile. |
| `/results` | Certificate of Successful Suffering + download-as-PNG and share. |
| `/admin` | Password-gated answer viewer. Filter by name/date, JSON export. |
| `/admin/login` | Password prompt. |
| `POST /api/session` | Creates a `Session`, returns `{ sessionId }`. |
| `POST /api/answer` | Saves answers. Accepts one or a batch. |
| `GET /api/admin/sessions` | JSON dump of every run (gated). |
| `/games` | The games shelf — seven quizzes, plus the join-by-code box. |
| `/games/create` | Open a room. `?game=<slug>` preselects one. |
| `/games/room/[code]` | The room itself: seat, lobby, questions, final table. |

---

## The Games Room

Seven themed quizzes — cricket, football, WWE, Naruto, One Piece, Pokémon,
racing — running on **one shared multiplayer engine**. Someone opens a room,
reads out a six-character code, and everyone answers the same timed question at
the same time. No accounts, nothing to install.

### How a room works

```
create  ──▶  lobby  ──▶  question  ⇄  reveal  ──▶  finished  ──▶  rematch
              │            (N sec)     (6 sec)                      │
              └──────────── same code, same people ─────────────────┘
```

- **Identity** is a random token minted on join and kept in that browser's
  `localStorage`, one per room. Passing it back on a refresh is what returns you
  to your own score instead of a second seat.
- **The code is the credential.** Whoever has the link can play, which is the
  right amount of security for a quiz among friends and none at all for
  anything else.
- **Scoring** is 100 for correct plus up to 100 for speed, so a slow right
  answer always beats a fast wrong one. Every third correct in a row adds 25.
- **The answer never leaves the server while a round is live** — `correctIndex`
  first appears in the payload at the reveal, so reading the network tab
  doesn't help.

### Why polling and not websockets

Vercel's serverless runtime makes a long-lived connection the awkward option
and a 1.2-second `GET` the boring one. There is no scheduler either: **whoever
polls next advances the clock** (`lib/games/engine.ts` → `tick`). Every
transition is a conditional `updateMany` keyed on the state it expects to find,
so a dozen browsers polling in the same millisecond produce exactly one advance
and the rest just re-read.

### Adding a game

Two files, no route or component changes:

1. Add an entry to [`lib/games/catalog.ts`](lib/games/catalog.ts) — slug, name,
   emoji, and its three colours.
2. Add `lib/games/questions/<slug>.ts` and register it in
   [`lib/games/questions/index.ts`](lib/games/questions/index.ts).

Then `npm run check:questions`, which catches the things a typecheck can't: an
answer index off by one, two questions sharing an id, two identical choices in
the same four.

> Question **ids must never be renumbered** — a room in progress stores the ids
> it drew at creation time. Append, don't renumber.

### Games API

| Route | What it does |
| --- | --- |
| `POST /api/games/rooms` | Opens a room, seats the host, returns `{ code, token }`. |
| `GET /api/games/rooms/[code]` | The poll endpoint. Advances the clock, marks you present. |
| `POST …/join` | Takes a seat, or renames you if you already have one. |
| `POST …/start` | Host only. Puts question 1 up. |
| `POST …/answer` | Locks one answer in. First tap is final. |
| `POST …/next` | Host only. Cuts the current phase short. |
| `POST …/rematch` | Host only. Same room and people, new questions. |

Rooms are disposable — swept six hours after creation, players and answers
cascading with them. Unlike the gauntlet, the games section **hard-requires
Postgres**: a room is shared state by definition, so there is no local fallback.

---

## Customising it — the six [YOUR TURN] slots

All 20 steps live in [`lib/steps.ts`](lib/steps.ts). Fourteen are written and
ready. Six are marked `yourTurn: true` and ship with generic filler that *works*
but isn't personal — these are your inside-joke slots:

| Step | What belongs there |
| --- | --- |
| 5 | How the injury actually happened, if it's a good story |
| 10 | Their clumsiness / how you found out / their reaction |
| 14 | The shared plan or trip this injury is now ruining |
| 17 | The running bit or nickname specific to this friend |
| 19 | Closing tease only your friend group would get |

Search the file for `[YOUR TURN]` — each one has a comment block above it.
Edit the `question`, `hint` and `options` fields; everything else (progress bar,
saving, certificate) picks up the change automatically.

Two other flags worth knowing:

- `spotlight: true` — that answer gets quoted on the certificate.
- `confetti: true` — confetti fires when they finish that step.

### Step types available

`text` · `longtext` · `number` · `slider` · `choice` · `yesno` · `confirm` · `hold`

`confirm` is the big "I did it" button. `hold` is the press-and-hold-for-N-seconds
button (step 11) — let go early and it resets to zero, which is the joke.

### Re-skinning for the next person

Change the env vars in `.env.local` / Vercel. For a different colour scheme,
edit the `accent` ramp in [`tailwind.config.ts`](tailwind.config.ts) — everything
else follows.

---

## Design notes

- Mobile-first; cards widen and choice lists go two-column at `md:`.
- All tap targets are ≥44px (the audience is one-handed on a couch).
- `100dvh` rather than `100vh`, so mobile browser chrome doesn't crop the layout.
- Answers are written to `localStorage` **before** they're POSTed. A flaky
  connection never loses progress — failed writes retry on the next step.
- `prefers-reduced-motion` kills every animation and skips confetti entirely.
- The admin cookie holds SHA-256 of the password, not the password itself.
- `robots: noindex` — it's a private joke, not a landing page.

---

## Data model

```prisma
model Session {
  id          String   @id @default(cuid())
  visitorName String?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  answers     Answer[]
}

model Answer {
  id         String @id @default(cuid())
  sessionId  String
  stepNumber Int
  question   String
  answer     String
  @@unique([sessionId, stepNumber])   // going Back overwrites, never duplicates
}
```

One `Session` per person who plays through; one `Answer` row per step.

The games room adds three more tables — `GameRoom`, `GamePlayer`, `GameAnswer`.
The interesting columns are `GameRoom.questionIds` (the whole question order,
drawn once at creation so two players polling at the same instant can never
disagree about what question 7 is) and `GameRoom.phaseEndsAt` (the clock every
transition is driven off). See [`prisma/schema.prisma`](prisma/schema.prisma).

---

## Scripts

```bash
npm run dev              # dev server
npm run build            # prisma generate + migrate deploy + next build
npm start                # production server
npm run db:push          # sync schema to the database
npm run db:migrate       # apply migrations (what the build runs)
npm run db:studio        # browse the data in Prisma Studio
npm run check:questions  # validate every quiz bank and the scoring rules
```
