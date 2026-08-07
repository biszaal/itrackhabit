import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { GlyphIn, GlyphName, Ink, inkFor } from './Glyph';
import { mix } from './colors';

// ---------------------------------------------------------------------------
// Spot illustrations
//
// Where a glyph names a thing, these carry a moment: an empty list, a first
// run, a finished onboarding. They're composed scenes rather than oversized
// icons — a ground line, a rhythm of marks, a light source — built from the
// same two-tone vocabulary so an empty state feels like the same hand drew it
// as the row above it.
//
// All scenes are authored on a 160×120 grid and scale from the `width` prop.
// ---------------------------------------------------------------------------

const W = 160;
const H = 120;

interface SceneProps {
  ink: Ink;
  /** The page behind the art — used for knocking shapes back out. */
  surface: string;
}

/** Four-point spark, the same motif as the `sparkle` glyph. */
const spark = (cx: number, cy: number, r: number): string => {
  const i = r * 0.32;
  return (
    `M${cx} ${cy - r}` +
    `C${cx} ${cy - i} ${cx + i} ${cy} ${cx + r} ${cy}` +
    `C${cx + i} ${cy} ${cx} ${cy + i} ${cx} ${cy + r}` +
    `C${cx} ${cy + i} ${cx - i} ${cy} ${cx - r} ${cy}` +
    `C${cx - i} ${cy} ${cx} ${cy - i} ${cx} ${cy - r}Z`
  );
};

const scenes = {
  /**
   * Onboarding opener — a sun clearing the horizon over the beginnings of a
   * daily rhythm. Stands in for the old waving hand.
   */
  welcome: ({ ink }: SceneProps) => (
    <>
      <Circle cx={78} cy={58} r={40} fill={ink.soft} />
      <Circle
        cx={78}
        cy={58}
        r={40}
        stroke={ink.mid}
        strokeWidth={1.6}
        strokeDasharray="3 6"
        fill="none"
      />
      <Path d="M54 78a24 24 0 0 1 48 0Z" fill={ink.c} />
      <Path
        d="M18 78h124"
        stroke={ink.c}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <G stroke={ink.mid} strokeWidth={3} strokeLinecap="round" fill="none">
        <Path d="M28 92h14" />
        <Path d="M52 92h20" />
      </G>
      <G stroke={ink.soft} strokeWidth={3} strokeLinecap="round" fill="none">
        <Path d="M82 92h16" />
        <Path d="M108 92h24" />
      </G>
      <Path d={spark(126, 26, 8)} fill={ink.c} />
      <Path d={spark(140, 42, 4.5)} fill={ink.mid} />
    </>
  ),

  /**
   * Onboarding close — the habits the user just picked, rendered as a rising
   * week. Replaces the rocket, which promised the wrong thing anyway.
   */
  ready: ({ ink }: SceneProps) => (
    <>
      <Path
        d="M16 100h128"
        stroke={ink.mid}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
      <Rect x={26} y={72} width={20} height={26} rx={8} fill={ink.soft} />
      <Rect x={54} y={58} width={20} height={40} rx={8} fill={ink.soft} />
      <Rect x={82} y={44} width={20} height={54} rx={8} fill={ink.mid} />
      <Rect x={110} y={28} width={20} height={70} rx={8} fill={ink.c} />
      <Path d={spark(120, 14, 8)} fill={ink.c} />
      <G stroke={ink.mid} strokeWidth={2} strokeLinecap="round" strokeDasharray="2 6" fill="none">
        <Path d="M36 66 64 52 92 38 120 22" />
      </G>
    </>
  ),

  /**
   * Nothing tracked yet — a sprout under an unfilled week. The empty dots are
   * the point: they're the days waiting to be claimed.
   */
  firstHabit: ({ ink, surface }: SceneProps) => (
    <>
      <G fill="none" strokeWidth={2.4} strokeLinecap="round">
        <Circle cx={44} cy={22} r={5.5} fill={ink.c} stroke="none" />
        <Circle cx={62} cy={22} r={5.5} fill={ink.mid} stroke="none" />
        <Circle cx={80} cy={22} r={5.5} fill={surface} stroke={ink.soft} />
        <Circle cx={98} cy={22} r={5.5} fill={surface} stroke={ink.soft} />
        <Circle cx={116} cy={22} r={5.5} fill={surface} stroke={ink.soft} />
      </G>
      <Ellipse cx={80} cy={102} rx={44} ry={8} fill={ink.soft} />
      <Path
        d="M80 102V50"
        stroke={ink.c}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M80 80c0-13-10-21-24-21 0 13 10 21 24 21Z"
        fill={ink.soft}
        stroke={ink.c}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <Path d="M80 66c0-12 9-19 21-19 0 12-9 19-21 19Z" fill={ink.c} />
    </>
  ),

  /**
   * No templates matched — a shelf of cards with the one you're after still
   * an outline.
   */
  noTemplates: ({ ink, surface }: SceneProps) => (
    <>
      <Rect x={20} y={20} width={54} height={40} rx={13} fill={ink.soft} />
      <Circle cx={34} cy={34} r={5} fill={ink.c} />
      <G stroke={ink.mid} strokeWidth={2.6} strokeLinecap="round" fill="none">
        <Path d="M45 33h17" />
        <Path d="M32 48h30" />
      </G>

      <Rect x={86} y={20} width={54} height={40} rx={13} fill={ink.soft} />
      <Circle cx={100} cy={34} r={5} fill={ink.mid} />
      <G stroke={ink.mid} strokeWidth={2.6} strokeLinecap="round" fill="none">
        <Path d="M111 33h17" />
        <Path d="M98 48h24" />
      </G>

      <Rect
        x={53}
        y={70}
        width={54}
        height={40}
        rx={13}
        fill={surface}
        stroke={ink.c}
        strokeWidth={2.4}
        strokeDasharray="7 7"
      />
      <G stroke={ink.c} strokeWidth={2.8} strokeLinecap="round" fill="none">
        <Path d="M80 82v16" />
        <Path d="M72 90h16" />
      </G>
    </>
  ),

  /** Achievements header — a trophy under a burst of light. */
  awards: ({ ink }: SceneProps) => (
    <>
      <Circle cx={80} cy={58} r={42} fill={ink.soft} />
      <G stroke={ink.mid} strokeWidth={2.6} strokeLinecap="round" fill="none">
        <Path d="M80 6v9" />
        <Path d="M42 18l6 7" />
        <Path d="M118 18l-6 7" />
        <Path d="M22 52h9" />
        <Path d="M138 52h-9" />
      </G>
      <GlyphIn name="trophy" ink={ink} x={52} y={30} size={56} strokeWidth={2.4} />
      <Path d={spark(126, 86, 7)} fill={ink.c} />
      <Path d={spark(34, 92, 4.5)} fill={ink.mid} />
    </>
  ),
} as const;

