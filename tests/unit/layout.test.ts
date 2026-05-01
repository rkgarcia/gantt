import { describe, it, expect } from 'vitest';
import {
  parseDates,
  getDateRange,
  generateColumns,
  generateHeaderSpans,
  buildRows,
  dateToX,
  getChartEnd,
  addUnits,
} from '../../src/layout';
import type { Task } from '../../src/types';

// Use local-time constructor to avoid UTC-vs-local timezone off-by-one errors.
// new Date('YYYY-MM-DD') parses as UTC midnight, which shifts to the previous
// calendar day in negative-offset timezones (e.g. UTC-6).
const d = (s: string): Date => {
  const [y, m, day] = s.split('-').map(Number);
  return new Date(y, m - 1, day); // local midnight — getDate/getDay/getMonth are correct
};

// ── Fixtures ─────────────────────────────────────────────────────────────────

const TASKS: Task[] = [
  { id: '1', name: 'Alpha', start: d('2025-02-03'), end: d('2025-02-14'), group: 'Phase 1' },
  { id: '2', name: 'Beta',  start: d('2025-02-17'), end: d('2025-03-07'), group: 'Phase 1', dependencies: ['1'] },
  { id: '3', name: 'Gamma', start: d('2025-03-10'), end: d('2025-03-28'), group: 'Phase 2' },
];

const PALETTE = ['#f00', '#0f0', '#00f', '#ff0', '#f0f'];

// ── parseDates ────────────────────────────────────────────────────────────────

describe('parseDates', () => {
  it('preserves existing Date objects', () => {
    const task = { id: '1', name: 'T', start: d('2025-01-01'), end: d('2025-01-31') };
    const result = parseDates(task);
    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeInstanceOf(Date);
    expect(result.start.getTime()).toBe(task.start.getTime());
    expect(result.end.getTime()).toBe(task.end.getTime());
  });

  it('converts an ISO string start/end to Date with the correct timestamp', () => {
    const isoStart = '2025-06-15';
    const isoEnd   = '2025-06-30';
    const task = {
      id: '1', name: 'T',
      start: isoStart as unknown as Date,
      end:   isoEnd   as unknown as Date,
    };
    const result = parseDates(task);
    expect(result.start).toBeInstanceOf(Date);
    expect(result.end).toBeInstanceOf(Date);
    // parseDates converts via new Date(str) → same UTC timestamp
    expect(result.start.getTime()).toBe(new Date(isoStart).getTime());
    expect(result.end.getTime()).toBe(new Date(isoEnd).getTime());
  });
});

// ── addUnits ─────────────────────────────────────────────────────────────────

describe('addUnits', () => {
  const base = d('2025-03-15'); // local midnight March 15

  it('adds days', () => {
    expect(addUnits(base, 'day', 5).getDate()).toBe(20);
  });

  it('adds weeks', () => {
    expect(addUnits(base, 'week', 2).getDate()).toBe(29);
  });

  it('adds months', () => {
    expect(addUnits(base, 'month', 1).getMonth()).toBe(3); // April
  });

  it('adds quarters (3 months)', () => {
    expect(addUnits(base, 'quarter', 1).getMonth()).toBe(5); // June
  });

  it('subtracts with a negative count', () => {
    expect(addUnits(base, 'day', -5).getDate()).toBe(10);
  });
});

// ── getDateRange ──────────────────────────────────────────────────────────────

describe('getDateRange', () => {
  it('derives min/max from tasks and pads both ends', () => {
    const { start, end } = getDateRange(TASKS);
    expect(start.getTime()).toBeLessThan(TASKS[0].start.getTime());
    expect(end.getTime()).toBeGreaterThan(TASKS[TASKS.length - 1].end.getTime());
  });

  it('uses the provided startDate override', () => {
    const override = d('2025-01-01');
    const { start } = getDateRange(TASKS, override);
    expect(start.getTime()).toBeLessThanOrEqual(override.getTime());
  });

  it('uses the provided endDate override', () => {
    const override = d('2025-12-31');
    const { end } = getDateRange(TASKS, undefined, override);
    expect(end.getTime()).toBeGreaterThanOrEqual(override.getTime());
  });

  it('start is always before end', () => {
    const { start, end } = getDateRange(TASKS);
    expect(start.getTime()).toBeLessThan(end.getTime());
  });
});

