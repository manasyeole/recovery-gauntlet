/**
 * Integrity pass over the seven rosters and the combat maths.
 *
 *   npm run check:cards
 *
 * A card game breaks quietly. A legend that quietly sums to 51 is strictly
 * better than every other legend and nobody notices for a month; an affinity
 * key with a typo silently drops out of the triangle and that card simply
 * never gets a bonus again. None of that fails a build or a typecheck, and
 * all of it ruins the game — so it is checked here instead. No test
 * framework, just Node reading the app's own modules.
 */
import { registerHooks } from "node:module";

/**
 * The app is written for a bundler, so its imports have no file extensions.
 * Node's ESM resolver insists on them. Rather than uglify the source to suit
 * one script, teach this process to retry with `.ts`.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (!specifier.startsWith(".") || /\.[cm]?[jt]s$/.test(specifier)) throw err;
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        return nextResolve(`${specifier}/index.ts`, context);
      }
    }
  },
});

// Dynamic, because the hook above has to be installed before anything that
// relies on it is resolved.
const { GAMES, affinityEdge } = await import("../lib/games/catalog.ts");
const { ROSTERS, RARITIES, RARITY_BUDGET, ROSTER_QUOTA, statTotal } = await import(
  "../lib/games/cards/index.ts"
);
const { cleanCode, cleanName, resolveClash, verdict, START_HP, MAX_HIT, DESPERATE_AT } = await import(
  "../lib/games/protocol.ts"
);

const problems: string[] = [];
const check = (cond: unknown, msg: string) => {
  if (!cond) problems.push(msg);
};

const ABILITY_KINDS = new Set([
  "pierce",
  "guard",
  "drain",
  "surge",
  "riposte",
  "finisher",
  "rally",
]);
const EVENT_KINDS = new Set([
  "damage_up",
  "damage_down",
  "defense_up",
  "heal_both",
  "no_affinity",
  "abilities_off",
]);

/* ----------------------------- the rosters ------------------------------- */

for (const game of GAMES) {
  const roster = ROSTERS[game.slug];
  check(roster !== undefined && roster.cards.length > 0, `${game.slug}: no roster`);
  if (!roster) continue;

  check(game.stats.length === 6, `${game.slug}: ${game.stats.length} stat labels, want 6`);
  check(
    game.statsShort.length === 6,
    `${game.slug}: ${game.statsShort.length} short labels, want 6`
  );
  check(game.affinities.length === 3, `${game.slug}: the triangle needs exactly 3 affinities`);

  // The triangle has to actually cycle, or half the cards never get a bonus.
  const [x, y, z] = game.affinities.map((a) => a.key);
  check(affinityEdge(game, x, y) === 1, `${game.slug}: ${x} should beat ${y}`);
  check(affinityEdge(game, y, z) === 1, `${game.slug}: ${y} should beat ${z}`);
  check(affinityEdge(game, z, x) === 1, `${game.slug}: ${z} should beat ${x}`);
  check(affinityEdge(game, x, x) === 0, `${game.slug}: ${x} should be neutral against itself`);

  const keys = new Set(game.affinities.map((a) => a.key));
  const ids = new Set<string>();
  const names = new Set<string>();
  const byRarity: Record<string, number> = {};
  const byAffinity: Record<string, number> = {};

  for (const card of roster.cards) {
    const where = `${game.slug}/${card.id}`;

    check(!ids.has(card.id), `${where}: duplicate id`);
    ids.add(card.id);
    check(!names.has(card.name), `${where}: duplicate name`);
    names.add(card.name);

    check(keys.has(card.affinity), `${where}: affinity "${card.affinity}" is not in the triangle`);
    byAffinity[card.affinity] = (byAffinity[card.affinity] ?? 0) + 1;

    check(RARITIES.includes(card.rarity), `${where}: unknown rarity "${card.rarity}"`);
    byRarity[card.rarity] = (byRarity[card.rarity] ?? 0) + 1;

    check(card.stats.length === 6, `${where}: ${card.stats.length} stats, want 6`);
    for (const [i, n] of card.stats.entries()) {
      check(
        Number.isInteger(n) && n >= 1 && n <= 10,
        `${where}: ${game.stats[i]} is ${n}, want an integer 1–10`
      );
    }

    // The load-bearing one. Rarity is a budget, not a power level.
    const total = statTotal(card.stats);
    const budget = RARITY_BUDGET[card.rarity];
    check(
      total === budget,
      `${where}: ${card.rarity} sums to ${total}, budget is ${budget} (off by ${total - budget})`
    );

    check(ABILITY_KINDS.has(card.ability.kind), `${where}: unknown ability "${card.ability.kind}"`);
    check(card.ability.value > 0, `${where}: ability value is ${card.ability.value}`);
    check(card.ability.name.trim().length > 2, `${where}: ability has no name`);
    check(card.ability.text.trim().length > 10, `${where}: ability has no description`);
    check(card.title.trim().length > 2, `${where}: no title`);
    check(card.emoji.trim().length > 0, `${where}: no emoji`);
  }

  for (const rarity of RARITIES) {
    check(
      byRarity[rarity] === ROSTER_QUOTA[rarity],
      `${game.slug}: ${byRarity[rarity] ?? 0} ${rarity}s, want ${ROSTER_QUOTA[rarity]}`
    );
  }

  // A triangle with an empty corner is not a triangle.
  for (const a of game.affinities) {
    check(
      (byAffinity[a.key] ?? 0) >= 3,
      `${game.slug}: only ${byAffinity[a.key] ?? 0} ${a.key} cards — need at least 3`
    );
  }

  /* ------------------------------ events -------------------------------- */

  const eventIds = new Set<string>();
  const eventKinds = new Set<string>();
  for (const ev of roster.events) {
    const where = `${game.slug}/event:${ev.id}`;
    check(!eventIds.has(ev.id), `${where}: duplicate id`);
    eventIds.add(ev.id);
    check(EVENT_KINDS.has(ev.kind), `${where}: unknown kind "${ev.kind}"`);
    eventKinds.add(ev.kind);
    check(ev.text.trim().length > 10, `${where}: no description`);
  }
  // One of each kind, so no game is missing a whole category of weirdness.
  check(
    eventKinds.size === EVENT_KINDS.size,
    `${game.slug}: has ${eventKinds.size} event kinds, want all ${EVENT_KINDS.size}`
  );

  const line = `${game.slug.padEnd(11)} ${String(roster.cards.length).padStart(3)} cards`;
  const spread = game.affinities.map((a) => `${a.key} ${byAffinity[a.key] ?? 0}`).join(", ");
  console.log(`  ${line}   ${roster.events.length} events   (${spread})`);
}

