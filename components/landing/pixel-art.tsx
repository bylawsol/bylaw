import * as React from "react";

// Deterministic hash → [0,1). No Math.random / Date so SSR and client render
// identical markup (no hydration mismatch).
function rng(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * The hero centerpiece: a colourful blocky "payout flow" that streams from a
 * dense pink cluster (bottom-left) up to a lighter blue tail (top-right).
 * Pure SVG, no assets.
 */
export function HeroPixelFlow({ className }: { className?: string }) {
  const COLS = 28;
  const ROWS = 24;
  const CELL = 22;
  const GAP = 5;
  const step = CELL + GAP;

  const blocks: { x: number; y: number; op: number; white?: boolean }[] = [];
  for (let x = 0; x < COLS; x++) {
    const centerY = ROWS * (0.84 - 0.66 * (x / (COLS - 1)));
    for (let y = 0; y < ROWS; y++) {
      const dist = Math.abs(y - centerY);
      const band = Math.max(0, 1 - dist / (ROWS * 0.32));
      const n = rng(x, y);
      const prob = band * 0.93 + 0.035;
      if (n < prob) {
        const white = rng(x * 2 + 3, y + 7) > 0.94;
        blocks.push({ x, y, op: Math.min(1, 0.3 + band * 0.8), white });
      }
    }
  }

  const w = COLS * step - GAP;
  const h = ROWS * step - GAP;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label="Abstract pixelated payout-flow graphic"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="bylawFlow" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF8FA3" />
          <stop offset="40%" stopColor="#D2A2EC" />
          <stop offset="70%" stopColor="#B8B3FF" />
          <stop offset="100%" stopColor="#9FB6FF" />
        </linearGradient>
      </defs>
      {blocks.map((b, i) =>
        b.white ? (
          <rect
            key={i}
            x={b.x * step}
            y={b.y * step}
            width={CELL}
            height={CELL}
            rx={6}
            fill="#FFFDF7"
          />
        ) : (
          <rect
            key={i}
            x={b.x * step}
            y={b.y * step}
            width={CELL}
            height={CELL}
            rx={6}
            fill="url(#bylawFlow)"
            opacity={b.op}
          />
        ),
      )}
    </svg>
  );
}

/**
 * A single cohesive pixel-gradient "wave" — a solid diagonal mass with jagged
 * pixel edges rising from a pink base (bottom-left) to a blue crest (top-right).
 * Reads as one designed object, not scattered particles.
 */
export function HeroPixelWave({ className }: { className?: string }) {
  const COLS = 22;
  const ROWS = 16;
  const CELL = 24;
  const GAP = 5;
  const step = CELL + GAP;

  const cells: { x: number; y: number; white?: boolean }[] = [];
  for (let x = 0; x < COLS; x++) {
    const t = x / (COLS - 1);
    // Band centre rises left → right; jagged, pixelated top/bottom edges.
    const centerY = ROWS * (0.6 - 0.26 * t);
    const half = ROWS * 0.34;
    const top = Math.round(centerY - half) + Math.round(rng(x, 1) * 1.6);
    const bot = Math.round(centerY + half) - Math.round(rng(x, 2) * 1.6);
    for (let y = top; y <= bot; y++) {
      if (y < 0 || y >= ROWS) continue;
      // Sparse, clustered cream cutouts for texture — not holey.
      cells.push({ x, y, white: rng(x * 3 + 1, y + 5) > 0.93 });
    }
    // One soft leading pixel near the crest for energy (kept adjacent).
    if (t > 0.5 && rng(x, 9) > 0.68) {
      const ly = top - 1;
      if (ly >= 0) cells.push({ x, y: ly });
    }
  }

  const w = COLS * step - GAP;
  const h = ROWS * step - GAP;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label="Abstract pixel-gradient payout wave"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Horizontal so pink clearly leads the left, blue the right. */}
        <linearGradient id="bylawWave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF8FA3" />
          <stop offset="38%" stopColor="#CD8CE8" />
          <stop offset="68%" stopColor="#B8B3FF" />
          <stop offset="100%" stopColor="#9FB6FF" />
        </linearGradient>
      </defs>
      {cells.map((c, i) =>
        c.white ? (
          <rect
            key={i}
            x={c.x * step}
            y={c.y * step}
            width={CELL}
            height={CELL}
            rx={6}
            fill="#FBF8F1"
          />
        ) : (
          <rect
            key={i}
            x={c.x * step}
            y={c.y * step}
            width={CELL}
            height={CELL}
            rx={6}
            fill="url(#bylawWave)"
          />
        ),
      )}
    </svg>
  );
}

/**
 * The hero's main visual: a bold, connected pixel-gradient wave that rises from
 * the centre and forks toward the upper-right and lower-right. Solid clusters
 * (not scattered dots), an organic silhouette, a few cream cutouts inside the
 * dense body, and a handful of satellite blocks shedding off the edge.
 */
