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

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # prisma generate + next build
npm start          # production server
npm run db:push    # sync schema to the database
npm run db:studio  # browse the data in Prisma Studio
```