/* ------------------------------ the combat ------------------------------- */

const wwe = GAMES.find((g) => g.slug === "wwe")!;
const cards = ROSTERS.wwe.cards;
const byId = (id: string) => cards.find((c) => c.id === id)!;

// Two identical cards attacking with the same stat must be a perfect mirror.
const mirror = resolveClash({
  game: wwe,
  a: { card: byId("big-show"), stat: 0, hp: START_HP, startHp: START_HP },
  b: { card: byId("big-show"), stat: 0, hp: START_HP, startHp: START_HP },
  event: null,
});
check(mirror.a.dealt === mirror.b.dealt, "a mirror match should deal equal damage both ways");
check(mirror.roundWinner === null, "a mirror match should have no round winner");
check(mirror.a.dealt >= 1, "even a stalemate should chip for at least 1");

// Attacking into a stat they are weak in must beat attacking into their best.
const intoWeak = resolveClash({
  game: wwe,
  a: { card: byId("big-show"), stat: 0, hp: START_HP, startHp: START_HP },
  b: { card: byId("rey-mysterio"), stat: 0, hp: START_HP, startHp: START_HP },
  event: null,
});
const intoStrong = resolveClash({
  game: wwe,
  a: { card: byId("big-show"), stat: 2, hp: START_HP, startHp: START_HP },
  b: { card: byId("rey-mysterio"), stat: 2, hp: START_HP, startHp: START_HP },
  event: null,
});
check(
  intoWeak.a.dealt > intoStrong.a.dealt,
  `picking the stat they are weak in should hurt more (${intoWeak.a.dealt} vs ${intoStrong.a.dealt})`
);

// The triangle has to be worth something, and be symmetrical about it.
const neutral = resolveClash({
  game: wwe,
  a: { card: byId("big-show"), stat: 0, hp: START_HP, startHp: START_HP },
  b: { card: byId("john-cena"), stat: 0, hp: START_HP, startHp: START_HP },
  event: null,
});
check(neutral.a.affinity === 0, "two powerhouses should be a neutral matchup");

// Nobody can be knocked below zero, or healed past where they started.
const late = resolveClash({
  game: wwe,
  a: { card: byId("undertaker"), stat: 0, hp: 2, startHp: START_HP },
  b: { card: byId("john-cena"), stat: 0, hp: 2, startHp: START_HP },
  event: null,
});
check(late.a.hpAfter >= 0 && late.b.hpAfter >= 0, "health must not go negative");
check(
  late.a.hpAfter <= START_HP && late.b.hpAfter <= START_HP,
  "health must not go above the starting value"
);

// A knockout blow must still let the other card's swing land — the round is
// simultaneous, so a double knockout is a draw and not a win on seat order.
check(
  late.a.dealt > 0 && late.b.dealt > 0,
  "both sides should land, however little health is left"
);

