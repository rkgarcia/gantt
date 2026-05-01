import { GanttTheme } from './types';

const LIGHT: GanttTheme = {
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceAlt: '#f0f2f5',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  grid: '#e2e8f0',
  weekend: 'rgba(100,116,139,0.06)',
  today: '#f97316',
  header: {
    background: '#1e293b',
    text: '#f1f5f9',
    border: 'rgba(241,245,249,0.12)',
  },
  taskText: '#ffffff',
  taskBorder: 'rgba(0,0,0,0.12)',
  taskProgress: 'rgba(0,0,0,0.25)',
  milestone: '#f59e0b',
  milestoneStroke: '#92400e',
  dependency: '#94a3b8',
  group: {
    background: '#e8edf2',
    text: '#334155',
  },
  palette: [
    '#3b82f6', '#ef4444', '#22c55e', '#a855f7',
    '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6',
    '#6366f1', '#84cc16',
  ],
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 12,
  taskBorderRadius: 4,
};

const DARK: GanttTheme = {
  ...LIGHT,
  background: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#162032',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  border: '#2d3f55',
  grid: '#1e3050',
  weekend: 'rgba(255,255,255,0.03)',
  today: '#fb923c',
  header: {
    background: '#070d1a',
    text: '#e2e8f0',
    border: 'rgba(255,255,255,0.08)',
  },
  taskBorder: 'rgba(255,255,255,0.12)',
  taskProgress: 'rgba(0,0,0,0.35)',
  dependency: '#475569',
  group: {
    background: '#1a2740',
    text: '#94a3b8',
  },
  palette: [
    '#60a5fa', '#f87171', '#4ade80', '#c084fc',
    '#fbbf24', '#22d3ee', '#f472b6', '#2dd4bf',
    '#818cf8', '#a3e635',
  ],
};

const OCEAN: GanttTheme = {
  ...LIGHT,
  background: '#ecf5ff',
  surface: '#dbeafe',
  surfaceAlt: '#d0e8fd',
  text: '#0c2d5e',
  textSecondary: '#3b6fa0',
  border: '#93c5fd',
  grid: '#bfdbfe',
  weekend: 'rgba(14,165,233,0.06)',
  today: '#ef4444',
  header: {
    background: '#0c4a6e',
    text: '#e0f2fe',
    border: 'rgba(255,255,255,0.12)',
  },
  milestone: '#f59e0b',
  milestoneStroke: '#78350f',
  dependency: '#38bdf8',
  group: {
    background: '#bfdbfe',
    text: '#1e40af',
  },
  palette: [
    '#0284c7', '#0891b2', '#0d9488', '#059669',
    '#7c3aed', '#9333ea', '#db2777', '#e11d48',
    '#2563eb', '#0369a1',
  ],
};

const FOREST: GanttTheme = {
  ...LIGHT,
  background: '#f0fdf4',
  surface: '#dcfce7',
  surfaceAlt: '#d0f5e0',
  text: '#14532d',
  textSecondary: '#4d7c60',
  border: '#86efac',
  grid: '#bbf7d0',
  weekend: 'rgba(22,163,74,0.05)',
  today: '#dc2626',
  header: {
    background: '#14532d',
    text: '#f0fdf4',
    border: 'rgba(255,255,255,0.12)',
  },
  milestone: '#ca8a04',
  milestoneStroke: '#713f12',
  dependency: '#4ade80',
  group: {
    background: '#bbf7d0',
    text: '#15803d',
  },
  palette: [
    '#16a34a', '#15803d', '#166534', '#65a30d',
    '#4d7c0f', '#0d9488', '#0891b2', '#7c3aed',
    '#ca8a04', '#9a3412',
  ],
};

export const THEMES: Record<string, GanttTheme> = { light: LIGHT, dark: DARK, ocean: OCEAN, forest: FOREST };

export function resolveTheme(
  theme?: Partial<GanttTheme> | 'light' | 'dark' | 'ocean' | 'forest',
): GanttTheme {
  if (!theme) return LIGHT;
  if (typeof theme === 'string') return THEMES[theme] ?? LIGHT;
  return {
    ...LIGHT,
    ...theme,
    header: { ...LIGHT.header, ...theme.header },
    group: { ...LIGHT.group, ...theme.group },
  };
}