// ── generateColumns ───────────────────────────────────────────────────────────

describe('generateColumns (day)', () => {
  // Use local-time dates: Jan 6 = Monday, Jan 13 = Monday
  const start = d('2025-01-06');
  const end   = d('2025-01-13');

  it('generates one column per day', () => {
    const cols = generateColumns(start, end, 'day');
    expect(cols).toHaveLength(7);
  });

  it('labels each column with the local day-of-month number', () => {
    const cols = generateColumns(start, end, 'day');
    expect(cols[0].label).toBe('6');
    expect(cols[1].label).toBe('7');
  });

  it('marks Saturday and Sunday as weekends', () => {
    const cols = generateColumns(start, end, 'day');
    const weekendDates = cols.filter(c => c.isWeekend).map(c => c.label);
    expect(weekendDates).toContain('11'); // Saturday Jan 11
    expect(weekendDates).toContain('12'); // Sunday  Jan 12
  });

  it('marks the 1st of a month as isMonthStart', () => {
    const cols = generateColumns(d('2024-12-30'), d('2025-01-04'), 'day');
    const monthStart = cols.find(c => c.label === '1');
    expect(monthStart?.isMonthStart).toBe(true);
  });
});

describe('generateColumns (week)', () => {
  // Jan 5, 2025 = Sunday; Jan 26 = Sunday (4 weeks apart)
  const start = d('2025-01-05');
  const end   = d('2025-01-26');

  it('generates one column per week', () => {
    const cols = generateColumns(start, end, 'week');
    expect(cols).toHaveLength(3);
  });

  it('column dates are all Sundays (day index 0)', () => {
    const cols = generateColumns(start, end, 'week');
    for (const col of cols) {
      expect(col.date.getDay()).toBe(0);
    }
  });

  it('isWeekend is always false for week-unit columns', () => {
    const cols = generateColumns(start, end, 'week');
    expect(cols.every(c => !c.isWeekend)).toBe(true);
  });
});

describe('generateColumns (month)', () => {
  it('generates one column per month', () => {
    const cols = generateColumns(d('2025-01-01'), d('2025-06-01'), 'month');
    expect(cols).toHaveLength(5);
  });

  it('labels use short month names', () => {
    const cols = generateColumns(d('2025-01-01'), d('2025-04-01'), 'month');
    expect(cols[0].label).toBe('Jan');
    expect(cols[2].label).toBe('Mar');
  });
});

describe('generateColumns (quarter)', () => {
  it('generates one column per quarter', () => {
    const cols = generateColumns(d('2025-01-01'), d('2026-01-01'), 'quarter');
    expect(cols).toHaveLength(4);
  });

  it('labels are Q1 through Q4', () => {
    const cols = generateColumns(d('2025-01-01'), d('2026-01-01'), 'quarter');
    expect(cols.map(c => c.label)).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
  });
});

// ── generateHeaderSpans ───────────────────────────────────────────────────────

describe('generateHeaderSpans', () => {
  it('returns an empty array for empty columns', () => {
    expect(generateHeaderSpans([], 'week')).toEqual([]);
  });

  it('groups day columns by month label', () => {
    const cols = generateColumns(d('2025-01-27'), d('2025-02-05'), 'day');
    const spans = generateHeaderSpans(cols, 'day');
    expect(spans.length).toBeGreaterThanOrEqual(2);
    expect(spans[0].label).toContain('January');
    expect(spans[1].label).toContain('February');
  });

  it('groups month columns by year', () => {
    const cols = generateColumns(d('2025-10-01'), d('2026-04-01'), 'month');
    const spans = generateHeaderSpans(cols, 'month');
    expect(spans.some(s => s.label === '2025')).toBe(true);
    expect(spans.some(s => s.label === '2026')).toBe(true);
  });

  it('spans are contiguous and cover all columns', () => {
    const cols = generateColumns(d('2025-01-01'), d('2025-06-01'), 'week');
    const spans = generateHeaderSpans(cols, 'week');
    let prev = 0;
    for (const span of spans) {
      expect(span.startCol).toBe(prev);
      expect(span.endCol).toBeGreaterThan(span.startCol);
      prev = span.endCol;
    }
    expect(prev).toBe(cols.length);
  });
});

// ── buildRows ─────────────────────────────────────────────────────────────────

