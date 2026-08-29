/**
 * Integrity pass over the question banks and the scoring rules.
 *
 *   npm run check:questions
 *
 * A quiz breaks quietly: an answer index off by one, two questions sharing an
 * id, two identical choices in the same four. None of that fails a build or a
 * typecheck, and all of it is obvious to whoever is playing. So it is checked
 * here instead — no test framework, just Node reading the app's own modules.
 */
import { registerHooks } from "node:module";

/**
 * The app is written for a bundler, so its imports have no file extensions.
 * Node's ESM resolver insists on them. Rather than uglify seven source files
 * to suit one script, teach this process to retry with `.ts`.
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
const { GAMES } = await import("../lib/games/catalog.ts");
const { cleanCode, cleanName, scoreAnswer } = await import("../lib/games/protocol.ts");
const { BANKS } = await import("../lib/games/questions/index.ts");

const problems: string[] = [];
const check = (cond: unknown, msg: string) => {
  if (!cond) problems.push(msg);
};

/* ---------------------------- the banks -------------------------------- */

for (const game of GAMES) {
  const bank = BANKS[game.slug];
  check(bank !== undefined && bank.length > 0, `${game.slug}: no question bank`);
  if (!bank) continue;

  const ids = new Set<string>();
  const prompts = new Set<string>();

  for (const q of bank) {
    const where = `${game.slug}/${q.id}`;
    check(!ids.has(q.id), `${where}: duplicate id`);
    ids.add(q.id);

    check(!prompts.has(q.prompt), `${where}: duplicate prompt`);
    prompts.add(q.prompt);

    check(q.choices.length === 4, `${where}: has ${q.choices.length} choices, want 4`);
    check(new Set(q.choices).size === 4, `${where}: two choices are identical`);
    check(
      Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3,
      `${where}: answer index is ${q.answer}`
    );
    check(q.prompt.trim().length > 8, `${where}: prompt looks empty`);
    for (const choice of q.choices) {
      check(choice.trim().length > 0, `${where}: empty choice`);
    }
  }

  console.log(`  ${game.slug.padEnd(11)} ${String(bank.length).padStart(3)} questions`);
}

/* --------------------------- the scoring -------------------------------- */

const roundMs = 20_000;
const instant = scoreAnswer({ correct: true, msTaken: 0, roundMs, streak: 0 });
const buzzer = scoreAnswer({ correct: true, msTaken: roundMs, roundMs, streak: 0 });
const wrongButFast = scoreAnswer({ correct: false, msTaken: 0, roundMs, streak: 9 });
const thirdInARow = scoreAnswer({ correct: true, msTaken: roundMs, roundMs, streak: 2 });

check(instant === 200, `instant correct should be 200, got ${instant}`);
check(buzzer === 100, `on-the-buzzer correct should be 100, got ${buzzer}`);
check(wrongButFast === 0, `wrong should score nothing, got ${wrongButFast}`);
check(thirdInARow === 125, `third in a row should be 125, got ${thirdInARow}`);
check(buzzer > wrongButFast, "a slow right answer must beat a fast wrong one");
check(instant > buzzer, "speed must be worth something");

/* --------------------------- input cleaning ----------------------------- */

check(cleanName("  Ravi   Kumar  ") === "Ravi Kumar", "name whitespace not collapsed");
check(cleanName("x".repeat(50)).length === 16, "name length not capped");
check(cleanName(null) === "", "non-string name should clean to empty");
check(cleanCode("abc-123!!") === "ABC123", `code cleaning wrong: ${cleanCode("abc-123!!")}`);
check(cleanCode("toolongcode") === "TOOLON", "code length not capped");

/* ------------------------------ verdict --------------------------------- */

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\nAll question banks and scoring rules check out.");
