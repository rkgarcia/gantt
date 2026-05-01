import GanttChart, { renderSVG, THEMES } from './src/index';

// ── 1. Functional API (SVG string) ─────────────────────────────────────────

const svg = renderSVG({
  title: 'Product Roadmap 2025',
  timeUnit: 'week',
  theme: 'dark',
  elements: {
    showGrid: true,
    showToday: true,
    showDependencies: true,
    showProgress: true,
    showLegend: true,
    showWeekends: true,
    showMilestones: true,
  },
  tasks: [
    // ── Phase 1 ─────────────────────────────────────────────────────────────
    { id: 'r1', name: 'Requirements', start: new Date('2025-01-06'), end: new Date('2025-01-17'), group: 'Phase 1', progress: 100 },
    { id: 'd1', name: 'Design',       start: new Date('2025-01-20'), end: new Date('2025-02-07'), group: 'Phase 1', dependencies: ['r1'], progress: 75 },
    // ── Phase 2 ─────────────────────────────────────────────────────────────
    { id: 'b1', name: 'Backend API',  start: new Date('2025-02-10'), end: new Date('2025-03-14'), group: 'Phase 2', dependencies: ['d1'], progress: 40 },
    { id: 'f1', name: 'Frontend',     start: new Date('2025-02-17'), end: new Date('2025-03-21'), group: 'Phase 2', dependencies: ['d1'], progress: 20 },
    { id: 'q1', name: 'QA & Testing', start: new Date('2025-03-17'), end: new Date('2025-03-28'), group: 'Phase 2', dependencies: ['b1', 'f1'] },
    // ── Milestones ──────────────────────────────────────────────────────────
    { id: 'mv', name: 'MVP',          start: new Date('2025-02-07'), end: new Date('2025-02-07'), milestone: true, dependencies: ['d1'] },
    { id: 'ml', name: 'Launch',       start: new Date('2025-04-01'), end: new Date('2025-04-01'), milestone: true, dependencies: ['q1'] },
  ],
});

// In Node.js: write to file
import { writeFileSync } from 'fs';
writeFileSync('gantt.svg', svg);

// ── 2. Class API (browser) ─────────────────────────────────────────────────

declare const document: Document;
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

// Render into the page
gantt.mount(document.getElementById('chart')!);

// Live update
gantt.update({ theme: 'forest', timeUnit: 'week' });

// Export (browser only)
gantt.exportSVG({ filename: 'sprint-plan' });
gantt.exportPNG({ filename: 'sprint-plan', scale: 2 });
gantt.exportJPG({ filename: 'sprint-plan', scale: 2, quality: 0.9 });

// ── 3. Custom theme ────────────────────────────────────────────────────────

const custom = new GanttChart({
  title: 'Custom Theme',
  timeUnit: 'month',
  theme: {
    background: '#1a0a2e',
    surface: '#2d1b4e',
    surfaceAlt: '#261544',
    text: '#e8d5ff',
    textSecondary: '#a78bcc',
    border: '#4a2d7a',
    grid: '#3d2266',
    weekend: 'rgba(150,80,255,0.05)',
    today: '#ff6b9d',
    header: { background: '#0d0520', text: '#e8d5ff', border: 'rgba(200,150,255,0.15)' },
    taskText: '#ffffff',
    taskBorder: 'rgba(255,255,255,0.1)',
    taskProgress: 'rgba(0,0,0,0.3)',
    milestone: '#ff6b9d',
    milestoneStroke: '#cc3366',
    dependency: '#7c55aa',
    group: { background: '#3d2266', text: '#c4a0f0' },
    palette: ['#9d4edd', '#c77dff', '#e0aaff', '#7b2fff', '#5a0080', '#ff6b9d', '#ff9e00'],
    fontFamily: 'Georgia, serif',
    fontSize: 13,
    taskBorderRadius: 8,
  },
  tasks: [
    { id: '1', name: 'Alpha', start: new Date('2025-01-01'), end: new Date('2025-03-31'), group: 'Release', progress: 80 },
    { id: '2', name: 'Beta',  start: new Date('2025-04-01'), end: new Date('2025-06-30'), group: 'Release', dependencies: ['1'] },
    { id: '3', name: 'GA',    start: new Date('2025-07-01'), end: new Date('2025-07-01'), milestone: true, dependencies: ['2'] },
  ],
});

// ── 4. List all built-in themes ────────────────────────────────────────────

console.log('Available themes:', Object.keys(THEMES)); // ['light', 'dark', 'ocean', 'forest']
