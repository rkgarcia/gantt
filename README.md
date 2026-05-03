# gantt-ts

[![npm](https://img.shields.io/npm/v/@rkgarcia/gantt-ts)](https://www.npmjs.com/package/@rkgarcia/gantt-ts)
[![CI](https://github.com/rkgarcia/gantt/actions/workflows/release.yml/badge.svg)](https://github.com/rkgarcia/gantt/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A zero-dependency TypeScript library for rendering customizable Gantt charts as SVG, with support for themes, element toggling, and multi-format export (SVG / PNG / JPEG).

---

## Features

- **Pure SVG output** — no canvas, no DOM required for rendering
- **4 built-in themes** — `light`, `dark`, `ocean`, `forest`
- **Full custom themes** — override any color, font, border-radius, or palette
- **4 time scales** — `day`, `week`, `month`, `quarter`
- **Task groups** — collapsible group header bars with auto date-range
- **Milestones** — diamond markers for zero-duration events
- **Dependencies** — orthogonal arrow paths between tasks
- **Progress bars** — per-task completion percentage (0–100)
- **Toggleable elements** — grid, legend, today line, weekends, labels, etc.
- **Browser export** — SVG download, PNG/JPEG via Canvas API
- **Functional + class API** — use `renderSVG()` or the `GanttChart` class

---

## Installation

```bash
npm install gantt-ts
# or
pnpm add gantt-ts
```

---

## Quick start

### Functional (Node.js or browser)

```typescript
import { renderSVG } from 'gantt-ts';
import { writeFileSync } from 'fs';

const svg = renderSVG({
  title: 'Product Roadmap 2025',
  timeUnit: 'week',
  theme: 'dark',
  tasks: [
    { id: '1', name: 'Research',    start: new Date('2025-01-06'), end: new Date('2025-01-17'), group: 'Phase 1', progress: 100 },
    { id: '2', name: 'Design',      start: new Date('2025-01-20'), end: new Date('2025-02-07'), group: 'Phase 1', progress: 60, dependencies: ['1'] },
    { id: '3', name: 'Development', start: new Date('2025-02-10'), end: new Date('2025-03-14'), group: 'Phase 2', dependencies: ['2'] },
    { id: '4', name: 'Launch',      start: new Date('2025-03-21'), end: new Date('2025-03-21'), milestone: true, dependencies: ['3'] },
  ],
});

writeFileSync('roadmap.svg', svg);
```

### Class API (browser)

```typescript
import GanttChart from 'gantt-ts';

const gantt = new GanttChart({
  title: 'Sprint Plan',
  timeUnit: 'day',
  theme: 'ocean',
  tasks: [
    { id: '1', name: 'Task A', start: new Date('2025-01-06'), end: new Date('2025-01-10'), progress: 50 },
    { id: '2', name: 'Task B', start: new Date('2025-01-08'), end: new Date('2025-01-14'), dependencies: ['1'] },
    { id: '3', name: 'Done',   start: new Date('2025-01-14'), end: new Date('2025-01-14'), milestone: true },
  ],
});

// Mount into the page
gantt.mount(document.getElementById('chart')!);

// Live update
gantt.update({ theme: 'forest', timeUnit: 'week' });

// Export
gantt.exportSVG({ filename: 'sprint-plan' });
await gantt.exportPNG({ filename: 'sprint-plan', scale: 2 });
await gantt.exportJPG({ filename: 'sprint-plan', scale: 2, quality: 0.9 });
```

### React

```tsx
import { useEffect, useRef } from 'react';
import GanttChart from 'gantt-ts';

const tasks = [
  { id: '1', name: 'Research',    start: new Date('2025-01-06'), end: new Date('2025-01-17'), group: 'Phase 1', progress: 100 },
  { id: '2', name: 'Design',      start: new Date('2025-01-20'), end: new Date('2025-02-07'), group: 'Phase 1', dependencies: ['1'] },
  { id: '3', name: 'Development', start: new Date('2025-02-10'), end: new Date('2025-03-14'), group: 'Phase 2', dependencies: ['2'] },
  { id: '4', name: 'Launch',      start: new Date('2025-03-21'), end: new Date('2025-03-21'), milestone: true, dependencies: ['3'] },
];

export function Roadmap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = new GanttChart({ title: 'Roadmap', timeUnit: 'week', theme: 'dark', tasks });
    chart.mount(ref.current);
  }, []);

  return <div ref={ref} />;
}
```

### Plain HTML (CDN / ES module)

```html
<div id="chart"></div>
<script type="module">
  import GanttChart from 'https://esm.sh/gantt-ts';

  new GanttChart({
    title: 'My Project',
    timeUnit: 'week',
    theme: 'ocean',
    tasks: [
      { id: '1', name: 'Design',   start: new Date('2025-01-06'), end: new Date('2025-01-17') },
      { id: '2', name: 'Build',    start: new Date('2025-01-20'), end: new Date('2025-02-14'), dependencies: ['1'] },
      { id: '3', name: 'Ship',     start: new Date('2025-02-14'), end: new Date('2025-02-14'), milestone: true },
    ],
  }).mount(document.getElementById('chart'));
</script>
```

---

## API Reference

### `renderSVG(options: GanttOptions): string`

Renders a Gantt chart and returns an SVG string. Works in Node.js and browsers.

### `GanttChart` class

| Method | Description |
|--------|-------------|
| `constructor(options)` | Create a chart with the given options |
| `render()` | Returns the SVG string |
| `mount(el: HTMLElement)` | Injects the SVG into a DOM element |
| `update(partial)` | Merges options and re-renders if mounted |
| `exportSVG(opts?)` | Downloads an `.svg` file (browser) |
| `exportPNG(opts?)` | Downloads a `.png` file via Canvas (browser) |
| `exportJPG(opts?)` | Downloads a `.jpg` file via Canvas (browser) |
| `toDataURL(format?, opts?)` | Returns a base64 data URL |

---

## `GanttOptions`

```typescript
interface GanttOptions {
  tasks: Task[];                                         // required
  theme?: 'light' | 'dark' | 'ocean' | 'forest'         // built-in name
        | Partial<GanttTheme>;                           // or custom object
  elements?: GanttElements;                             // visibility toggles
  timeUnit?: 'day' | 'week' | 'month' | 'quarter';      // default: 'week'
  startDate?: Date;                                     // override chart start
  endDate?: Date;                                       // override chart end
  rowHeight?: number;                                   // px, default: 40
  columnWidth?: number;                                 // px, auto by timeUnit
  labelWidth?: number;                                  // px, default: 190
  padding?: number;                                     // px, default: 16
  title?: string;                                       // chart heading
}
```

---

## `Task`

```typescript
interface Task {
  id: string;           // unique identifier
  name: string;         // display label
  start: Date;          // bar start
  end: Date;            // bar end (same as start for milestones)
  group?: string;       // group name (creates header rows)
  color?: string;       // explicit hex color (bypasses palette)
  dependencies?: string[];  // ids of predecessor tasks
  progress?: number;    // 0–100, renders a completion overlay
  milestone?: boolean;  // renders a diamond instead of a bar
}
```

---

## `GanttElements` — visibility toggles

```typescript
interface GanttElements {
  showGrid?: boolean;          // vertical column lines + horizontal row lines (default: true)
  showWeekends?: boolean;      // tinted columns on Sat/Sun (default: true)
  showToday?: boolean;         // current-date indicator line (default: true)
  showDependencies?: boolean;  // arrows between tasks (default: true)
  showProgress?: boolean;      // progress overlay on bars (default: true)
  showMilestones?: boolean;    // diamond markers (default: true)
  showGroupHeaders?: boolean;  // group header rows (default: true)
  showTaskLabels?: boolean;    // text inside task bars (default: true)
  showLegend?: boolean;        // symbol legend at bottom (default: true)
}
```

---

## Themes

Four built-in themes, all fully overridable:

| Name | Description |
|------|-------------|
| `light` | Clean white background, slate header |
| `dark` | Deep navy background, high-contrast |
| `ocean` | Light blue tones, teal accents |
| `forest` | Soft green palette, earthy tones |

### Custom theme

Pass any `Partial<GanttTheme>` — unset properties fall back to the `light` theme:

```typescript
renderSVG({
  tasks,
  theme: {
    background: '#1a0a2e',
    surface: '#2d1b4e',
    surfaceAlt: '#261544',
    text: '#e8d5ff',
    textSecondary: '#a78bcc',
    border: '#4a2d7a',
    grid: '#3d2266',
    weekend: 'rgba(150,80,255,0.06)',
    today: '#ff6b9d',
    header: { background: '#0d0520', text: '#e8d5ff', border: 'rgba(200,150,255,0.15)' },
    taskText: '#ffffff',
    taskBorder: 'rgba(255,255,255,0.1)',
    taskProgress: 'rgba(0,0,0,0.3)',
    milestone: '#ff6b9d',
    milestoneStroke: '#cc3366',
    dependency: '#7c55aa',
    group: { background: '#3d2266', text: '#c4a0f0' },
    palette: ['#9d4edd', '#c77dff', '#e0aaff', '#7b2fff', '#ff6b9d'],
    fontFamily: 'Georgia, serif',
    fontSize: 13,
    taskBorderRadius: 8,
  },
});
```

### `GanttTheme` shape

```typescript
interface GanttTheme {
  background: string;     // SVG canvas background
  surface: string;        // chart body fill
  surfaceAlt: string;     // alternating row fill
  text: string;           // primary text color
  textSecondary: string;  // legend / secondary labels
  border: string;         // outer border + row dividers
  grid: string;           // grid lines
  weekend: string;        // weekend column tint (use rgba for transparency)
  today: string;          // today indicator line color
  header: {
    background: string;   // header row background
    text: string;         // header text
    border: string;       // header internal dividers
  };
  taskText: string;       // text inside task bars
  taskBorder: string;     // task bar border (use rgba)
  taskProgress: string;   // progress overlay color (use rgba)
  milestone: string;      // diamond fill color
  milestoneStroke: string;// diamond stroke color
  dependency: string;     // arrow color
  group: {
    background: string;   // group header row background
    text: string;         // group header text
  };
  palette: string[];      // auto-assigned task colors (rotates)
  fontFamily: string;     // CSS font-family string
  fontSize: number;       // base font size in px
  taskBorderRadius: number; // bar corner radius in px
}
```

---

## Export options

```typescript
interface ExportOptions {
  filename?: string;   // output filename without extension (default: 'gantt-chart')
  scale?: number;      // pixel ratio for PNG/JPEG (default: 2 = @2x)
  quality?: number;    // JPEG quality 0–1 (default: 0.92)
  background?: string; // canvas fill for PNG/JPEG (default: '#ffffff')
}
```

### Node.js export

`exportPNG` / `exportJPG` require a browser environment (Canvas API). In Node.js, use `renderSVG()` and convert the string with a library like [`sharp`](https://sharp.pixelplumbing.com/) or [`svg2img`](https://github.com/fuzhenn/node-svg2img):

```typescript
import { renderSVG } from 'gantt-ts';
import sharp from 'sharp';

const svg = renderSVG({ tasks, theme: 'dark' });
await sharp(Buffer.from(svg)).png().toFile('chart.png');
```

---

## Development

```bash
npm install

# Build
npm run build

# Unit tests (vitest)
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests + screenshots (playwright, chromium)
npx playwright install chromium --with-deps
npm run test:e2e

# Update screenshot baselines
npm run test:e2e:update

# Watch mode
npm run test:watch
```

E2E screenshots are written to `tests/screenshots/`. Playwright snapshot baselines are stored in `tests/snapshots/`.

---

## License

MIT
