import { Task, TimeUnit, TimeColumn, HeaderSpan, LayoutRow } from './types';

export function parseDates(task: Task): Task {
  return {
    ...task,
    start: task.start instanceof Date ? task.start : new Date(task.start as unknown as string),
    end: task.end instanceof Date ? task.end : new Date(task.end as unknown as string),
  };
}

export function getDateRange(
  tasks: Task[],
  startDate?: Date,
  endDate?: Date,
  timeUnit: TimeUnit = 'week',
): { start: Date; end: Date } {
  const dates = tasks.flatMap(t => [t.start.getTime(), t.end.getTime()]);
  let start = startDate ? new Date(startDate) : new Date(Math.min(...dates));
  let end = endDate ? new Date(endDate) : new Date(Math.max(...dates));

  start = alignToUnitFloor(start, timeUnit);
  end = alignToUnitCeil(end, timeUnit);

  start = addUnits(start, timeUnit, -1);
  end = addUnits(end, timeUnit, 1);

  return { start, end };
}

function alignToUnitFloor(date: Date, unit: TimeUnit): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (unit === 'week') {
    d.setDate(d.getDate() - d.getDay()); // floor to Sunday
  } else if (unit === 'month') {
    d.setDate(1);
  } else if (unit === 'quarter') {
    d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
  }
  return d;
}

function alignToUnitCeil(date: Date, unit: TimeUnit): Date {
  const d = alignToUnitFloor(date, unit);
  if (
    unit === 'day' ? d.getTime() < date.getTime() :
    unit === 'week' ? d.getTime() < new Date(date).setHours(0,0,0,0) :
    unit === 'month' ? d.getMonth() < date.getMonth() || d.getFullYear() < date.getFullYear() :
    d.getTime() < date.getTime()
  ) {
    return addUnits(d, unit, 1);
  }
  return d;
}

export function addUnits(date: Date, unit: TimeUnit, count: number): Date {
  const d = new Date(date);
  if (unit === 'day') d.setDate(d.getDate() + count);
  else if (unit === 'week') d.setDate(d.getDate() + count * 7);
  else if (unit === 'month') d.setMonth(d.getMonth() + count);
  else d.setMonth(d.getMonth() + count * 3);
  return d;
}

export function generateColumns(start: Date, end: Date, timeUnit: TimeUnit): TimeColumn[] {
  const columns: TimeColumn[] = [];
  const current = new Date(start);

  while (current < end) {
    columns.push(buildColumn(new Date(current), timeUnit));
    advanceDate(current, timeUnit);
  }

  return columns;
}

function buildColumn(date: Date, timeUnit: TimeUnit): TimeColumn {
  const dow = date.getDay();
  switch (timeUnit) {
    case 'day':
      return {
        date,
        label: String(date.getDate()),
        subLabel: 'SMTWTFS'[dow],
        isWeekend: dow === 0 || dow === 6,
        isMonthStart: date.getDate() === 1,
      };
    case 'week':
      return {
        date,
        label: `W${isoWeekNumber(date)}`,
        subLabel: `${date.getDate()} ${shortMonth(date)}`,
        isWeekend: false,
        isMonthStart: date.getDate() <= 7,
      };
    case 'month':
      return {
        date,
        label: date.toLocaleString('default', { month: 'short' }),
        subLabel: String(date.getFullYear()).slice(2),
        isWeekend: false,
        isMonthStart: true,
      };
    case 'quarter': {
      const q = Math.floor(date.getMonth() / 3) + 1;
      return {
        date,
        label: `Q${q}`,
        subLabel: String(date.getFullYear()),
        isWeekend: false,
        isMonthStart: true,
      };
    }
  }
}

function advanceDate(date: Date, unit: TimeUnit): void {
  if (unit === 'day') date.setDate(date.getDate() + 1);
  else if (unit === 'week') date.setDate(date.getDate() + 7);
  else if (unit === 'month') date.setMonth(date.getMonth() + 1);
  else date.setMonth(date.getMonth() + 3);
}

export function getChartEnd(columns: TimeColumn[], timeUnit: TimeUnit): Date {
  if (!columns.length) return new Date();
  const d = new Date(columns[columns.length - 1].date);
  advanceDate(d, timeUnit);
  return d;
}

export function generateHeaderSpans(columns: TimeColumn[], timeUnit: TimeUnit): HeaderSpan[] {
  if (!columns.length) return [];
  const spans: HeaderSpan[] = [];
  let currentLabel = parentLabel(columns[0].date, timeUnit);
  let startCol = 0;

  for (let i = 1; i < columns.length; i++) {
    const label = parentLabel(columns[i].date, timeUnit);
    if (label !== currentLabel) {
      spans.push({ label: currentLabel, startCol, endCol: i });
      currentLabel = label;
      startCol = i;
    }
  }
  spans.push({ label: currentLabel, startCol, endCol: columns.length });
  return spans;
}

function parentLabel(date: Date, unit: TimeUnit): string {
  if (unit === 'month' || unit === 'quarter') return String(date.getFullYear());
  return date.toLocaleString('default', { month: 'long' }) + ' ' + date.getFullYear();
}

export function buildRows(tasks: Task[], palette: string[]): LayoutRow[] {
  const rows: LayoutRow[] = [];
  const groups = new Map<string, Task[]>();
  const ungrouped: Task[] = [];

  for (const task of tasks) {
    if (task.group) {
      if (!groups.has(task.group)) groups.set(task.group, []);
      groups.get(task.group)!.push(task);
    } else {
      ungrouped.push(task);
    }
  }

  let pi = 0;
  let row = 0;

  for (const [groupName, groupTasks] of groups) {
    const groupColor = palette[pi++ % palette.length];
    const groupTask: Task = {
      id: `__group__${groupName}`,
      name: groupName,
      start: new Date(Math.min(...groupTasks.map(t => t.start.getTime()))),
      end: new Date(Math.max(...groupTasks.map(t => t.end.getTime()))),
      group: groupName,
    };
    rows.push({ task: groupTask, row: row++, isGroup: true, color: groupColor });

    for (const task of groupTasks) {
      rows.push({ task, row: row++, isGroup: false, color: task.color ?? palette[pi++ % palette.length] });
    }
  }

  for (const task of ungrouped) {
    rows.push({ task, row: row++, isGroup: false, color: task.color ?? palette[pi++ % palette.length] });
  }

  return rows;
}

export function dateToX(date: Date, chartStart: Date, chartEnd: Date, chartWidth: number): number {
  const ratio = (date.getTime() - chartStart.getTime()) / (chartEnd.getTime() - chartStart.getTime());
  return Math.round(ratio * chartWidth);
}

function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function shortMonth(date: Date): string {
  return date.toLocaleString('default', { month: 'short' });
}
