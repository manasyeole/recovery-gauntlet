import type { Game } from "@/lib/games/catalog";
import type { Card } from "@/lib/games/cards";

/**
 * A card's portrait.
 *
 * There is no photograph of Doc Gallows in this repo and there is not going to
 * be one — ninety-eight licensed images is a rights problem, not a design
 * problem. So the art is drawn instead, from the only thing every card already
 * has that is unique to it: its six numbers.
 *
 * The hexagon is the card's stat spread. A powerhouse comes out as a shape
 * leaning hard to one side; an all-rounder comes out nearly regular. That
 * means the picture is not decoration bolted onto the data — it *is* the data,
 * and after a few rounds people start recognising cards by their silhouette
 * before they have read the name. Which is the thing a good card face does.
 *
 * Everything else — the ray count, where the burst is rotated to, where the
 * two sparks sit — is seeded off the card id, so the ninety-eight faces are
 * visibly different from each other and identical between renders.
 *
 * If real artwork ever does turn up, `card.image` takes over the middle and
 * the rest of the frame stays exactly as it is.
 */

/** Small deterministic string hash. Same id, same face, forever. */
function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * The frame is cropped, not letterboxed: the panel is a wide rectangle and
 * this viewBox is square, so `slice` throws away a band off the top and the
 * bottom. How wide a band depends on the panel, which differs between the hand
 * and the deck grid — so everything that must survive stays inside a safe
 * middle third. That is what keeps RADIUS well under half the box.
 */
const CENTRE = 60;
const RADIUS = 30;

/** The i-th stat's vertex, at `value` out of 10. Flat-top hexagon. */
function vertex(i: number, value: number, radius = RADIUS): [number, number] {
  const angle = ((-90 + i * 60) * Math.PI) / 180;
  const r = (Math.max(0, Math.min(10, value)) / 10) * radius;
  return [CENTRE + r * Math.cos(angle), CENTRE + r * Math.sin(angle)];
}

function polygon(values: readonly number[], radius = RADIUS): string {
  return values.map((v, i) => vertex(i, v, radius).join(",")).join(" ");
}

/** A full-size hexagon at a fraction of the radius, for the grid rings. */
function ring(fraction: number): string {
  return polygon([10, 10, 10, 10, 10, 10], RADIUS * fraction);
}

export default function CardArt({
  game,
  card,
  compact = false,
}: {
  game: Game;
  card: Card;
  compact?: boolean;
}) {
  const seed = seedOf(card.id);
  const rays = 10 + (seed % 3) * 2;
  const spin = seed % 36;
  const gid = `art-${game.slug}-${card.id}`;

  return (
    // h-full, not auto: an SVG with a viewBox and no given height takes its
    // intrinsic aspect ratio, which for a square viewBox would make the art
    // panel as tall as the card is wide and push it over the name band.
    <div className="relative h-full w-full overflow-hidden" style={{ background: game.tint }}>
      <svg
        viewBox="0 0 120 120"
        className="block h-full w-full"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id={`${gid}-wash`} cx="50%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="58%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor={game.accent} stopOpacity="0.18" />
          </radialGradient>

          <radialGradient id={`${gid}-halo`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="68%" stopColor="#ffffff" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={game.accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={game.ink} stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* The burst behind everything, rotated per card. */}
        <g transform={`rotate(${spin} ${CENTRE} ${CENTRE})`} opacity="0.16">
          {Array.from({ length: rays }, (_, i) => {
            const a = (360 / rays) * i;
            return (
              <rect
                key={i}
                x={CENTRE - 1.6}
                y={-14}
                width="3.2"
                height={CENTRE + 14}
                fill={game.ink}
                transform={`rotate(${a} ${CENTRE} ${CENTRE})`}
              />
            );
          })}
        </g>

        <rect width="120" height="120" fill={`url(#${gid}-wash)`} />

        {/* The grid the stat shape is read against. */}
        <g fill="none" stroke={game.ink} strokeOpacity="0.14" strokeWidth="0.6">
          <polygon points={ring(1)} />
          <polygon points={ring(0.66)} />
          <polygon points={ring(0.33)} />
          {Array.from({ length: 6 }, (_, i) => {
            const [x, y] = vertex(i, 10);
            return <line key={i} x1={CENTRE} y1={CENTRE} x2={x} y2={y} />;
          })}
        </g>

        {/* The card itself, as a shape. */}
        <polygon
          points={polygon(card.stats)}
          fill={`url(#${gid}-fill)`}
          stroke={game.ink}
          strokeOpacity="0.55"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {card.stats.map((v, i) => {
          const [x, y] = vertex(i, v);
          return <circle key={i} cx={x} cy={y} r="1.9" fill={game.ink} fillOpacity="0.75" />;
        })}

        {/* Two sparks, placed off the seed, so no two faces sit identically. */}
        <circle
          cx={16 + (seed % 13)}
          cy={32 + ((seed >> 3) % 9)}
          r="1.7"
          fill={game.ink}
          fillOpacity="0.3"
        />
        <circle
          cx={94 + ((seed >> 5) % 10)}
          cy={78 + ((seed >> 7) % 9)}
          r="2.4"
          fill={game.ink}
          fillOpacity="0.22"
        />

        {/* Keeps the emoji legible over whatever shape landed underneath. */}
        <circle cx={CENTRE} cy={CENTRE} r="24" fill={`url(#${gid}-halo)`} />
      </svg>

      {/* The subject, over the top. An <img> when there is one, the emoji
          otherwise — both sit in the same place so the frame never shifts. */}
      <div className="absolute inset-0 grid place-items-center">
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.image}
            alt=""
            className={`object-contain drop-shadow ${compact ? "h-14 w-14" : "h-20 w-20"}`}
            loading="lazy"
          />
        ) : (
          <span
            aria-hidden
            className={`leading-none ${compact ? "text-[2.6rem]" : "text-[3.6rem]"}`}
            style={{ filter: "drop-shadow(0 2px 3px rgb(42 36 34 / 0.22))" }}
          >
            {card.emoji}
          </span>
        )}
      </div>
    </div>
  );
}
