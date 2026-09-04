/**
 * Plays whole duels, bot against bot, and checks the game is worth playing.
 *
 *   npm run sim:duels
 *
 * `check:cards` proves each card is legal. This proves the *game* works, which
 * is a different question and not one you can answer by reading:
 *
 *   - does a duel always end, and after how many rounds;
 *   - is either chair better than the other (it must not be — both sides swing
 *     from the same snapshot, so any bias here is a bug in resolveClash);
 *   - does the MAX_HIT ceiling really keep every duel to at least three
 *     rounds, across every card pairing the deal can produce;
 *   - and does a harder bot actually beat an easier one, which is the only
 *     honest test of whether the choices in a round mean anything. If `hard`
 *     and `easy` finish level, the stat you pick does not matter and the
 *     game is a coin toss with nice artwork.
 *
 * It mirrors the loop in engine.resolveRound rather than calling it, because
 * that one needs Postgres and this needs to run anywhere. If the two ever
 * drift, this is the copy to fix.
 */
import { registerHooks } from "node:module";

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

const { GAMES } = await import("../lib/games/catalog.ts");
const { findCard, findEvent } = await import("../lib/games/cards/index.ts");
const { botPlay } = await import("../lib/games/ai.ts");
const { dealDeck, drawEvents, drawUp, openingHand } = await import("../lib/games/deal.ts");
const { HAND_SIZE, resolveClash, START_HP, verdict } = await import("../lib/games/rules.ts");

type Difficulty = "easy" | "normal" | "hard";
type Game = (typeof GAMES)[number];

interface Fighter {
  hand: string[];
  deck: string[];
  discard: string[];
  hp: number;
  damageDealt: number;
  roundsWon: number;
  difficulty: Difficulty;
}

const problems: string[] = [];
const MAX_ROUNDS = 12;
const PER_DECK = 300;

/** One duel, start to finish. Throws on anything that should be impossible. */
function playDuel(game: Game, diffA: Difficulty, diffB: Difficulty) {
  const slug = game.slug;
  const events = drawEvents(slug, MAX_ROUNDS);

  const seat = (difficulty: Difficulty): Fighter => {
    const { hand, rest } = openingHand(dealDeck(slug));
    return { hand, deck: rest, discard: [], hp: START_HP, damageDealt: 0, roundsWon: 0, difficulty };
  };

  const a = seat(diffA);
  const b = seat(diffB);

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const eventId = events[round - 1];
    const event = eventId ? findEvent(slug, eventId) ?? null : null;

    const choose = (me: Fighter, them: Fighter) =>
      botPlay({
        game,
        hand: me.hand,
        hp: me.hp,
        opponentHp: them.hp,
        startHp: START_HP,
        opponentSeen: them.discard,
        event,
        difficulty: me.difficulty,
      });

    const pickA = choose(a, b);
    const pickB = choose(b, a);

    // The bot must never reach for a card it is not holding — the play route
    // would refuse it, and in a solo duel that would wedge the round.
    if (!a.hand.includes(pickA.cardId)) throw new Error(`${slug}: bot played outside its hand`);
    if (!b.hand.includes(pickB.cardId)) throw new Error(`${slug}: bot played outside its hand`);

    const cardA = findCard(slug, pickA.cardId);
    const cardB = findCard(slug, pickB.cardId);
    if (!cardA || !cardB) throw new Error(`${slug}: bot played an unknown card`);

    const clash = resolveClash({
      game,
      a: { card: cardA, stat: pickA.stat, hp: a.hp, startHp: START_HP },
      b: { card: cardB, stat: pickB.stat, hp: b.hp, startHp: START_HP },
      event,
    });

    const settle = (
      side: Fighter,
      result: (typeof clash)["a"],
      played: string,
      won: boolean
    ) => {
      side.hp = result.hpAfter;
      side.damageDealt += result.dealt;
      if (won) side.roundsWon++;
      const next = drawUp(
        side.hand.filter((id) => id !== played),
        side.deck,
        [...side.discard, played]
      );
      side.hand = next.hand;
      side.deck = next.deck;
      side.discard = next.discard;
      if (side.hand.length === 0) throw new Error(`${slug}: ran out of cards entirely`);
      if (side.hand.length > HAND_SIZE) throw new Error(`${slug}: hand overfilled`);
    };

    settle(a, clash.a, pickA.cardId, clash.roundWinner === "a");
    settle(b, clash.b, pickB.cardId, clash.roundWinner === "b");

    const call = verdict(
      { hp: a.hp, damageDealt: a.damageDealt },
      { hp: b.hp, damageDealt: b.damageDealt },
      round,
      MAX_ROUNDS
    );
    if (call !== null) {
      return { winner: call, rounds: round, knockout: a.hp <= 0 || b.hp <= 0 };
    }
  }

  throw new Error(`${slug}: a duel ran past ${MAX_ROUNDS} rounds without ending`);
}