export function HeroPixelField({ className }: { className?: string }) {
  const COLS = 26;
  const ROWS = 17;
  const CELL = 20;
  const GAP = 11;
  const step = CELL + GAP;

  const filled: { cx: number; cy: number; op: number }[] = [];
  const cutoutCand: { cx: number; cy: number }[] = [];
  const satCand: { cx: number; cy: number }[] = [];

  for (let cx = 0; cx < COLS; cx++) {
    for (let cy = 0; cy < ROWS; cy++) {
      const fx = cx / (COLS - 1); // 0 left → 1 right
      const fy = cy / (ROWS - 1); // 0 top → 1 bottom
      // Flow line rises to the right, then forks into two prongs past centre.
      const mid = 0.52 - 0.22 * fx;
      const spread = Math.max(0, (fx - 0.46) / 0.54) * 0.3;
      const hw = 0.22;
      const up = 1 - Math.abs(fy - (mid - spread)) / hw;
      const dn = 1 - Math.abs(fy - (mid + spread)) / hw;
      const env = Math.max(0, up, dn);
      const hx = Math.min(1, Math.max(0, (fx - 0.04) / 0.4));
      const density = env * hx;
      const jitter = (rng(cx, cy) - 0.5) * 0.16; // organic, jagged edge
      if (density + jitter > 0.36) {
        filled.push({ cx, cy, op: Math.min(1, 0.6 + density * 0.5) });
        if (density > 0.62) cutoutCand.push({ cx, cy });
      } else if (density > 0.18) {
        satCand.push({ cx, cy });
      }
    }
  }

  // 6–10 cream cutouts inside dense areas.
  const cutoutSet = new Set(
    cutoutCand
      .filter((c) => rng(c.cx * 5 + 1, c.cy * 7 + 3) > 0.82)
      .slice(0, 9)
      .map((c) => `${c.cx}-${c.cy}`),
  );
  // 8–12 satellite blocks just off the edge.
  const chosenSats = satCand
    .filter((c) => rng(c.cx * 3 + 2, c.cy * 9 + 5) > 0.85)
    .slice(0, 11);

  const w = COLS * step - GAP;
  const h = ROWS * step - GAP;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      role="img"
      aria-label="Abstract colourful treasury-flow pixel wave"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="bylawField"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={h}
          x2={w}
          y2="0"
        >
          <stop offset="0%" stopColor="#FF8FA3" />
          <stop offset="28%" stopColor="#E483C9" />
          <stop offset="55%" stopColor="#BE9CF2" />
          <stop offset="80%" stopColor="#A6ADFF" />
          <stop offset="100%" stopColor="#9FB6FF" />
        </linearGradient>
      </defs>
      {filled.map((c, i) => {
        const white = cutoutSet.has(`${c.cx}-${c.cy}`);
        return (
          <rect
            key={`f${i}`}
            x={c.cx * step}
            y={c.cy * step}
            width={CELL}
            height={CELL}
            rx={6}
            fill={white ? "#FBF8F1" : "url(#bylawField)"}
            opacity={white ? 0.96 : c.op}
          />
        );
      })}
      {chosenSats.map((c, i) => (
        <rect
          key={`s${i}`}
          x={c.cx * step}
          y={c.cy * step}
          width={CELL}
          height={CELL}
          rx={6}
          fill="url(#bylawField)"
          opacity={0.42}
        />
      ))}
    </svg>
  );
}

// Space-invader-style sprites (glyphs, not the real game art) for the dark
// feature cards. Rendered as rounded pixels in a single tint on a dark panel.
const SPRITES: Record<string, string[]> = {
  worm: [
    "00100000100",
    "00110001100",
    "01111111110",
    "11101110111",
    "11111111111",
    "10111111101",
    "10100000101",
    "00011011000",
  ],
  crab: [
    "00100100",
    "01111110",
    "11011011",
    "11111111",
    "01111110",
    "00100100",
    "01000010",
    "10000001",
  ],
};

export function PixelSprite({
  variant = "worm",
  color = "#FFD6DC",
  className,
}: {
  variant?: "worm" | "crab";
  color?: string;
  className?: string;
}) {
  const grid = SPRITES[variant] ?? SPRITES.worm;
  const rows = grid.length;
  const cols = grid[0].length;

  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === "1") cells.push({ x, y });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      className={className}
      role="img"
      aria-label={`Pixel ${variant} glyph`}
      preserveAspectRatio="xMidYMid meet"
    >
      {cells.map((c, i) => (
        <rect
          key={i}
          x={c.x + 0.08}
          y={c.y + 0.08}
          width={0.84}
          height={0.84}
          rx={0.2}
          fill={color}
        />
      ))}
    </svg>
  );
}

/** A tiny pixel-block motif used inside feature cards. */
export function PixelChips({
  colors,
  className,
}: {
  colors: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      {colors.map((c, i) => (
        <span
          key={i}
          className="inline-block size-3.5 rounded-[4px]"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
