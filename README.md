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
| `/games` | The deck shelf — seven decks, plus the join-by-code box. |
| `/games/[slug]` | One deck, every card in it, and the rules that deck plays by. |
| `/games/create` | Open a duel. `?game=<slug>` preselects a deck, `?mode=solo` the computer. |
| `/games/room/[code]` | The duel itself: seat, lobby, clash, reveal, result. |

---

## The Games Room

A **combat card game** across seven decks — cricket, football, WWE, Naruto, One
Piece, Pokémon, racing — running on **one shared engine**. Play the computer, or
read out a six-character code and play whoever has it. No accounts, nothing to
install.

### A card

Every card is a fighter with **six stats named after its own sport or story** —
WWE cards have Power, Technique, Agility, Strike, Submission and Grapple;
Pokémon cards have HP, Attack, Defense, Sp. Atk, Sp. Def and Speed — plus an
**affinity**, a **rarity** and one **signature move**.

Rarity is a *stat budget*, not a power level. Every common sums to 33 and every
legend to 48, so a legend is a more lopsided card rather than a strictly better
one: Big Show is a common with Power 10 and Agility 2. `npm run check:cards`
enforces the budget to the point, which is the only thing keeping the game from
quietly rotting one card at a time.

### A round

```
create ──▶ lobby ──▶ clash ⇄ resolve ──▶ finished ──▶ rematch
             │       (N sec)  (7 sec)                    │
             └──────── same code, same chairs ───────────┘
```

Both duelists put a card down **face-down** and pick **one of its six stats to
attack with**. Both turn over at once.

Your attack is resolved against **that same stat on their card** — so the read
is not "who has the bigger card", it is "which number are they thin on". Damage
is the gap between the two, times two, then bent by:

- **the affinity triangle** — each deck has three archetypes in a cycle
  (Powerhouse ▸ Technician ▸ High-Flyer ▸ Powerhouse). Beating theirs is worth
  half as much again; losing to it costs a third;
- **signature moves** — seven kinds shared by all seven decks, so a Rasengan and
  a Tombstone Piledriver are the same arithmetic in different hats;
- **special events** — one turns over every third round and hits both sides
  equally, so it can make a round strange but never decide it.

Both attacks are computed from the **same pre-clash snapshot**, so the round is
genuinely simultaneous: knocking someone out does not stop their swing landing,
and a double knockout is a draw rather than a win for whoever sat down first.

No single swing can exceed `MAX_HIT` — a third of starting health — which is
what guarantees **no duel is ever over in fewer than three rounds**, however
perfect the read. Without that ceiling the modifiers multiply up to about 50
against a starting 36, and a lucky round becomes a one-shot.

### Solo and multiplayer are one code path

The computer opponent is **a duelist row with `isBot` set**. The clock, the
clash, the reveal and the database cannot tell the difference — the only special
case is that a bot commits the instant you do, so a solo round ends when you
have chosen rather than on a timer you are watching alone.

The bot sees exactly what a person opposite would: its own hand, both healths,
the round's event, and which cards you have already played. It does not see your
hand. On `hard` it narrows you down by what you have discarded and plays for the
kill when you are low; on `easy` it mostly picks the wrong stat.

### Two things never leave the server

- **Your hand.** `serializeDuel` sends the opponent a *count*, never the cards.
- **A committed play**, until both are turned over. There is nothing stopping
  anyone reading their own network tab, so the other card simply isn't in it.

### Why polling and not websockets

Vercel's serverless runtime makes a long-lived connection the awkward option and
a 1.2-second `GET` the boring one. There is no scheduler either: **whoever polls
next advances the clock** (`lib/games/engine.ts` → `tick`). The clash is
resolved inside one interactive transaction opened by a conditional update, and
that update is the lock — a second request blocks on it, then finds the round
has moved on and matches nothing.

### Adding a deck

Two files, no route or component changes:

1. Add an entry to [`lib/games/catalog.ts`](lib/games/catalog.ts) — slug, name,
   emoji, its **six stat labels**, its **three affinities in beats-order**, and
   its three colours.
2. Add `lib/games/cards/<slug>.ts` and register it in
   [`lib/games/cards/index.ts`](lib/games/cards/index.ts): 14 cards (5 common,
   4 rare, 3 epic, 2 legend) and 6 events, one of each event kind.

Then:

```bash
npm run check:cards   # every budget, every triangle, and the combat maths
npm run sim:duels     # plays thousands of duels — does the deck actually work?
```

`check:cards` catches what a typecheck can't: a legend that sums to 49, an
affinity key with a typo silently dropping out of the triangle, a card that can
one-shot. `sim:duels` answers the question you cannot answer by reading — does a
better player win more? If `hard` and `easy` finish level, the choices in a
round mean nothing and the deck needs rebalancing.

> Card **ids must never be renumbered** — a duel in progress stores the ids it
> was dealt, and the `Card` table keys its lifetime record off them. Append,
> don't renumber.

### Where the stats live

The card *definitions* live in TypeScript and are mirrored into the **`Card`
table** by `lib/games/cards/sync.ts`. That split is deliberate:

- what a card **is** — its six numbers, its move — is content. It belongs in a
  diff, behind `check:cards`, and must not change under a duel already holding
  its id;
- what a card **has done** — `timesPlayed`, `timesWon`, `damageDealt` — is
  exactly what a constant array cannot hold, and accumulates in the row.

A sync overwrites the first half and never touches the second.

### Games API

| Route | What it does |
| --- | --- |
| `POST /api/games/rooms` | Opens a duel, deals both decks, returns `{ code, token }`. |
| `GET /api/games/rooms/[code]` | The poll endpoint. Advances the clock, marks you present. |
| `POST …/join` | Takes the other chair, or renames you if you have one. |
| `POST …/start` | Host only. Deals the first hand. |
| `POST …/play` | Puts one card down. First tap is final; the card must be in your hand. |
| `POST …/next` | Host only. Cuts the current phase short. |
| `POST …/rematch` | Host only. Same code and chairs, new decks. |

Duels are disposable — swept six hours after creation, duelists and turns
cascading with them. Unlike the gauntlet, the games section **hard-requires
Postgres**: a duel is shared state by definition, so there is no local fallback.

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

The games room adds four more tables — `Card`, `Duel`, `Duelist` and
`DuelTurn`. The interesting columns are `Duelist.hand` (the one genuinely secret
thing in the schema — never serialised to the other chair), `Duel.eventIds` (the
whole event plan, drawn once at creation so two browsers polling at the same
instant can never disagree about what round 6 is) and `Duel.phaseEndsAt` (the
clock every transition is driven off). `DuelTurn` keeps every play ever made,
which is what makes the round-by-round on the results screen a record rather
than a reconstruction. See [`prisma/schema.prisma`](prisma/schema.prisma).

---

## Scripts

```bash
npm run dev              # dev server
npm run build            # prisma generate + migrate deploy + next build
npm start                # production server
npm run db:push          # sync schema to the database
npm run db:migrate       # apply migrations (what the build runs)
npm run db:studio        # browse the data in Prisma Studio
npm run check:cards      # validate every card budget, triangle and the combat maths
npm run sim:duels        # play thousands of duels — do they end, and does skill win?
```