/* ---------------------------- deck by deck ------------------------------ */

console.log(`Per deck, ${PER_DECK} duels, normal against normal:\n`);

const lengths: number[] = [];

for (const game of GAMES) {
  let first = 0;
  let second = 0;
  let drawn = 0;
  let knockouts = 0;
  let rounds = 0;

  for (let i = 0; i < PER_DECK; i++) {
    const r = playDuel(game, "normal", "normal");
    if (r.winner === "a") first++;
    else if (r.winner === "b") second++;
    else drawn++;
    if (r.knockout) knockouts++;
    rounds += r.rounds;
    lengths.push(r.rounds);
  }

  const average = rounds / PER_DECK;
  const bias = Math.abs(first - second) / PER_DECK;

  console.log(
    `  ${game.slug.padEnd(11)} seat0 ${String(first).padStart(3)}  seat1 ${String(second).padStart(3)}` +
      `  draw ${String(drawn).padStart(2)}   ${average.toFixed(1)} rounds   ` +
      `${Math.round((knockouts / PER_DECK) * 100)}% knockout`
  );

  // Two identical bots must finish level. A gap here means the engine favours
  // a chair, which would be the worst possible bug in a simultaneous game.
  if (bias > 0.18) {
    problems.push(`${game.slug}: seat 0 wins ${Math.round(bias * 100)}% more often than seat 1`);
  }
  if (average < 3) {
    problems.push(`${game.slug}: duels average only ${average.toFixed(1)} rounds`);
  }
}

const sorted = [...lengths].sort((x, y) => x - y);
const shortest = sorted[0];
console.log(
  `\n  duel length: shortest ${shortest}, median ${sorted[Math.floor(sorted.length / 2)]}, ` +
    `longest ${sorted[sorted.length - 1]} of ${MAX_ROUNDS}`
);

// The invariant MAX_HIT exists for. See the note on it in lib/games/rules.ts.
if (shortest < 3) {
  problems.push(`a duel ended in ${shortest} rounds — the MAX_HIT ceiling should prevent that`);
}

/* --------------------------- the difficulty ladder ----------------------- */

console.log("\nDifficulty ladder:");

for (const [stronger, weaker] of [
  ["hard", "easy"],
  ["hard", "normal"],
  ["normal", "easy"],
] as const) {
  let wins = 0;
  let decided = 0;

  for (const game of GAMES) {
    for (let i = 0; i < 90; i++) {
      // Alternate chairs, so this measures the bot and not the seat.
      const strongerFirst = i % 2 === 0;
      const r = playDuel(
        game,
        strongerFirst ? stronger : weaker,
        strongerFirst ? weaker : stronger
      );
      if (r.winner === "draw") continue;
      decided++;
      if ((r.winner === "a") === strongerFirst) wins++;
    }
  }

  const rate = Math.round((wins / decided) * 100);
  console.log(`  ${stronger.padEnd(7)} vs ${weaker.padEnd(7)} ${rate}% to ${stronger}`);

  // If these come out level, the stat you pick does not matter.
  if (rate <= 52) {
    problems.push(`${stronger} should beat ${weaker} — got ${rate}%, which is a coin toss`);
  }
}

/* ------------------------------- verdict --------------------------------- */

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\nDuels terminate, both chairs are even, and playing better wins more.");