describe('buildRows', () => {
  it('inserts one group header row per distinct group', () => {
    const rows = buildRows(TASKS, PALETTE);
    const groups = rows.filter(r => r.isGroup);
    expect(groups).toHaveLength(2);
    expect(groups[0].task.name).toBe('Phase 1');
    expect(groups[1].task.name).toBe('Phase 2');
  });

  it('assigns sequential row indices starting at 0', () => {
    const rows = buildRows(TASKS, PALETTE);
    expect(rows.map(r => r.row)).toEqual([...Array(rows.length).keys()]);
  });

  it('assigns palette colors to tasks without explicit color', () => {
    const rows = buildRows(TASKS, PALETTE);
    for (const row of rows.filter(r => !r.isGroup)) {
      expect(PALETTE).toContain(row.color);
    }
  });

  it('uses an explicit task color over the palette', () => {
    const tasks: Task[] = [
      { id: '1', name: 'T', start: d('2025-01-01'), end: d('2025-01-31'), color: '#deadbe' },
    ];
    const rows = buildRows(tasks, PALETTE);
    expect(rows[0].color).toBe('#deadbe');
  });

  it('ungrouped tasks produce no isGroup rows', () => {
    const tasks: Task[] = [
      { id: 'a', name: 'A', start: d('2025-01-01'), end: d('2025-01-15') },
      { id: 'b', name: 'B', start: d('2025-01-16'), end: d('2025-01-31') },
    ];
    const rows = buildRows(tasks, PALETTE);
    expect(rows.every(r => !r.isGroup)).toBe(true);
    expect(rows).toHaveLength(2);
  });

  it('group task start/end spans all children', () => {
    const rows = buildRows(TASKS, PALETTE);
    const phase1 = rows.find(r => r.isGroup && r.task.name === 'Phase 1')!;
    expect(phase1.task.start.getTime()).toBe(TASKS[0].start.getTime());
    expect(phase1.task.end.getTime()).toBe(TASKS[1].end.getTime());
  });
});

// ── dateToX ───────────────────────────────────────────────────────────────────

describe('dateToX', () => {
  const chartStart = d('2025-01-01');
  const chartEnd   = d('2025-12-31');
  const chartWidth = 1000;

  it('returns 0 for chartStart', () => {
    expect(dateToX(chartStart, chartStart, chartEnd, chartWidth)).toBe(0);
  });

  it('returns chartWidth for chartEnd', () => {
    expect(dateToX(chartEnd, chartStart, chartEnd, chartWidth)).toBe(chartWidth);
  });

  it('returns a proportional value for a midpoint date', () => {
    const mid = d('2025-07-02'); // roughly mid-year
    const x = dateToX(mid, chartStart, chartEnd, chartWidth);
    expect(x).toBeGreaterThan(400);
    expect(x).toBeLessThan(600);
  });

  it('returns a negative value for a date before chartStart', () => {
    expect(dateToX(d('2024-12-31'), chartStart, chartEnd, chartWidth)).toBeLessThan(0);
  });
});

// ── getChartEnd ───────────────────────────────────────────────────────────────

describe('getChartEnd', () => {
  it('returns a Date for empty columns', () => {
    expect(getChartEnd([], 'week')).toBeInstanceOf(Date);
  });

  it('advances by one day from the last column (day unit)', () => {
    // Jan 6 (Mon) → Jan 7: two columns; last = Jan 7; +1 day = Jan 8
    const cols = generateColumns(d('2025-01-06'), d('2025-01-08'), 'day');
    const end = getChartEnd(cols, 'day');
    expect(end.getDate()).toBe(8);
  });

  it('advances by one week from the last column (week unit)', () => {
    // Jan 5 (Sun) is the only column; last = Jan 5; +7 days = Jan 12
    const cols = generateColumns(d('2025-01-05'), d('2025-01-12'), 'week');
    const end = getChartEnd(cols, 'week');
    expect(end.getDate()).toBe(12);
  });

  it('advances by one month from the last column (month unit)', () => {
    // Columns: Jan, Feb; last = Feb 1; +1 month = Mar (month index 2)
    const cols = generateColumns(d('2025-01-01'), d('2025-03-01'), 'month');
    const end = getChartEnd(cols, 'month');
    expect(end.getMonth()).toBe(2); // March
  });
});
