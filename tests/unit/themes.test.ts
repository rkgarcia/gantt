import { describe, it, expect } from 'vitest';
import { resolveTheme, THEMES } from '../../src/themes';
import type { GanttTheme } from '../../src/types';

describe('THEMES', () => {
  it('exposes the four built-in themes', () => {
    expect(Object.keys(THEMES)).toEqual(['light', 'dark', 'ocean', 'forest']);
  });

  it.each(['light', 'dark', 'ocean', 'forest'])('%s theme has all required properties', (name) => {
    const theme = THEMES[name];
    const required: Array<keyof GanttTheme> = [
      'background', 'surface', 'surfaceAlt', 'text', 'textSecondary',
      'border', 'grid', 'weekend', 'today', 'header', 'taskText',
      'taskBorder', 'taskProgress', 'milestone', 'milestoneStroke',
      'dependency', 'group', 'palette', 'fontFamily', 'fontSize', 'taskBorderRadius',
    ];
    for (const key of required) {
      expect(theme, `${name} is missing "${key}"`).toHaveProperty(key);
    }
  });

  it.each(['light', 'dark', 'ocean', 'forest'])('%s theme palette has at least 5 colors', (name) => {
    expect(THEMES[name].palette.length).toBeGreaterThanOrEqual(5);
  });

  it('dark theme background is darker than light', () => {
    expect(THEMES.dark.background).not.toBe(THEMES.light.background);
    // light background starts with #f or #e, dark with #0 or #1
    expect(THEMES.dark.background.toLowerCase()).toMatch(/^#[01]/);
  });
});

describe('resolveTheme', () => {
  it('returns light theme when called with no argument', () => {
    expect(resolveTheme()).toEqual(THEMES.light);
  });

  it('returns light theme for undefined', () => {
    expect(resolveTheme(undefined)).toEqual(THEMES.light);
  });

  it.each(['light', 'dark', 'ocean', 'forest'] as const)('returns correct theme for "%s"', (name) => {
    expect(resolveTheme(name)).toEqual(THEMES[name]);
  });

  it('falls back to light theme for an unknown string', () => {
    expect(resolveTheme('neon' as never)).toEqual(THEMES.light);
  });

  it('merges a partial custom theme onto the light base', () => {
    const custom = resolveTheme({ background: '#ff0000', fontSize: 16 });
    expect(custom.background).toBe('#ff0000');
    expect(custom.fontSize).toBe(16);
    // Remaining fields come from light
    expect(custom.text).toBe(THEMES.light.text);
    expect(custom.fontFamily).toBe(THEMES.light.fontFamily);
  });

  it('deep-merges the header sub-object', () => {
    const custom = resolveTheme({ header: { background: '#111' } });
    expect(custom.header.background).toBe('#111');
    expect(custom.header.text).toBe(THEMES.light.header.text);
    expect(custom.header.border).toBe(THEMES.light.header.border);
  });

  it('deep-merges the group sub-object', () => {
    const custom = resolveTheme({ group: { text: '#abcdef' } });
    expect(custom.group.text).toBe('#abcdef');
    expect(custom.group.background).toBe(THEMES.light.group.background);
  });

  it('custom palette replaces the default palette', () => {
    const palette = ['#aaa', '#bbb'];
    const custom = resolveTheme({ palette });
    expect(custom.palette).toEqual(palette);
  });
});
