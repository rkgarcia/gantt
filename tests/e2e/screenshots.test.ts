import { test, expect } from '@playwright/test';
import { renderSVG } from '../../src/renderer';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.resolve('tests/screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// ── Shared test data ──────────────────────────────────────────────────────────

const d = (s: string) => new Date(s);

const TASKS = [
  { id: '1',  name: 'Market Research',     start: d('2025-01-06'), end: d('2025-01-17'), group: 'Discovery',   progress: 100 },
  { id: '2',  name: 'Competitive Analysis',start: d('2025-01-13'), end: d('2025-01-24'), group: 'Discovery',   progress: 100, dependencies: ['1'] },
  { id: '3',  name: 'UX Wireframes',       start: d('2025-01-27'), end: d('2025-02-14'), group: 'Design',      progress: 85,  dependencies: ['2'] },
  { id: '4',  name: 'UI Components',       start: d('2025-02-10'), end: d('2025-02-28'), group: 'Design',      progress: 60,  dependencies: ['3'] },
  { id: 'r1', name: 'Design Review',       start: d('2025-03-01'), end: d('2025-03-01'), milestone: true,      dependencies: ['4'] },
  { id: '5',  name: 'Backend API',         start: d('2025-03-03'), end: d('2025-04-11'), group: 'Development', progress: 35,  dependencies: ['r1'] },
  { id: '6',  name: 'Frontend',            start: d('2025-03-10'), end: d('2025-04-18'), group: 'Development', progress: 20,  dependencies: ['r1'] },
  { id: '7',  name: 'Integration Tests',   start: d('2025-04-14'), end: d('2025-04-25'), group: 'QA',          dependencies: ['5', '6'] },
  { id: '8',  name: 'Performance Tests',   start: d('2025-04-21'), end: d('2025-04-30'), group: 'QA',          dependencies: ['7'] },
  { id: 'r2', name: 'Launch',             start: d('2025-05-05'), end: d('2025-05-05'), milestone: true,       dependencies: ['8'] },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function wrap(svgContent: string, bg = '#f8fafc'): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>* { box-sizing: border-box; margin: 0; } body { background: ${bg}; padding: 24px; font-family: system-ui; }</style></head>
<body>${svgContent}</body>
</html>`;
}

async function capture(page: Parameters<typeof test>[1] extends (args: infer A) => any ? A['page'] : never, svg: string, filename: string, bg?: string) {
  await page.setContent(wrap(svg, bg));
  await page.waitForLoadState('networkidle');
  const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' });
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, filename), screenshot);
  return screenshot;
}

// ── Theme screenshots ─────────────────────────────────────────────────────────

test.describe('Themes', () => {
  test('light theme – week view', async ({ page }) => {
    const svg = renderSVG({ tasks: TASKS, theme: 'light', title: 'Light Theme – Week View', timeUnit: 'week' });
    const shot = await capture(page, svg, 'theme-light.png', '#f1f5f9');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('theme-light.png');
  });

  test('dark theme – week view', async ({ page }) => {
    const svg = renderSVG({ tasks: TASKS, theme: 'dark', title: 'Dark Theme – Week View', timeUnit: 'week' });
    const shot = await capture(page, svg, 'theme-dark.png', '#0f172a');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('theme-dark.png');
  });

  test('ocean theme – week view', async ({ page }) => {
    const svg = renderSVG({ tasks: TASKS, theme: 'ocean', title: 'Ocean Theme – Week View', timeUnit: 'week' });
    const shot = await capture(page, svg, 'theme-ocean.png', '#e0f2fe');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('theme-ocean.png');
  });

  test('forest theme – week view', async ({ page }) => {
    const svg = renderSVG({ tasks: TASKS, theme: 'forest', title: 'Forest Theme – Week View', timeUnit: 'week' });
    const shot = await capture(page, svg, 'theme-forest.png', '#f0fdf4');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('theme-forest.png');
  });

  test('custom purple theme', async ({ page }) => {
    const svg = renderSVG({
      tasks: TASKS,
      title: 'Custom Purple Theme',
      timeUnit: 'week',
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
        palette: ['#9d4edd','#c77dff','#e0aaff','#7b2fff','#5a0080','#ff6b9d','#ff9e00'],
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        taskBorderRadius: 8,
      },
    });
    const shot = await capture(page, svg, 'theme-custom-purple.png', '#0d0520');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('theme-custom-purple.png');
  });
});

// ── Time unit screenshots ─────────────────────────────────────────────────────

test.describe('Time units', () => {
  test('day view', async ({ page }) => {
    const sprintTasks = [
      { id: '1', name: 'Sprint Planning', start: d('2025-01-06'), end: d('2025-01-07'), group: 'Sprint 1', progress: 100 },
      { id: '2', name: 'Feature A',       start: d('2025-01-08'), end: d('2025-01-13'), group: 'Sprint 1', progress: 80, dependencies: ['1'] },
      { id: '3', name: 'Feature B',       start: d('2025-01-08'), end: d('2025-01-15'), group: 'Sprint 1', progress: 40, dependencies: ['1'] },
      { id: '4', name: 'Code Review',     start: d('2025-01-14'), end: d('2025-01-16'), group: 'Sprint 1', dependencies: ['2'] },
      { id: '5', name: 'Sprint Review',   start: d('2025-01-17'), end: d('2025-01-17'), milestone: true, dependencies: ['4', '3'] },
    ];
    const svg = renderSVG({ tasks: sprintTasks, theme: 'light', title: 'Day View – Sprint Timeline', timeUnit: 'day' });
    const shot = await capture(page, svg, 'timeunit-day.png');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('timeunit-day.png');
  });

  test('week view', async ({ page }) => {
    const svg = renderSVG({ tasks: TASKS, theme: 'light', title: 'Week View', timeUnit: 'week' });
    const shot = await capture(page, svg, 'timeunit-week.png');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('timeunit-week.png');
  });

  test('month view', async ({ page }) => {
    const svg = renderSVG({ tasks: TASKS, theme: 'ocean', title: 'Month View', timeUnit: 'month' });
    const shot = await capture(page, svg, 'timeunit-month.png', '#e0f2fe');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('timeunit-month.png');
  });

  test('quarter view', async ({ page }) => {
    const yearTasks = [
      { id: '1', name: 'Research & Planning', start: d('2025-01-01'), end: d('2025-03-31'), group: 'Strategy', progress: 100 },
      { id: '2', name: 'Product Development', start: d('2025-04-01'), end: d('2025-09-30'), group: 'Engineering', progress: 55, dependencies: ['1'] },
      { id: '3', name: 'Beta Program',         start: d('2025-07-01'), end: d('2025-09-30'), group: 'QA', dependencies: ['2'] },
      { id: '4', name: 'GA Launch',            start: d('2025-10-01'), end: d('2025-10-01'), milestone: true, dependencies: ['3'] },
      { id: '5', name: 'Growth Phase',         start: d('2025-10-01'), end: d('2025-12-31'), group: 'Go-to-Market', dependencies: ['4'] },
    ];
    const svg = renderSVG({ tasks: yearTasks, theme: 'forest', title: 'Quarter View – Annual Roadmap', timeUnit: 'quarter' });
    const shot = await capture(page, svg, 'timeunit-quarter.png', '#f0fdf4');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('timeunit-quarter.png');
  });
});

// ── Element visibility screenshots ────────────────────────────────────────────

test.describe('Element visibility', () => {
  test('all elements enabled', async ({ page }) => {
    const svg = renderSVG({
      tasks: TASKS,
      theme: 'light',
      title: 'All Elements Enabled',
      timeUnit: 'week',
      elements: {
        showGrid: true, showLegend: true, showDependencies: true,
        showProgress: true, showMilestones: true, showGroupHeaders: true,
        showToday: true, showWeekends: true, showTaskLabels: true,
      },
    });
    const shot = await capture(page, svg, 'elements-all-on.png');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('elements-all-on.png');
  });

  test('minimal – grid, legend, and weekends off', async ({ page }) => {
    const svg = renderSVG({
      tasks: TASKS,
      theme: 'light',
      title: 'Minimal View',
      timeUnit: 'week',
      elements: {
        showGrid: false, showLegend: false, showDependencies: false,
        showProgress: false, showMilestones: false, showGroupHeaders: false,
        showToday: false, showWeekends: false, showTaskLabels: false,
      },
    });
    const shot = await capture(page, svg, 'elements-all-off.png');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('elements-all-off.png');
  });

  test('no groups – flat task list', async ({ page }) => {
    const flat = TASKS.filter(t => !t.milestone).map(({ group: _g, ...t }) => t);
    const svg = renderSVG({ tasks: flat, theme: 'dark', title: 'Flat Task List (No Groups)', timeUnit: 'week' });
    const shot = await capture(page, svg, 'elements-no-groups.png', '#0f172a');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('elements-no-groups.png');
  });
});

// ── Custom dimensions ─────────────────────────────────────────────────────────

test.describe('Custom dimensions', () => {
  test('narrow label column (120px)', async ({ page }) => {
    const svg = renderSVG({ tasks: TASKS, theme: 'light', title: 'Narrow Labels', timeUnit: 'week', labelWidth: 120 });
    const shot = await capture(page, svg, 'dim-narrow-labels.png');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('dim-narrow-labels.png');
  });

  test('wide label column (280px)', async ({ page }) => {
    const svg = renderSVG({ tasks: TASKS, theme: 'light', title: 'Wide Labels', timeUnit: 'week', labelWidth: 280 });
    const shot = await capture(page, svg, 'dim-wide-labels.png');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('dim-wide-labels.png');
  });

  test('tall rows (56px)', async ({ page }) => {
    const svg = renderSVG({ tasks: TASKS, theme: 'ocean', title: 'Tall Rows', timeUnit: 'week', rowHeight: 56 });
    const shot = await capture(page, svg, 'dim-tall-rows.png', '#e0f2fe');
    expect(shot.length).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('dim-tall-rows.png');
  });
});
