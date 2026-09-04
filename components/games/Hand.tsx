"use client";

import type { Game } from "@/lib/games/catalog";
import type { Card } from "@/lib/games/cards";
import PlayingCard from "./PlayingCard";

/**
 * Your hand, held the way a hand is held.
 *
 * Worth the trouble for a reason beyond looking like cards: four cards laid
 * out flat on a phone are four small rectangles you scroll past, and a fan is
 * one object you pick from. The chosen card rising clear of the others is also
 * the only "this is the one I am playing" signal the screen needs.
 *
 * Geometry: spacing and tilt are set independently, which is the whole trick.
 * Rotating every card about one distant pivot — the obvious way to draw an arc
 * — spreads them by `pivot × sin(angle)`, and any angle small enough to look
 * like a hand leaves them stacked almost on top of each other. So each card is
 * *moved* sideways by a fixed gap, *tilted* a few degrees, and *dropped* a
 * little further the further it sits from the middle. The arc comes out of the
 * drop, not the rotation.
 *
 * The gap is a clamp rather than a constant because the fan has to fit across
 * a 320px phone without running off the side, and look like a hand on a
 * desktop.
 */

/** Degrees of tilt per card away from the middle. */
const TILT = 5;
/** How far the outermost cards sit below the middle one, in px. */
const ARC = 11;
/** How far the chosen card lifts clear, in px. */
const LIFT = 16;

export default function Hand({
  game,
  cards,
  selectedId,
  onSelect,
  disabled = false,
}: {
  game: Game;
  cards: readonly Card[];
  selectedId: string | null;
  onSelect: (cardId: string) => void;
  /** After you've committed: the hand stays visible but stops responding. */
  disabled?: boolean;
}) {
  const count = cards.length;
  if (count === 0) return null;

  const middle = (count - 1) / 2;

  return (
    <div
      className="card-stage relative mx-auto w-full"
      style={
        {
          // A compact card is about 19rem; the rest is the lift on the chosen
          // one plus what a tilted rectangle needs for its corners. Reserved
          // rather than measured, so nothing below the fan moves when a card
          // pops out of it.
          height: "22rem",
          "--fan-gap": "clamp(2.9rem, 15vw, 4.4rem)",
        } as React.CSSProperties
      }
    >
      {cards.map((card, i) => {
        // -1.5, -0.5, 0.5, 1.5 for a hand of four.
        const offset = i - middle;
        const chosen = selectedId === card.id;

        const tilt = offset * TILT;

        // The arc: the further from the middle, the lower the card sits, so
        // their top edges curve the way a fan held in one hand does. Measured
        // from ARC *above* the baseline rather than below it, so the lowest
        // card in the fan lands on the container's bottom edge instead of the
        // outer pair hanging past it into whatever is underneath.
        const dip = (middle === 0 ? 0 : (offset / middle) ** 2 * ARC) - ARC;

        // The chosen card keeps its place in the fan and simply stands up out
        // of it — straightened, lifted and slightly larger. Sliding it
        // sideways as well would make the hand rearrange itself every time you
        // changed your mind.
        const transform = chosen
          ? `translate(calc(-50% + (${offset} * var(--fan-gap))), ${dip - LIFT}px) scale(1.07)`
          : `translate(calc(-50% + (${offset} * var(--fan-gap))), ${dip}px) rotate(${tilt}deg)`;

        return (
          <div
            key={card.id}
            className="deal-in absolute bottom-0 left-1/2 w-[7.6rem] sm:w-[8.6rem]"
            style={{
              // Staggered, so a fresh hand is dealt rather than appearing.
              animationDelay: `${i * 70}ms`,
              zIndex: chosen ? 30 : i,
            }}
          >
            <div
              className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform, transformOrigin: "50% 90%" }}
            >
              <PlayingCard
                game={game}
                card={card}
                compact
                selected={chosen}
                // Only fade the others once one has actually been chosen — a
                // locked hand with nothing picked (the lobby) shouldn't look
                // like every card in it is unavailable.
                dimmed={disabled && selectedId !== null && !chosen}
                onSelect={disabled ? undefined : () => onSelect(card.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
