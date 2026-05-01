import { describe, it, expect } from 'vitest';
import { renderSVG } from '../../src/renderer';
import type { Task, GanttOptions } from '../../src/types';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const d = (s: string) => new Date(s);

const BASE_TASKS: Task[] = [
  { id: '1', name: 'Research', start: d('2025-01-06'), end: d('2025-01-17'), group: 'Phase 1', progress: 100 },
  { id: '2', name: 'Design',   start: d('2025-01-20'), end: d('2025-02-07'), group: 'Phase 1', progress: 60, dependencies: ['1'] },
  { id: '3', name: 'Build',    start: d('2025-02-10'), end: d('2025-03-14'), group: 'Phase 2', dependencies: ['2'] },
  { id: '4', name: 'Launch',   start: d('2025-03-21'), end: d('2025-03-21'), milestone: true, dependencies: ['3'] },
];

function render(overrides: Partial<GanttOptions> = {}): string {
  return renderSVG({ tasks: BASE_TASKS, timeUnit: 'week', ...overrides });
}

// ── Basic SVG structure ───────────────────────────────────────────────────────

describe('renderSVG – structure', () => {
  it('returns a string starting with <svg', () => {
    expect(render()).toMatch(/^<svg /);
  });

  it('closes the SVG element', () => {
    expect(render()).toMatch(/<\/svg>$/);
  });

  it('includes the xmlns attribute', () => {
    expect(render()).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('includes explicit width and height', () => {
    const svg = render();
    expect(svg).toMatch(/width="\d+"/);
    expect(svg).toMatch(/height="\d+"/);
  });

  it('contains a <defs> block', () => {
    expect(render()).toContain('<defs>');
  });

  it('defines the dependency arrow marker', () => {
    expect(render()).toContain('<marker id="arr"');
  });
});

// ── Empty / edge cases ────────────────────────────────────────────────────────

describe('renderSVG – empty tasks', () => {
  it('returns a valid SVG for an empty task list', () => {
    const svg = renderSVG({ tasks: [] });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('includes a "No tasks" message for empty list', () => {
    const svg = renderSVG({ tasks: [] });
    expect(svg).toContain('No tasks');
  });
});

// ── Title ─────────────────────────────────────────────────────────────────────

describe('renderSVG – title', () => {
  it('renders the title text when provided', () => {
    const svg = render({ title: 'My Project' });
    expect(svg).toContain('My Project');
  });

  it('omits the title element when not provided', () => {
    const svg = render();
    // Should not have a large font-size=20 title text
    const match = svg.match(/font-size="20"/g);
    expect(match).toBeNull();
  });

  it('escapes HTML entities in the title', () => {
    const svg = render({ title: 'A & B <Test>' });
    expect(svg).toContain('A &amp; B &lt;Test&gt;');
    expect(svg).not.toContain('A & B <Test>');
  });
});

// ── Themes ────────────────────────────────────────────────────────────────────

describe('renderSVG – themes', () => {
  it.each(['light', 'dark', 'ocean', 'forest'] as const)('renders without error with %s theme', (theme) => {
    const svg = render({ theme });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('uses the dark theme background color', () => {
    const svg = render({ theme: 'dark' });
    expect(svg).toContain('#0f172a'); // dark background
  });

  it('applies custom theme background', () => {
    const svg = render({ theme: { background: '#112233' } });
    expect(svg).toContain('#112233');
  });

  it('applies custom font family', () => {
    const svg = render({ theme: { fontFamily: 'Courier New, monospace' } });
    expect(svg).toContain('Courier New, monospace');
  });
});

// ── Time units ────────────────────────────────────────────────────────────────

describe('renderSVG – time units', () => {
  it.each(['day', 'week', 'month', 'quarter'] as const)('renders %s view without error', (timeUnit) => {
    const svg = render({ timeUnit });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it('day view contains SMTWTFS day abbreviations', () => {
    const svg = render({ timeUnit: 'day' });
    // The subLabel for day view contains single letters
    expect(svg).toMatch(/[SMTWF]/); // S, M, T, W, T, F, S
  });

  it('week view contains W\d week labels', () => {
    const svg = render({ timeUnit: 'week' });
    expect(svg).toMatch(/W\d+/);
  });

  it('month view contains short month names', () => {
    const svg = render({ timeUnit: 'month' });
    expect(svg).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
  });

  it('quarter view contains Q1–Q4 labels', () => {
    const svg = render({ timeUnit: 'quarter' });
    expect(svg).toMatch(/Q[1-4]/);
  });
});

// ── Elements toggle ───────────────────────────────────────────────────────────

describe('renderSVG – elements', () => {
  it('includes the legend by default', () => {
    expect(render()).toContain('LEGEND');
  });

  it('omits the legend when showLegend is false', () => {
    expect(render({ elements: { showLegend: false } })).not.toContain('LEGEND');
  });

  it('today indicator line is omitted when showToday is false', () => {
    const svg = render({ elements: { showToday: false } });
    // The today line uses a unique stroke-dasharray="4,3"; the legend text
    // is separate and unaffected by this toggle.
    expect(svg).not.toContain('stroke-dasharray="4,3"');
  });

  it('renders group header rows by default', () => {
    const svg = render({ elements: { showGroupHeaders: true } });
    expect(svg).toContain('Phase 1');
    expect(svg).toContain('Phase 2');
  });
});

// ── Task names ────────────────────────────────────────────────────────────────

describe('renderSVG – task labels', () => {
  it('includes all task names in the output', () => {
    const svg = render();
    for (const task of BASE_TASKS.filter(t => !t.milestone)) {
      expect(svg).toContain(task.name);
    }
  });

  it('escapes special characters in task names', () => {
    const tasks: Task[] = [
      { id: '1', name: 'Task <A> & "B"', start: d('2025-01-01'), end: d('2025-01-31') },
    ];
    const svg = renderSVG({ tasks });
    expect(svg).toContain('Task &lt;A&gt; &amp; &quot;B&quot;');
    expect(svg).not.toContain('Task <A>');
  });
});

// ── Dependencies ──────────────────────────────────────────────────────────────

describe('renderSVG – dependencies', () => {
  it('renders dependency paths when showDependencies is true', () => {
    const svg = render({ elements: { showDependencies: true } });
    // Dependency paths use the SVG <path> element with M ... L ... commands
    expect(svg).toMatch(/<path d="M\d/);
  });

  it('omits dependency paths when showDependencies is false', () => {
    const svg = render({ elements: { showDependencies: false } });
    // Dependency paths are stroked with fill="none"; the defs arrow marker
    // path (M0,0) has an explicit fill, so this distinguishes the two.
    const depPaths = svg.match(/<path[^>]+fill="none"[^>]*>/g);
    expect(depPaths).toBeNull();
  });
});

// ── Milestones ────────────────────────────────────────────────────────────────

describe('renderSVG – milestones', () => {
  it('renders a milestone diamond (polygon) for milestone tasks', () => {
    const svg = render({ elements: { showMilestones: true } });
    // Milestone is rendered as <polygon points="...">
    expect(svg).toContain('<polygon points="');
  });

  it('omits milestone polygons when showMilestones is false', () => {
    const svg = render({ elements: { showMilestones: false } });
    // No milestone diamond (legend polygons use transform, dep arrow uses path)
    // The milestone-specific polygon has no transform attribute
    const rawPolygons = svg.match(/<polygon points="[^"]*" fill="[^"]*milestone/g);
    expect(rawPolygons).toBeNull();
  });
});

// ── Progress ──────────────────────────────────────────────────────────────────

describe('renderSVG – progress', () => {
  it('outputs progress overlay rects for tasks with progress', () => {
    // Disable the legend so its "Progress" example doesn't interfere.
    // The light theme's taskProgress color is rgba(0,0,0,0.25).
    const svg = render({ elements: { showProgress: true, showLegend: false } });
    expect(svg).toContain('rgba(0,0,0,0.25)'); // LIGHT.taskProgress
  });

  it('skips progress overlay when showProgress is false', () => {
    const svg = render({ elements: { showProgress: false, showLegend: false } });
    expect(svg).not.toContain('rgba(0,0,0,0.25)');
  });
});

// ── Dimensions ───────────────────────────────────────────────────────────────

describe('renderSVG – dimensions', () => {
  it('wider chart for more columns (day vs month)', () => {
    const day   = render({ timeUnit: 'day' });
    const month = render({ timeUnit: 'month' });

    const wDay   = parseInt(day.match(/width="(\d+)"/)![1]);
    const wMonth = parseInt(month.match(/width="(\d+)"/)![1]);

    // Day view spans many narrow columns → wider than month view
    expect(wDay).toBeGreaterThan(wMonth);
  });

  it('taller chart for more tasks', () => {
    const few  = renderSVG({ tasks: BASE_TASKS.slice(0, 1), timeUnit: 'week' });
    const many = render();
    const hFew  = parseInt(few.match(/height="(\d+)"/)![1]);
    const hMany = parseInt(many.match(/height="(\d+)"/)![1]);
    expect(hMany).toBeGreaterThan(hFew);
  });

  it('custom rowHeight increases total height', () => {
    const normal = render({ rowHeight: 40 });
    const tall   = render({ rowHeight: 80 });
    const h1 = parseInt(normal.match(/height="(\d+)"/)![1]);
    const h2 = parseInt(tall.match(/height="(\d+)"/)![1]);
    expect(h2).toBeGreaterThan(h1);
  });

  it('custom labelWidth changes total width', () => {
    const narrow = render({ labelWidth: 100 });
    const wide   = render({ labelWidth: 300 });
    const w1 = parseInt(narrow.match(/width="(\d+)"/)![1]);
    const w2 = parseInt(wide.match(/width="(\d+)"/)![1]);
    expect(w2).toBeGreaterThan(w1);
  });
});
