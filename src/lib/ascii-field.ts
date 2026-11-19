/**
 * Deterministic ASCII "density fields" — the dithered character corners on the
 * email preview card. Seeded, so server and client render identical markup.
 */

/** Light → dense. Index 0 is blank. */
const RAMP = " .:-=+*#%$";

/** Mulberry32: tiny seeded PRNG, good enough for texture. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface FieldOptions {
  rows: number;
  cols: number;
  seed: number;
  /** Which corner the dense end sits in. */
  corner: "top-left" | "bottom-right";
}

/**
 * A triangular gradient of characters: densest in `corner`, thinning out with
 * noisy edges and a few stray marks past the boundary.
 */
export function asciiField({ rows, cols, seed, corner }: FieldOptions): string {
  const random = seeded(seed);
  const lines: string[] = [];

  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      const distance = col / cols + (row / rows) * 1.15;
      const value = 1 - distance + (random() - 0.5) * 0.45;
      const stray = random() < 0.035 ? 0.12 : 0;
      const intensity = Math.max(value, stray);
      const index = intensity <= 0.08 ? 0 : Math.min(RAMP.length - 1, Math.ceil(intensity * 9));
      line += RAMP[index] ?? " ";
    }
    lines.push(line);
  }

  if (corner === "bottom-right") {
    return lines
      .reverse()
      .map((line) => line.split("").reverse().join(""))
      .join("\n");
  }
  return lines.join("\n");
}
