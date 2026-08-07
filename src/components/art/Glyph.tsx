import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { midTone, softTone } from './colors';

// ---------------------------------------------------------------------------
// The iTrackHabit glyph set
//
// Drawn to the same rules as the brand mark (assets/brand/mark.svg): a soft
// two-tone construction on a 24×24 grid, rounded terminals, one solid "anchor"
// shape per glyph carrying the accent at full strength, everything else either
// stroked or washed back into the surface. No outlines thinner than 1.6 so the
// glyphs still read at the 20px sizes used in list rows and chips.
//
// Each glyph is a function of its ink, not a fixed-colour asset — that's what
// lets a single drawing sit on any of the eight habit colours and survive the
// jump to dark mode without a second copy.
// ---------------------------------------------------------------------------

export interface Ink {
  /** Full-strength accent — anchor fills and primary strokes. */
  c: string;
  /** Accent washed into the surface — secondary fills. */
  soft: string;
  /** Half-strength accent — supporting strokes that shouldn't compete. */
  mid: string;
}

/** Build the three tones a glyph is drawn from. */
export const inkFor = (accent: string, surface: string): Ink => ({
  c: accent,
  soft: softTone(accent, surface),
  mid: midTone(accent, surface),
});

/** A four-point star with concave sides — the app's "spark" motif. */
const star4 = (cx: number, cy: number, r: number): string => {
  const i = r * 0.32;
  return (
    `M${cx} ${cy - r}` +
    `C${cx} ${cy - i} ${cx + i} ${cy} ${cx + r} ${cy}` +
    `C${cx + i} ${cy} ${cx} ${cy + i} ${cx} ${cy + r}` +
    `C${cx} ${cy + i} ${cx - i} ${cy} ${cx - r} ${cy}` +
    `C${cx - i} ${cy} ${cx} ${cy - i} ${cx} ${cy - r}Z`
  );
};