export type IllustrationName = keyof typeof scenes;

interface IllustrationProps {
  name: IllustrationName;
  /** Rendered width in px; height follows the 4:3 grid. */
  width?: number;
  color?: string;
  /** The background the art sits on — knocked-out shapes are filled with it. */
  surface?: string;
}

export const Illustration: React.FC<IllustrationProps> = ({
  name,
  width = 160,
  color,
  surface,
}) => {
  const t = useTheme();
  const c = color ?? t.colors.primary;
  const bg = surface ?? t.colors.bgElev;

  return (
    <Svg width={width} height={(width * H) / W} viewBox={`0 0 ${W} ${H}`} fill="none">
      {scenes[name]({ ink: inkFor(c, bg), surface: bg })}
    </Svg>
  );
};

interface MedallionProps {
  glyph: GlyphName;
  size?: number;
  color?: string;
  surface?: string;
}

/**
 * The lighter empty-state treatment: a glyph held in a washed disc with a
 * dashed orbit and a couple of sparks. Used where a full scene would be too
 * much furniture for a card that's only briefly empty.
 */
export const Medallion: React.FC<MedallionProps> = ({ glyph, size = 96, color, surface }) => {
  const t = useTheme();
  const c = color ?? t.colors.primary;
  const bg = surface ?? t.colors.bgElev;
  const ink = inkFor(c, bg);

  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <Circle cx={48} cy={48} r={31} fill={ink.soft} />
      <Circle
        cx={48}
        cy={48}
        r={41}
        stroke={mix(c, 0.32, bg)}
        strokeWidth={1.6}
        strokeDasharray="3 7"
        fill="none"
      />
      <GlyphIn name={glyph} ink={ink} x={30} y={30} size={36} strokeWidth={2} />
      <Path d={spark(80, 20, 6)} fill={ink.c} />
      <Path d={spark(16, 72, 4)} fill={ink.mid} />
    </Svg>
  );
};
