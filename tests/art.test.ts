import { mix, softTone } from '../src/components/art/colors';
import { resolveGlyph, glyphFromTitle } from '../src/components/art/resolveGlyph';
import { isGlyphName, GLYPH_NAMES } from '../src/components/art/Glyph';

const HEX = /^#[0-9a-f]{6}$/i;

describe('mix', () => {
  it('returns each end of the range', () => {
    expect(mix('#FF0000', 1, '#FFFFFF').toLowerCase()).toBe('#ff0000');
    expect(mix('#FF0000', 0, '#FFFFFF').toLowerCase()).toBe('#ffffff');
  });

  it('blends halfway', () => {
    expect(mix('#000000', 0.5, '#FFFFFF').toLowerCase()).toBe('#808080');
  });

  it('accepts 3-character hex', () => {
    expect(mix('#F00', 1, '#FFF').toLowerCase()).toBe('#ff0000');
  });

  it('always produces a valid hex string for real palette input', () => {
    const accents = ['#6366F1', '#7C9B7E', '#E07A77', '#E0A864', '#6FA8C7'];
    const surfaces = ['#FAFAF7', '#232631', '#22252F'];
    for (const a of accents) {
      for (const s of surfaces) {
        expect(mix(a, 0.14, s)).toMatch(HEX);
        expect(softTone(a, s)).toMatch(HEX);
      }
    }
  });
});

describe('isGlyphName', () => {
  it('accepts every exported name', () => {
    expect(GLYPH_NAMES.length).toBeGreaterThan(0);
    for (const n of GLYPH_NAMES) expect(isGlyphName(n)).toBe(true);
  });

  it('rejects non-names, including inherited Object keys', () => {
    for (const v of ['nope', '', null, undefined, 42, {}, 'toString', 'constructor']) {
      expect(isGlyphName(v)).toBe(false);
    }
  });
});

describe('resolveGlyph', () => {
  it('prefers an explicit glyph name', () => {
    expect(resolveGlyph('meditate', 'Go for a run')).toBe('meditate');
  });

  it('translates legacy emoji', () => {
    expect(resolveGlyph('💪')).toBe('strength');
    expect(resolveGlyph('📚')).toBe('study');
    expect(resolveGlyph('💧')).toBe('water');
  });

  it('handles emoji with variation selectors and skin tones', () => {
    expect(resolveGlyph('🏋️')).toBe('strength');
    expect(resolveGlyph('🏃🏽')).toBe('run');
    expect(resolveGlyph('🧘🏿‍♀️')).toBe('meditate');
  });

  it('falls back to the title when the icon is unknown or missing', () => {
    expect(resolveGlyph(undefined, 'Morning run')).toBe('run');
    expect(resolveGlyph(null, 'Drink water')).toBe('water');
    expect(resolveGlyph('🫥', 'Read a book')).toBe('read');
  });

  it('always returns a drawable glyph', () => {
    for (const input of ['', '🫥', 'not-a-glyph', undefined, null]) {
      expect(isGlyphName(resolveGlyph(input as any, 'zzzz'))).toBe(true);
    }
  });
});

describe('glyphFromTitle', () => {
  it('matches the common habit vocabulary', () => {
    expect(glyphFromTitle('Meditate 30 min')).toBe('meditate');
    expect(glyphFromTitle('Exercise 30 min')).toBe('strength');
    expect(glyphFromTitle('Journal before bed')).toBe('journal');
    expect(glyphFromTitle('Write 500 words')).toBe('write');
  });

  it('defaults to target for unknown or empty titles', () => {
    expect(glyphFromTitle('')).toBe('target');
    expect(glyphFromTitle(undefined)).toBe('target');
    expect(glyphFromTitle('Zzzzz qqqq')).toBe('target');
  });

  // Keywords are matched with `includes`, so a needle can fire inside an
  // unrelated word. These lock in the cases that were wrong.
  it('does not match keywords inside unrelated words', () => {
    expect(glyphFromTitle('Heart health check')).not.toBe('draw'); // 'art'
    expect(glyphFromTitle('Brunch with family')).not.toBe('run'); // 'run'
    expect(glyphFromTitle('Start a side project')).not.toBe('draw'); // 'art'
  });
});