// Events hit both sides equally, so they can never decide a duel on their own.
const calm = resolveClash({
  game: wwe,
  a: { card: byId("big-show"), stat: 0, hp: START_HP, startHp: START_HP },
  b: { card: byId("kofi-kingston"), stat: 0, hp: START_HP, startHp: START_HP },
  event: null,
});
const loud = resolveClash({
  game: wwe,
  a: { card: byId("big-show"), stat: 0, hp: START_HP, startHp: START_HP },
  b: { card: byId("kofi-kingston"), stat: 0, hp: START_HP, startHp: START_HP },
  event: ROSTERS.wwe.events.find((e) => e.kind === "damage_up")!,
});
check(loud.a.dealt > calm.a.dealt, "damage_up should raise damage");
check(loud.roundWinner === calm.roundWinner, "an event should not flip who won the round");

// abilities_off has to actually switch everything off.
const quiet = resolveClash({
  game: wwe,
  a: { card: byId("brock-lesnar"), stat: 0, hp: START_HP, startHp: START_HP },
  b: { card: byId("kurt-angle"), stat: 0, hp: START_HP, startHp: START_HP },
  event: ROSTERS.wwe.events.find((e) => e.kind === "abilities_off")!,
});
const loudly = resolveClash({
  game: wwe,
  a: { card: byId("brock-lesnar"), stat: 0, hp: START_HP, startHp: START_HP },
  b: { card: byId("kurt-angle"), stat: 0, hp: START_HP, startHp: START_HP },
  event: null,
});
check(quiet.a.dealt !== loudly.a.dealt, "abilities_off should change the outcome of a clash");

// The invariant MAX_HIT exists to protect: sweep every card against every
// other card, on every stat, on the loudest round each game has, from the
// health where finishers are awake — and check nobody can be taken out in
// two. If this ever fails, the modifiers have started multiplying up again.
let worst = 0;
let worstWho = "";
const desperate = Math.ceil(START_HP * DESPERATE_AT);

for (const game of GAMES) {
  const loudest = ROSTERS[game.slug].events.find((e) => e.kind === "damage_up")!;
  for (const attacker of ROSTERS[game.slug].cards) {
    for (const defender of ROSTERS[game.slug].cards) {
      for (let stat = 0; stat < 6; stat++) {
        const r = resolveClash({
          game,
          a: { card: attacker, stat, hp: desperate, startHp: START_HP },
          b: { card: defender, stat, hp: START_HP, startHp: START_HP },
          event: loudest,
        });
        // What B lost this round: A's swing plus anything B reflected.
        if (r.b.taken > worst) {
          worst = r.b.taken;
          worstWho = `${attacker.name} (${game.stats[stat]}) into ${defender.name}`;
        }
      }
    }
  }
}

check(
  worst <= MAX_HIT + Math.round(MAX_HIT * 0.5),
  `a single round can take ${worst} health — the cap should be holding it near ${MAX_HIT}`
);
check(
  worst < START_HP / 2,
  `the worst round anywhere takes ${worst} of ${START_HP} — two of those would end a duel`
);
console.log(`\n  worst single round anywhere: ${worst} of ${START_HP}   (${worstWho})`);

/* ------------------------------ the endings ------------------------------ */

check(verdict({ hp: 20, damageDealt: 5 }, { hp: 0, damageDealt: 9 }, 4, 12) === "a", "0 hp loses");
check(verdict({ hp: 20, damageDealt: 5 }, { hp: 18, damageDealt: 9 }, 4, 12) === null, "duel goes on");
check(
  verdict({ hp: 20, damageDealt: 5 }, { hp: 20, damageDealt: 9 }, 12, 12) === "b",
  "level on health at the end should go on damage dealt"
);
check(
  verdict({ hp: 0, damageDealt: 9 }, { hp: 0, damageDealt: 9 }, 6, 12) === "draw",
  "a double knockout with equal damage is a draw"
);

/* --------------------------- input cleaning ------------------------------ */

check(cleanName("  Ravi   Kumar  ") === "Ravi Kumar", "name whitespace not collapsed");
check(cleanName("x".repeat(50)).length === 16, "name length not capped");
check(cleanName(null) === "", "non-string name should clean to empty");
check(cleanCode("abc-123!!") === "ABC123", `code cleaning wrong: ${cleanCode("abc-123!!")}`);
check(cleanCode("toolongcode") === "TOOLON", "code length not capped");

/* ------------------------------- verdict --------------------------------- */

const total = GAMES.reduce((n, g) => n + (ROSTERS[g.slug]?.cards.length ?? 0), 0);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `\nAll ${total} cards across ${GAMES.length} rosters check out, and so does the combat maths.`
);