const glyphs = {
  // -- movement ------------------------------------------------------------
  run: ({ c }: Ink) => (
    <>
      <Circle cx={15.5} cy={4.6} r={2.2} fill={c} stroke="none" />
      <Path d="M14.2 8.6 10.6 12.2 13.4 14.8 14 19.4" />
      <Path d="M10.9 12 7 14.8 6.2 19" />
      <Path d="M15.6 10.4 19.4 12" />
      <Path d="M12.2 9.4 8.4 8.6" />
    </>
  ),
  walk: ({ c }: Ink) => (
    <>
      <Circle cx={13} cy={4.6} r={2.2} fill={c} stroke="none" />
      <Path d="M13 7.6 12.6 13" />
      <Path d="M12.6 13 10.2 19.6" />
      <Path d="M12.6 13 15 16.2 15.6 19.6" />
      <Path d="M13 9.6 9.8 12.4" />
      <Path d="M13 9.6 16 11.8" />
    </>
  ),
  strength: ({ c }: Ink) => (
    <>
      <Path d="M8.4 12H15.6" />
      <Rect x={4.6} y={8.2} width={3.8} height={7.6} rx={1.7} fill={c} stroke="none" />
      <Rect x={15.6} y={8.2} width={3.8} height={7.6} rx={1.7} fill={c} stroke="none" />
      <Path d="M2.6 10V14" />
      <Path d="M21.4 10V14" />
    </>
  ),
  bike: ({ c, mid }: Ink) => (
    <>
      <Circle cx={5.6} cy={16.4} r={4} stroke={mid} />
      <Circle cx={18.4} cy={16.4} r={4} stroke={mid} />
      <Path d="M5.6 16.4H10.4L13.6 9.6H8.6" />
      <Path d="M13.6 9.6 18.4 16.4" />
      <Path d="M15.2 8.2H17.6" />
      <Rect x={7} y={7.6} width={3.4} height={1.8} rx={0.9} fill={c} stroke="none" />
    </>
  ),
  // The swimmer sits clear of the water line — overlapping the two made the
  // head read as another wave crest.
  swim: ({ c, mid }: Ink) => (
    <>
      <Circle cx={6.6} cy={5.4} r={2.4} fill={c} stroke="none" />
      <Path d="M4 11.2 9 8.6l3.6 2.4 3.8-5" />
      <Path d="M2.6 16.6q2.4-2.4 4.8 0t4.8 0 4.8 0 4.8 0" />
      <Path d="M2.6 20.8q2.4-2.4 4.8 0t4.8 0 4.8 0 4.8 0" stroke={mid} />
    </>
  ),
  stretch: ({ c }: Ink) => (
    <>
      <Circle cx={12} cy={4.4} r={2.2} fill={c} stroke="none" />
      <Path d="M12 7.4V13.4" />
      <Path d="M12 9.6 7.2 6.6" />
      <Path d="M12 9.6 16.8 6.6" />
      <Path d="M12 13.4 8.6 19.6" />
      <Path d="M12 13.4 15.4 19.6" />
    </>
  ),

  // -- mind ----------------------------------------------------------------
  meditate: ({ c, soft }: Ink) => (
    <>
      <Path d="M4.6 18.2c2.6-2.4 12.2-2.4 14.8 0-2.6 2.1-12.2 2.1-14.8 0Z" fill={soft} stroke="none" />
      <Circle cx={12} cy={5} r={2.4} fill={c} stroke="none" />
      <Path d="M12 8.2c-2.9 0-4.8 2.4-4.8 5.2" />
      <Path d="M12 8.2c2.9 0 4.8 2.4 4.8 5.2" />
      <Path d="M4.6 18.2c2.6-2.4 12.2-2.4 14.8 0" />
      <Path d="M7.2 13.4 4.9 15.4" />
      <Path d="M16.8 13.4 19.1 15.4" />
    </>
  ),
  breathe: ({ c, soft, mid }: Ink) => (
    <>
      <Circle cx={12} cy={12} r={9.4} stroke={soft} strokeDasharray="2.4 3.6" />
      <Circle cx={12} cy={12} r={6.2} stroke={mid} />
      <Circle cx={12} cy={12} r={3} fill={c} stroke="none" />
    </>
  ),
  target: ({ c, mid }: Ink) => (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Circle cx={12} cy={12} r={4.8} stroke={mid} />
      <Circle cx={12} cy={12} r={2} fill={c} stroke="none" />
    </>
  ),
  // Two lobes either side of a centre seam. The node-cluster version this
  // replaced read as an asterisk, not a mind.
  brain: ({ c, soft, mid }: Ink) => (
    <>
      <Path
        d="M11.2 4.2a3 3 0 0 0-4.6 1.7 2.8 2.8 0 0 0-1.7 4.4 3 3 0 0 0 .6 4.5 3 3 0 0 0 2.9 3.4 2.8 2.8 0 0 0 2.8 1.6Z"
        fill={soft}
        stroke={c}
      />
      <Path
        d="M12.8 4.2a3 3 0 0 1 4.6 1.7 2.8 2.8 0 0 1 1.7 4.4 3 3 0 0 1-.6 4.5 3 3 0 0 1-2.9 3.4 2.8 2.8 0 0 1-2.8 1.6Z"
        fill={soft}
        stroke={c}
      />
      <Path d="M9.4 8.2a2 2 0 0 0 1.8 1.6M14.6 12.4a2 2 0 0 1-1.8 1.6" stroke={mid} />
    </>
  ),
  gratitude: ({ c, soft }: Ink) => (
    <Path
      d="M12 20.4S3.4 15.2 3.4 9.4A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.6 2.8c0 5.8-8.6 11-8.6 11Z"
      fill={soft}
      stroke={c}
    />
  ),

  // -- body ----------------------------------------------------------------
  water: ({ c, soft }: Ink) => (
    <>
      <Path
        d="M12 3S5.6 9.9 5.6 14.1a6.4 6.4 0 0 0 12.8 0C18.4 9.9 12 3 12 3Z"
        fill={soft}
        stroke={c}
      />
      <Path d="M9 14.2a3 3 0 0 0 3 3" />
    </>
  ),
  nutrition: ({ c, soft, mid }: Ink) => (
    <>
      <Path d="M3.4 12.4h17.2a8.6 8.6 0 0 1-17.2 0Z" fill={soft} stroke={c} />
      <Path d="M12 12.4c-.4-3.5 1.9-6.1 5.2-6.5.5 3.6-1.8 6.1-5.2 6.5Z" fill={c} stroke="none" />
      <Path d="M12 12.4C11 9.9 8.9 8.6 6.4 8.9" stroke={mid} />
      <Path d="M2.4 20.4h19.2" stroke={mid} />
    </>
  ),
  sleep: ({ c, soft, mid }: Ink) => (
    <>
      <Path
        d="M20.2 14.4A8.4 8.4 0 1 1 9.6 3.8a6.6 6.6 0 0 0 10.6 10.6Z"
        fill={soft}
        stroke={c}
      />
      <Circle cx={17.6} cy={5.2} r={1.3} fill={c} stroke="none" />
      <Circle cx={21} cy={9} r={0.9} fill={mid} stroke="none" />
    </>
  ),
  vitamins: ({ c, soft }: Ink) => (
    <G transform="rotate(-38 12 12)">
      <Rect x={2.8} y={8.6} width={18.4} height={6.8} rx={3.4} fill={soft} stroke={c} />
      <Path d="M12 8.6V15.4" />
      <Path d="M2.8 12a3.4 3.4 0 0 1 3.4-3.4H12v6.8H6.2A3.4 3.4 0 0 1 2.8 12Z" fill={c} stroke="none" />
    </G>
  ),
  cook: ({ c, soft, mid }: Ink) => (
    <>
      <Path d="M3.8 11.6h16.4v4.2a4.4 4.4 0 0 1-4.4 4.4H8.2a4.4 4.4 0 0 1-4.4-4.4Z" fill={soft} stroke={c} />
      <Path d="M2 11.6h20" />
      <Path d="M8.6 8.4c1.3-1.1 1.3-2.4 0-3.4M12 8.4c1.3-1.1 1.3-2.4 0-3.4M15.4 8.4c1.3-1.1 1.3-2.4 0-3.4" stroke={mid} />
    </>
  ),

  // -- learning ------------------------------------------------------------
  read: ({ c, soft }: Ink) => (
    <>
      <Path d="M12 7.6C10 6 6.9 5.5 3.6 6v11.4c3.3-.5 6.4 0 8.4 1.6" fill={soft} stroke={c} />
      <Path d="M12 7.6c2-1.6 5.1-2.1 8.4-1.6v11.4c-3.3-.5-6.4 0-8.4 1.6" />
      <Path d="M12 7.6V19" />
    </>
  ),
  study: ({ c, soft, mid }: Ink) => (
    <>
      <Rect x={3.4} y={15.2} width={17.2} height={4.6} rx={1.8} fill={soft} stroke={c} />
      <Path d="M6.4 17.5h3.4" stroke={c} />
      <Rect x={4.8} y={10.2} width={14.4} height={4.6} rx={1.8} stroke={mid} />
      <Path d="M7.6 12.5h3.4" stroke={mid} />
      <Rect x={6.4} y={5.2} width={11.2} height={4.6} rx={1.8} fill={c} stroke="none" />
    </>
  ),
  learn: ({ c, soft }: Ink) => (
    <>
      <Path d="M12 4.4 22 9.2 12 14 2 9.2Z" fill={soft} stroke={c} />
      <Path d="M6.6 11.4v4.8c0 1.5 2.4 2.6 5.4 2.6s5.4-1.1 5.4-2.6v-4.8" />
      <Circle cx={12} cy={9.2} r={1.6} fill={c} stroke="none" />
    </>
  ),
  language: ({ c, soft, mid }: Ink) => (
    <>
      <Path
        d="M6 4h9.6a2.6 2.6 0 0 1 2.6 2.6v5.2a2.6 2.6 0 0 1-2.6 2.6H9.6L6 17.8V14.4a2.6 2.6 0 0 1-2.6-2.6V6.6A2.6 2.6 0 0 1 6 4Z"
        fill={soft}
        stroke={c}
      />
      <Path d="M7 8.4h7.6M7 11.4h4.6" stroke={c} />
      <Path d="M20.4 8.6a4.4 4.4 0 0 1 0 6.4" stroke={mid} />
    </>
  ),
  code: ({ c, mid }: Ink) => (
    <>
      <Path d="M8.8 7.8 3.6 12l5.2 4.2" />
      <Path d="M15.2 7.8 20.4 12l-5.2 4.2" stroke={mid} />
      <Path d="M13.6 5.4 10.4 18.6" />
    </>
  ),

  // -- creative ------------------------------------------------------------
  write: ({ c, soft }: Ink) => (
    <>
      <Path d="M4 20l1.2-4.4L15.9 4.9a2.3 2.3 0 0 1 3.2 3.2L8.4 18.8Z" fill={soft} stroke={c} />
      <Path d="M14.4 6.4 17.6 9.6" />
      <Path d="M5.2 15.6 8.4 18.8 4 20Z" fill={c} stroke="none" />
    </>
  ),
  journal: ({ c, soft, mid }: Ink) => (
    <>
      <Rect x={4.6} y={3.4} width={15} height={17.2} rx={2.8} fill={soft} stroke={c} />
      <Path d="M8.4 3.4V20.6" />
      <Path d="M11.6 8.6h5M11.6 12h5M11.6 15.4h3.2" stroke={mid} />
    </>
  ),
  music: ({ c, mid }: Ink) => (
    <>
      <Path d="M9.4 17.6V6.2l9.2-2v11.2" />
      <Path d="M9.4 8.6 18.6 6.6" stroke={mid} />
      <Ellipse cx={7} cy={17.6} rx={2.6} ry={2.2} fill={c} stroke="none" />
      <Ellipse cx={16.2} cy={15.4} rx={2.6} ry={2.2} fill={c} stroke="none" />
    </>
  ),
  draw: ({ c, soft, mid }: Ink) => (
    <>
      <Path
        d="M12 3.2a8.8 8.8 0 0 0 0 17.6c1.3 0 2.1-.8 2.1-1.9 0-.5-.2-.9-.5-1.2a1.7 1.7 0 0 1 1.2-2.9h1.7a4.4 4.4 0 0 0 4.3-4.4c0-4-3.9-7.2-8.8-7.2Z"
        fill={soft}
        stroke={c}
      />
      <Circle cx={8.2} cy={8.6} r={1.4} fill={c} stroke="none" />
      <Circle cx={13.2} cy={7.2} r={1.4} fill={mid} stroke="none" />
      <Circle cx={6.6} cy={13.4} r={1.4} fill={c} stroke="none" />
    </>
  ),
  photo: ({ c, soft, mid }: Ink) => (
    <>
      <Rect x={2.6} y={6.6} width={18.8} height={13.4} rx={3.4} fill={soft} stroke={c} />
      <Path d="M8.6 6.6 10 4h4l1.4 2.6" />
      <Circle cx={12} cy={13.4} r={4} stroke={mid} />
      <Circle cx={12} cy={13.4} r={1.7} fill={c} stroke="none" />
    </>
  ),

  // -- productivity --------------------------------------------------------
  plan: ({ c, soft, mid }: Ink) => (
    <>
      <Rect x={3} y={5.2} width={18} height={15.4} rx={3.2} fill={soft} stroke={c} />
      <Path d="M3 10.2h18" />
      <Path d="M8 3v4M16 3v4" />
      <Circle cx={8.4} cy={14} r={1.3} fill={c} stroke="none" />
      <Circle cx={12} cy={14} r={1.3} fill={mid} stroke="none" />
      <Circle cx={15.6} cy={14} r={1.3} fill={mid} stroke="none" />
      <Circle cx={8.4} cy={17.4} r={1.3} fill={mid} stroke="none" />
    </>
  ),
  work: ({ c, soft }: Ink) => (
    <>
      <Rect x={2.6} y={7.2} width={18.8} height={12.6} rx={3.2} fill={soft} stroke={c} />
      <Path d="M8.6 7.2V5.6a2 2 0 0 1 2-2h2.8a2 2 0 0 1 2 2v1.6" />
      <Path d="M2.6 12.8h18.8" />
      <Rect x={10.2} y={11.2} width={3.6} height={3.2} rx={1.3} fill={c} stroke="none" />
    </>
  ),
  inbox: ({ c, soft }: Ink) => (
    <>
      <Rect x={2.6} y={5} width={18.8} height={14} rx={3.2} fill={soft} stroke={c} />
      <Path d="M2.6 8.2 12 13.8 21.4 8.2" />
    </>
  ),
  sunrise: ({ c, soft, mid }: Ink) => (
    <>
      <Path d="M6.6 15.4a5.4 5.4 0 0 1 10.8 0Z" fill={c} stroke="none" />
      <Path d="M2.4 15.4h19.2" />
      <Path d="M12 2.8v2.6M5 6.2l1.8 1.8M19 6.2l-1.8 1.8" stroke={mid} />
      <Path d="M5.4 19.4h4M13 19.4h5.6" stroke={soft} />
    </>
  ),
  offline: ({ c, soft }: Ink) => (
    <>
      <Rect x={6.4} y={2.6} width={11.2} height={18.8} rx={3.2} fill={soft} stroke={c} />
      <Path d="M10 18.4h4" />
      <Path d="M4.4 20.6 19.6 3.4" />
    </>
  ),
  review: ({ c, soft }: Ink) => (
    <>
      <Rect x={4} y={4.6} width={16} height={16.4} rx={3.2} fill={soft} stroke={c} />
      <Rect x={8.6} y={2.6} width={6.8} height={4} rx={1.8} fill={c} stroke="none" />
      <Path d="M8.8 13.2 11 15.4l4.4-4.6" />
    </>
  ),
  templates: ({ c, soft, mid }: Ink) => (
    <>
      <Rect x={3} y={3.4} width={8} height={8} rx={2.6} fill={c} stroke="none" />
      <Rect x={13} y={3.4} width={8} height={8} rx={2.6} stroke={mid} />
      <Rect x={3} y={13} width={8} height={8} rx={2.6} stroke={mid} />
      <Rect x={13} y={13} width={8} height={8} rx={2.6} fill={soft} stroke="none" />
    </>
  ),
  analytics: ({ c, soft, mid }: Ink) => (
    <>
      <Path d="M3.4 19.6h17.2" stroke={mid} />
      <Rect x={4.4} y={12} width={4.2} height={6.4} rx={1.7} fill={soft} stroke={c} />
      <Rect x={9.9} y={6.6} width={4.2} height={11.8} rx={1.7} fill={c} stroke="none" />
      <Rect x={15.4} y={9.6} width={4.2} height={8.8} rx={1.7} fill={soft} stroke={c} />
    </>
  ),
  streak: ({ c, soft }: Ink) => (
    <>
      <Path
        d="M12 2.6s5.8 4.6 5.8 9.8a5.8 5.8 0 0 1-11.6 0c0-2 .9-3.7 1.9-4.9.1 1.7 1 2.7 2.1 2.7 1.7 0 1.8-2.5 1.8-7.6Z"
        fill={soft}
        stroke={c}
      />
      <Path d="M12 20.2a3 3 0 0 1-3-3c0-1.9 3-3.7 3-3.7s3 1.8 3 3.7a3 3 0 0 1-3 3Z" fill={c} stroke="none" />
    </>
  ),

  // -- people --------------------------------------------------------------
  call: ({ c, soft }: Ink) => (
    <Path
      d="M7.4 3.6 4.2 6.8a2.6 2.6 0 0 0-.2 3.4 26 26 0 0 0 9.8 9.8 2.6 2.6 0 0 0 3.4-.2l3.2-3.2-4.4-3.2-2.4 2A19 19 0 0 1 8.6 10l2-2.4Z"
      fill={soft}
      stroke={c}
    />
  ),
  people: ({ c, mid }: Ink) => (
    <>
      <Circle cx={9} cy={7.6} r={3.4} fill={c} stroke="none" />
      <Path d="M2.6 19.8c0-3.5 2.9-6.3 6.4-6.3s6.4 2.8 6.4 6.3" />
      <Circle cx={17.2} cy={8.8} r={2.6} stroke={mid} />
      <Path d="M15.8 13.9c3.1.3 5.6 2.8 5.6 5.9" stroke={mid} />
    </>
  ),
  chat: ({ c, soft, mid }: Ink) => (
    <>
      <Path
        d="M6 4h9.6a2.6 2.6 0 0 1 2.6 2.6v5.2a2.6 2.6 0 0 1-2.6 2.6H9.6L6 17.8V14.4a2.6 2.6 0 0 1-2.6-2.6V6.6A2.6 2.6 0 0 1 6 4Z"
        fill={soft}
        stroke={c}
      />
      <Circle cx={8} cy={9.2} r={1.2} fill={c} stroke="none" />
      <Circle cx={11.6} cy={9.2} r={1.2} fill={mid} stroke="none" />
      <Circle cx={15.2} cy={9.2} r={1.2} fill={mid} stroke="none" />
    </>
  ),

  // -- outdoors ------------------------------------------------------------
  nature: ({ c, soft, mid }: Ink) => (
    <>
      <Path d="M12 3 5.4 11.4h3.2L4.2 17.4h15.6L15.4 11.4h3.2Z" fill={soft} stroke={c} />
      <Path d="M12 17.4v3.4" />
      <Path d="M9.4 20.8h5.2" stroke={mid} />
    </>
  ),
  outdoors: ({ c, soft }: Ink) => (
    <>
      <Circle cx={17.6} cy={5.8} r={2.6} fill={c} stroke="none" />
      <Path d="M2.2 19.4 8.8 8.2l4.2 6.8 2.4-3.6 6.4 8Z" fill={soft} stroke={c} />
    </>
  ),

  // -- system / interface --------------------------------------------------
  sparkle: ({ c, mid }: Ink) => (
    <>
      <Path d={star4(10, 10, 7.2)} fill={c} stroke="none" />
      <Path d={star4(18.4, 17.6, 3.8)} fill={mid} stroke="none" />
    </>
  ),
  trophy: ({ c, soft }: Ink) => (
    <>
      <Path d="M7.2 3.6h9.6v6a4.8 4.8 0 0 1-9.6 0Z" fill={soft} stroke={c} />
      <Path d="M7.2 5.6H4.4a3.2 3.2 0 0 0 3.2 3.2" />
      <Path d="M16.8 5.6h2.8a3.2 3.2 0 0 1-3.2 3.2" />
      <Path d="M12 14.4v3" />
      <Rect x={7.4} y={17.2} width={9.2} height={3.2} rx={1.6} fill={c} stroke="none" />
    </>
  ),
  medal: ({ c, soft, mid }: Ink) => (
    <>
      <Path d="M8.4 2.6 10.9 8.4M15.6 2.6 13.1 8.4" stroke={mid} />
      <Circle cx={12} cy={14.8} r={6.8} fill={soft} stroke={c} />
      <Path
        d="M12 10.8 13 13.4 15.8 13.6 13.6 15.3 14.4 18 12 16.5 9.6 18 10.4 15.3 8.2 13.6 11 13.4Z"
        fill={c}
        stroke="none"
      />
    </>
  ),
  crown: ({ c, soft }: Ink) => (
    <>
      <Path d="M3.4 8.4 7 13 12 5.6 17 13l3.6-4.6v8.2H3.4Z" fill={soft} stroke={c} />
      <Rect x={3.4} y={18.2} width={17.2} height={3.2} rx={1.6} fill={c} stroke="none" />
      <Circle cx={3.4} cy={6.8} r={1.5} fill={c} stroke="none" />
      <Circle cx={20.6} cy={6.8} r={1.5} fill={c} stroke="none" />
      <Circle cx={12} cy={4.2} r={1.5} fill={c} stroke="none" />
    </>
  ),
  bolt: ({ c, soft }: Ink) => (
    <Path d="M13.6 2.4 5.2 13.4h5.4L10 21.6 18.8 10.4h-5.6Z" fill={soft} stroke={c} />
  ),
  bell: ({ c, soft }: Ink) => (
    <>
      <Path d="M12 3.4a6 6 0 0 0-6 6v3.2l-1.8 3.2h15.6L18 12.6V9.4a6 6 0 0 0-6-6Z" fill={soft} stroke={c} />
      <Path d="M9.6 18.6a2.6 2.6 0 0 0 4.8 0" />
      <Circle cx={12} cy={2.8} r={1.4} fill={c} stroke="none" />
    </>
  ),
  shield: ({ c, soft }: Ink) => (
    <>
      <Path d="M12 2.8 4.6 6v6c0 4.6 3.1 8.2 7.4 9.4 4.3-1.2 7.4-4.8 7.4-9.4V6Z" fill={soft} stroke={c} />
      <Path d="M8.8 11.8 11 14l4.2-4.4" />
    </>
  ),
  archive: ({ c, soft }: Ink) => (
    <>
      <Path d="M3.6 15v3a2.6 2.6 0 0 0 2.6 2.6h11.6a2.6 2.6 0 0 0 2.6-2.6v-3Z" fill={soft} stroke={c} />
      <Path d="M12 3.4v9.8" />
      <Path d="M8.2 9.6 12 13.4l3.8-3.8" />
    </>
  ),
  device: ({ c, soft }: Ink) => (
    <>
      <Rect x={6.4} y={2.4} width={11.2} height={19.2} rx={3.2} fill={soft} stroke={c} />
      <Path d="M10.2 18.6h3.6" />
      <Circle cx={12} cy={7} r={1.4} fill={c} stroke="none" />
      <Path d="M12 10v4.4" />
    </>
  ),
  tune: ({ c, mid }: Ink) => (
    <>
      <Path d="M5 3.6v16.8M12 3.6v16.8M19 3.6v16.8" stroke={mid} />
      <Circle cx={5} cy={8.6} r={2.5} fill={c} stroke="none" />
      <Circle cx={12} cy={15} r={2.5} fill={c} stroke="none" />
      <Circle cx={19} cy={7.4} r={2.5} fill={c} stroke="none" />
    </>
  ),
  sprout: ({ c, soft, mid }: Ink) => (
    <>
      <Path d="M12 13.8C12 10 9 7.6 5.2 7.6c0 3.8 3 6.2 6.8 6.2Z" fill={soft} stroke={c} />
      <Path d="M12 12.8c0-3.4 2.8-5.6 6.2-5.6 0 3.4-2.8 5.6-6.2 5.6Z" fill={c} stroke="none" />
      <Path d="M12 20.6v-8" />
      <Path d="M7.4 20.6h9.2" stroke={mid} />
    </>
  ),
  link: ({ c, mid }: Ink) => (
    <>
      <Path d="M10.2 13.8a3.9 3.9 0 0 0 5.9.4l2.8-2.8a3.9 3.9 0 0 0-5.5-5.5l-1.6 1.6" />
      <Path d="M13.8 10.2a3.9 3.9 0 0 0-5.9-.4l-2.8 2.8a3.9 3.9 0 0 0 5.5 5.5l1.6-1.6" stroke={mid} />
    </>
  ),
  bulb: ({ c, soft }: Ink) => (
    <>
      <Path d="M12 3.2a6.4 6.4 0 0 0-3.8 11.6v1.8h7.6v-1.8A6.4 6.4 0 0 0 12 3.2Z" fill={soft} stroke={c} />
      <Path d="M9.4 18.6h5.2M10.4 20.9h3.2" />
      <Circle cx={12} cy={9.6} r={1.7} fill={c} stroke="none" />
    </>
  ),
  warning: ({ c, soft }: Ink) => (
    <>
      <Path
        d="M10.4 4.2 2.7 17.7a1.9 1.9 0 0 0 1.6 2.9h15.4a1.9 1.9 0 0 0 1.6-2.9L13.6 4.2a1.9 1.9 0 0 0-3.2 0Z"
        fill={soft}
        stroke={c}
      />
      <Path d="M12 9.4v4.2" />
      <Circle cx={12} cy={16.9} r={1.3} fill={c} stroke="none" />
    </>
  ),
} as const;

