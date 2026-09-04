import type { Roster } from "./types";

/**
 * Stats, in order: HP, Attack, Defense, Sp. Atk, Sp. Def, Speed.
 * Affinity cycle: fire ▸ grass ▸ water ▸ fire.
 *
 * The roster is deliberately all-Kanto and all three starter types, because
 * the affinity triangle only has three seats and this is the one triangle
 * everybody already knows.
 *
 * Stats are the real base stats squashed onto the 1–10 scale the rest of the
 * shelf uses, then nudged to hit the rarity budget — so the shapes are right
 * even though the numbers aren't the Pokédex's.
 */
export const pokemon: Roster = {
  cards: [
    /* ------------------------------ legends ------------------------------ */
    {
      id: "charizard",
      name: "Charizard",
      title: "No. 006 · Flame Pokémon",
      emoji: "🔥",
      affinity: "fire",
      rarity: "legend",
      stats: [8, 8, 6, 10, 7, 9],
      ability: {
        kind: "finisher",
        value: 60,
        name: "Blast Burn",
        text: "Below a third of your health, deals 60% more damage.",
      },
    },
    {
      id: "blastoise",
      name: "Blastoise",
      title: "No. 009 · Shellfish Pokémon",
      emoji: "💧",
      affinity: "water",
      rarity: "legend",
      stats: [8, 8, 10, 8, 9, 5],
      ability: {
        kind: "guard",
        value: 45,
        name: "Shell Armor",
        text: "Cuts incoming damage by 45%.",
      },
    },

    /* ------------------------------- epics ------------------------------- */
    {
      id: "venusaur",
      name: "Venusaur",
      title: "No. 003 · Seed Pokémon",
      emoji: "🌿",
      affinity: "grass",
      rarity: "epic",
      stats: [8, 7, 7, 8, 8, 5],
      ability: {
        kind: "drain",
        value: 45,
        name: "Giga Drain",
        text: "Heals 45% of the damage it deals.",
      },
    },
    {
      id: "gyarados",
      name: "Gyarados",
      title: "No. 130 · Atrocious Pokémon",
      emoji: "🐲",
      affinity: "water",
      rarity: "epic",
      stats: [8, 10, 7, 6, 7, 5],
      ability: {
        kind: "surge",
        value: 3,
        name: "Dragon Rage",
        text: "Adds 3 to the stat it attacks with.",
      },
    },
    {
      id: "arcanine",
      name: "Arcanine",
      title: "No. 059 · Legendary Pokémon",
      emoji: "🐕",
      affinity: "fire",
      rarity: "epic",
      stats: [8, 9, 6, 7, 6, 7],
      ability: {
        kind: "pierce",
        value: 35,
        name: "Extreme Speed",
        text: "Ignores 35% of whatever is defending.",
      },
    },

    /* ------------------------------- rares ------------------------------- */
    {
      id: "exeggutor",
      name: "Exeggutor",
      title: "No. 103 · Coconut Pokémon",
      emoji: "🥥",
      affinity: "grass",
      rarity: "rare",
      stats: [8, 7, 6, 9, 5, 3],
      ability: {
        kind: "riposte",
        value: 35,
        name: "Psychic",
        text: "Sends 35% of the damage it takes straight back.",
      },
    },
    {
      id: "vaporeon",
      name: "Vaporeon",
      title: "No. 134 · Bubble Jet Pokémon",
      emoji: "🌊",
      affinity: "water",
      rarity: "rare",
      stats: [10, 6, 5, 7, 7, 3],
      ability: {
        kind: "rally",
        value: 7,
        name: "Aqua Ring",
        text: "Heals 7 the moment it is turned over.",
      },
    },
    {
      id: "ninetales",
      name: "Ninetales",
      title: "No. 038 · Fox Pokémon",
      emoji: "🦊",
      affinity: "fire",
      rarity: "rare",
      stats: [6, 5, 6, 7, 9, 5],
      ability: {
        kind: "guard",
        value: 35,
        name: "Confuse Ray",
        text: "Cuts incoming damage by 35%.",
      },
    },
    {
      id: "victreebel",
      name: "Victreebel",
      title: "No. 071 · Flycatcher Pokémon",
      emoji: "🪴",
      affinity: "grass",
      rarity: "rare",
      stats: [6, 8, 5, 8, 5, 6],
      ability: {
        kind: "drain",
        value: 40,
        name: "Leech Life",
        text: "Heals 40% of the damage it deals.",
      },
    },

    /* ------------------------------ commons ------------------------------ */
    {
      id: "poliwrath",
      name: "Poliwrath",
      title: "No. 062 · Tadpole Pokémon",
      emoji: "🌀",
      affinity: "water",
      rarity: "common",
      stats: [6, 7, 6, 5, 6, 3],
      ability: {
        kind: "surge",
        value: 2,
        name: "Belly Drum",
        text: "Adds 2 to the stat it attacks with.",
      },
    },
    {
      id: "magmar",
      name: "Magmar",
      title: "No. 126 · Spitfire Pokémon",
      emoji: "🌋",
      affinity: "fire",
      rarity: "common",
      stats: [5, 6, 4, 7, 5, 6],
      ability: {
        kind: "pierce",
        value: 30,
        name: "Fire Punch",
        text: "Ignores 30% of whatever is defending.",
      },
    },
    {
      id: "tangela",
      name: "Tangela",
      title: "No. 114 · Vine Pokémon",
      emoji: "🧶",
      affinity: "grass",
      rarity: "common",
      stats: [5, 4, 9, 6, 4, 5],
      ability: {
        kind: "guard",
        value: 30,
        name: "Ingrain",
        text: "Cuts incoming damage by 30%.",
      },
    },
    {
      id: "golduck",
      name: "Golduck",
      title: "No. 055 · Duck Pokémon",
      emoji: "🦆",
      affinity: "water",
      rarity: "common",
      stats: [6, 6, 5, 6, 5, 5],
      ability: {
        kind: "riposte",
        value: 30,
        name: "Confusion",
        text: "Sends 30% of the damage it takes straight back.",
      },
    },
    {
      id: "growlithe",
      name: "Growlithe",
      title: "No. 058 · Puppy Pokémon",
      emoji: "🐶",
      affinity: "fire",
      rarity: "common",
      stats: [5, 6, 4, 5, 4, 9],
      ability: {
        kind: "finisher",
        value: 45,
        name: "Flame Wheel",
        text: "Below a third of your health, deals 45% more damage.",
      },
    },
  ],

  events: [
    {
      id: "super-effective",
      name: "It's Super Effective!",
      text: "Everything lands clean this turn. Damage up 50%.",
      kind: "damage_up",
      value: 50,
      emoji: "💥",
    },
    {
      id: "light-screen",
      name: "Light Screen",
      text: "A wall of light over the whole field. Damage down 40%.",
      kind: "damage_down",
      value: 40,
      emoji: "🔆",
    },
    {
      id: "reflect",
      name: "Reflect",
      text: "Everything defends 2 better behind it.",
      kind: "defense_up",
      value: 2,
      emoji: "🪞",
    },
    {
      id: "pokemon-center",
      name: "A Pokémon Center",
      text: "We hope to see you again. Both sides recover 4.",
      kind: "heal_both",
      value: 4,
      emoji: "🏥",
    },
    {
      id: "normalize",
      name: "Normalize",
      text: "Everything is Normal-type for a turn. No type matchups.",
      kind: "no_affinity",
      value: 0,
      emoji: "⚪",
    },
    {
      id: "neutralizing-gas",
      name: "Neutralizing Gas",
      text: "Every ability on the field is switched off.",
      kind: "abilities_off",
      value: 0,
      emoji: "☁️",
    },
  ],
};
