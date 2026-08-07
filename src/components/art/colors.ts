// Colour maths shared by the illustration system.
//
// Every glyph is drawn in two tones taken from a single accent: the accent
// itself for the "ink" strokes, and the accent mixed down into the surface for
// the soft fills. Deriving the second tone rather than hard-coding it means a
// glyph drops onto any habit colour — or either theme — and stays coherent.

/** Mix `hex` with `bg` by `ratio` (1 = pure hex, 0 = pure bg). */
export const mix = (hex: string, ratio: number, bg: string): string => {
  const parse = (value: string) => {
    const h = value.replace('#', '');
    const full =
      h.length === 3
        ? h
            .split('')
            .map((c) => c + c)
            .join('')
        : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  };

  const [r, g, b] = parse(hex);
  const [br, bg2, bb] = parse(bg);
  const channel = (a: number, c: number) =>
    Math.round(Math.min(255, Math.max(0, a * ratio + c * (1 - ratio))))
      .toString(16)
      .padStart(2, '0');

  return `#${channel(r, br)}${channel(g, bg2)}${channel(b, bb)}`;
};

/** The soft companion tone for an accent, sitting on `surface`. */
export const softTone = (accent: string, surface: string): string => mix(accent, 0.18, surface);

/** A mid tone, for secondary strokes that shouldn't compete with the accent. */
export const midTone = (accent: string, surface: string): string => mix(accent, 0.45, surface);