export type GlyphName = keyof typeof glyphs;

/**
 * The raw drawings, on their own 24×24 grid. Exposed so the spot illustrations
 * can drop a glyph into a larger scene instead of redrawing it at another size.
 */
export const glyphShapes: Record<GlyphName, (ink: Ink) => React.ReactNode> = glyphs;

/** Places a glyph inside a bigger scene, keeping its optical stroke weight. */
export const GlyphIn: React.FC<{
  name: GlyphName;
  ink: Ink;
  /** Top-left of the glyph's 24×24 box in the parent's coordinates. */
  x: number;
  y: number;
  /** Rendered edge length in the parent's coordinates. */
  size: number;
  strokeWidth?: number;
}> = ({ name, ink, x, y, size, strokeWidth = 1.8 }) => {
  const scale = size / 24;
  return (
    <G
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke={ink.c}
      strokeWidth={strokeWidth / scale}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {glyphShapes[name](ink)}
    </G>
  );
};

export const GLYPH_NAMES = Object.keys(glyphs) as GlyphName[];

export const isGlyphName = (value: unknown): value is GlyphName =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(glyphs, value);

interface GlyphProps {
  name: GlyphName;
  /** Rendered edge length in px. Strokes scale with it so weight stays even. */
  size?: number;
  /** Accent the glyph is drawn from. Defaults to the theme primary. */
  color?: string;
  /**
   * Surface the glyph sits on — the soft tone is mixed down into this, so pass
   * the actual background when it isn't the default card fill.
   */
  surface?: string;
}

export const Glyph: React.FC<GlyphProps> = ({ name, size = 24, color, surface }) => {
  const t = useTheme();
  const c = color ?? t.colors.primary;
  const bg = surface ?? t.colors.bgElev;
  const draw = glyphs[name];

  // Hairlines vanish at chip sizes and turn clumsy at illustration sizes, so
  // the stroke tracks the box instead of being fixed at the 24px design weight.
  const strokeWidth = Math.max(1.35, Math.min(2.1, (size / 24) * 1.8));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G
        stroke={c}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {draw(inkFor(c, bg))}
      </G>
    </Svg>
  );
};
