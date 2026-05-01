import { GanttOptions, GanttTheme, LayoutRow, TimeColumn } from './types';
import { resolveTheme } from './themes';
import {
  parseDates, getDateRange, generateColumns, generateHeaderSpans,
  buildRows, dateToX, getChartEnd,
} from './layout';

const DEFAULT_ELEMENTS = {
  showGrid: true,
  showLegend: true,
  showDependencies: true,
  showProgress: true,
  showMilestones: true,
  showGroupHeaders: true,
  showToday: true,
  showWeekends: true,
  showTaskLabels: true,
};

const COL_WIDTHS: Record<string, number> = { day: 32, week: 72, month: 96, quarter: 120 };

export function renderSVG(options: GanttOptions): string {
  const tasks = options.tasks.map(parseDates);

  if (!tasks.length) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="80"><rect width="400" height="80" fill="#f8f9fa"/><text x="200" y="44" text-anchor="middle" font-size="14" fill="#64748b" font-family="system-ui,sans-serif">No tasks to display</text></svg>`;
  }

  const theme = resolveTheme(options.theme);
  const el = { ...DEFAULT_ELEMENTS, ...options.elements };
  const timeUnit = options.timeUnit ?? 'week';
  const rowH = options.rowHeight ?? 40;
  const labelW = options.labelWidth ?? 190;
  const pad = options.padding ?? 16;
  const colW = options.columnWidth ?? COL_WIDTHS[timeUnit] ?? 72;

  const { start: rangeStart, end: rangeEnd } = getDateRange(tasks, options.startDate, options.endDate, timeUnit);
  const columns = generateColumns(rangeStart, rangeEnd, timeUnit);
  const spans = generateHeaderSpans(columns, timeUnit);
  const chartEnd = getChartEnd(columns, timeUnit);
  const chartStart = columns[0]?.date ?? rangeStart;
  const rows = buildRows(tasks, theme.palette);

  const chartW = columns.length * colW;
  const H1 = 28; // parent header row height
  const H2 = 26; // column header row height
  const headH = H1 + H2;
  const titleH = options.title ? 48 : 0;
  const bodyH = rows.length * rowH;
  const legendH = el.showLegend ? 38 : 0;

  const totalW = pad * 2 + labelW + chartW;
  const totalH = pad * 2 + titleH + headH + bodyH + legendH;

  const cX = pad + labelW;  // chart origin x (left edge of bar area)
  const cY = pad + titleH + headH; // chart origin y (top edge of bar area)
  const headY = pad + titleH; // header top y

  // Pre-compute bar positions (absolute SVG coords)
  const barPad = 6;
  type Pos = { x: number; y: number; w: number; h: number };
  const pos = new Map<string, Pos>();
  for (const lr of rows) {
    const t = lr.task;
    const rx = cX + dateToX(t.start, chartStart, chartEnd, chartW);
    const rw = dateToX(t.end, chartStart, chartEnd, chartW) - dateToX(t.start, chartStart, chartEnd, chartW);
    pos.set(t.id, { x: rx, y: cY + lr.row * rowH, w: rw, h: rowH });
  }

  const taskMap = new Map(tasks.map(t => [t.id, t]));

  let o = '';

  o += svg_open(totalW, totalH, theme);
  o += defs(theme, cX, cY, chartW, bodyH, labelW, pad);
  o += bg(totalW, totalH, theme);

  if (options.title) {
    o += title(options.title, totalW, pad, theme);
  }

  o += header(spans, columns, theme, headY, H1, H2, headH, cX, labelW, colW, pad);
  o += body_bg(pad, cY, labelW, chartW, bodyH, theme);
  o += label_divider(cX, cY, bodyH, theme);

  // Chart layer (clipped)
  o += `<g clip-path="url(#cc)">`;

  if (el.showWeekends) {
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].isWeekend) {
        const wx = cX + i * colW;
        o += `<rect x="${wx}" y="${cY}" width="${colW}" height="${bodyH}" fill="${theme.weekend}"/>`;
      }
    }
  }

  // Alternating row backgrounds
  for (const lr of rows) {
    if (lr.row % 2 === 1) {
      const ry = cY + lr.row * rowH;
      o += `<rect x="${cX}" y="${ry}" width="${chartW}" height="${rowH}" fill="${theme.surfaceAlt}" opacity="0.5"/>`;
    }
  }

  if (el.showGrid) {
    // Vertical column lines
    for (let i = 1; i < columns.length; i++) {
      const lx = cX + i * colW;
      const strong = columns[i].isMonthStart;
      o += `<line x1="${lx}" y1="${cY}" x2="${lx}" y2="${cY + bodyH}" stroke="${theme.grid}" stroke-width="${strong ? 1 : 0.5}" opacity="${strong ? 0.8 : 0.5}"/>`;
    }
    // Horizontal row lines
    for (let r = 0; r <= rows.length; r++) {
      const ly = cY + r * rowH;
      o += `<line x1="${cX}" y1="${ly}" x2="${cX + chartW}" y2="${ly}" stroke="${theme.grid}" stroke-width="0.5" opacity="0.4"/>`;
    }
  }

  if (el.showToday) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today >= chartStart && today <= chartEnd) {
      const tx = cX + dateToX(today, chartStart, chartEnd, chartW);
      o += `<line x1="${tx}" y1="${cY}" x2="${tx}" y2="${cY + bodyH}" stroke="${theme.today}" stroke-width="2" stroke-dasharray="4,3" opacity="0.9"/>`;
      o += `<polygon points="${tx - 5},${cY} ${tx + 5},${cY} ${tx},${cY + 8}" fill="${theme.today}" opacity="0.9"/>`;
    }
  }

  // Dependencies (drawn under bars)
  if (el.showDependencies) {
    for (const lr of rows) {
      if (lr.isGroup) continue;
      const task = taskMap.get(lr.task.id);
      if (!task?.dependencies?.length) continue;
      const tgt = pos.get(lr.task.id);
      if (!tgt) continue;

      for (const depId of task.dependencies) {
        const src = pos.get(depId);
        if (!src) continue;

        const sx = src.x + src.w;
        const sy = src.y + src.h / 2;
        const tx2 = tgt.x;
        const ty = tgt.y + tgt.h / 2;
        const elbX = Math.max(sx + 10, tx2 - 10);
        o += `<path d="M${sx},${sy} L${elbX},${sy} L${elbX},${ty} L${tx2},${ty}" fill="none" stroke="${theme.dependency}" stroke-width="1.5" marker-end="url(#arr)" opacity="0.75"/>`;
      }
    }
  }

  // Bars and milestones
  o += renderBars(rows, pos, theme, el, barPad, colW);

  o += `</g>`; // end chart clip

  // Labels (left column, clipped)
  o += `<g clip-path="url(#lc)">`;
  for (const lr of rows) {
    const ly = cY + lr.row * rowH;
    const textY = ly + rowH / 2 + Math.round(theme.fontSize * 0.38);
    if (lr.isGroup && el.showGroupHeaders) {
      o += `<rect x="${pad}" y="${ly}" width="${labelW}" height="${rowH}" fill="${theme.group.background}" opacity="0.7"/>`;
      o += `<text x="${pad + 10}" y="${textY}" fill="${theme.group.text}" font-size="${theme.fontSize}" font-weight="700" dominant-baseline="auto">${xml(lr.task.name)}</text>`;
    } else {
      const indent = lr.task.group ? 22 : 10;
      if (lr.row % 2 === 1) {
        o += `<rect x="${pad}" y="${ly}" width="${labelW}" height="${rowH}" fill="${theme.surfaceAlt}" opacity="0.5"/>`;
      }
      o += `<text x="${pad + indent}" y="${textY}" fill="${theme.text}" font-size="${theme.fontSize}" dominant-baseline="auto">${xml(lr.task.name)}</text>`;
    }
  }
  o += `</g>`;

  // Row dividers (full width, over labels and chart)
  for (let r = 0; r <= rows.length; r++) {
    const dy = cY + r * rowH;
    o += `<line x1="${pad}" y1="${dy}" x2="${pad + labelW + chartW}" y2="${dy}" stroke="${theme.border}" stroke-width="0.5" opacity="0.6"/>`;
  }

  // Outer border
  o += `<rect x="${pad}" y="${headY}" width="${labelW + chartW}" height="${headH + bodyH}" rx="8" fill="none" stroke="${theme.border}" stroke-width="1.5"/>`;

  // Legend
  if (el.showLegend) {
    o += legend(theme, pad, cY + bodyH + 6, legendH);
  }

  o += `</svg>`;
  return o;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function svg_open(w: number, h: number, theme: GanttTheme): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${theme.fontFamily}" font-size="${theme.fontSize}">`;
}

function defs(theme: GanttTheme, cX: number, cY: number, chartW: number, bodyH: number, labelW: number, pad: number): string {
  return [
    `<defs>`,
    `<marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">`,
    `<path d="M0,0 L0,7 L7,3.5 Z" fill="${theme.dependency}"/>`,
    `</marker>`,
    `<clipPath id="cc"><rect x="${cX}" y="${cY}" width="${chartW}" height="${bodyH}"/></clipPath>`,
    `<clipPath id="lc"><rect x="${pad}" y="${cY}" width="${labelW - 2}" height="${bodyH}"/></clipPath>`,
    `<clipPath id="hc"><rect x="${cX}" y="${cY - 999}" width="${chartW}" height="999"/></clipPath>`,
    `</defs>`,
  ].join('');
}

function bg(w: number, h: number, theme: GanttTheme): string {
  return `<rect width="${w}" height="${h}" fill="${theme.background}"/>`;
}

function title(text: string, totalW: number, pad: number, theme: GanttTheme): string {
  return `<text x="${totalW / 2}" y="${pad + 30}" text-anchor="middle" font-size="20" font-weight="700" fill="${theme.text}">${xml(text)}</text>`;
}

function header(
  spans: ReturnType<typeof generateHeaderSpans>,
  columns: TimeColumn[],
  theme: GanttTheme,
  headY: number,
  H1: number,
  H2: number,
  headH: number,
  cX: number,
  labelW: number,
  colW: number,
  pad: number,
): string {
  let o = '';
  const totalHeaderW = labelW + (columns.length * colW);

  // Background
  o += `<rect x="${pad}" y="${headY}" width="${totalHeaderW}" height="${headH}" fill="${theme.header.background}" rx="8"/>`;
  // Clip the bottom-left/right rounded corners by overlaying a rect on lower half
  o += `<rect x="${pad}" y="${headY + H1}" width="${totalHeaderW}" height="${H2}" fill="${theme.header.background}"/>`;

  // "Tasks" label in label column
  o += `<text x="${pad + 12}" y="${headY + H1 / 2 + 5}" fill="${theme.header.text}" font-size="13" font-weight="700">Tasks</text>`;

  // Divider between label col and chart col in header
  o += `<line x1="${cX}" y1="${headY}" x2="${cX}" y2="${headY + headH}" stroke="${theme.header.border}" stroke-width="1"/>`;
  // Divider between H1 and H2
  o += `<line x1="${pad}" y1="${headY + H1}" x2="${pad + totalHeaderW}" y2="${headY + H1}" stroke="${theme.header.border}" stroke-width="1"/>`;

  // Span labels (top row)
  o += `<g clip-path="url(#hc)">`;
  for (const span of spans) {
    const sx = cX + span.startCol * colW;
    const sw = (span.endCol - span.startCol) * colW;
    if (span.startCol > 0) {
      o += `<line x1="${sx}" y1="${headY}" x2="${sx}" y2="${headY + H1}" stroke="${theme.header.border}" stroke-width="1" opacity="0.5"/>`;
    }
    o += `<text x="${sx + sw / 2}" y="${headY + H1 / 2 + 5}" text-anchor="middle" fill="${theme.header.text}" font-size="12" font-weight="600">${xml(span.label)}</text>`;
  }

  // Column labels (bottom row)
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const cx = cX + i * colW + colW / 2;
    const row2Y = headY + H1;
    if (i > 0) {
      o += `<line x1="${cX + i * colW}" y1="${row2Y}" x2="${cX + i * colW}" y2="${row2Y + H2}" stroke="${theme.header.border}" stroke-width="0.5" opacity="0.4"/>`;
    }
    o += `<text x="${cx}" y="${row2Y + 11}" text-anchor="middle" fill="${theme.header.text}" font-size="11">${xml(col.label)}</text>`;
    o += `<text x="${cx}" y="${row2Y + 21}" text-anchor="middle" fill="${theme.header.text}" font-size="9" opacity="0.6">${xml(col.subLabel)}</text>`;
  }
  o += `</g>`;

  return o;
}

function body_bg(pad: number, cY: number, labelW: number, chartW: number, bodyH: number, theme: GanttTheme): string {
  return `<rect x="${pad}" y="${cY}" width="${labelW + chartW}" height="${bodyH}" fill="${theme.surface}"/>`;
}

function label_divider(cX: number, cY: number, bodyH: number, theme: GanttTheme): string {
  return `<line x1="${cX}" y1="${cY}" x2="${cX}" y2="${cY + bodyH}" stroke="${theme.border}" stroke-width="1"/>`;
}

function renderBars(
  rows: LayoutRow[],
  pos: Map<string, { x: number; y: number; w: number; h: number }>,
  theme: GanttTheme,
  el: typeof DEFAULT_ELEMENTS,
  barPad: number,
  colW: number,
): string {
  let o = '';
  for (const lr of rows) {
    const p = pos.get(lr.task.id);
    if (!p) continue;

    const { x, y, w, h } = p;
    const bY = y + barPad;
    const bH = h - barPad * 2;
    const bW = Math.max(w, 3);
    const r = theme.taskBorderRadius;
    const task = lr.task;

    if (lr.isGroup && el.showGroupHeaders) {
      // Group bar: translucent fill + bracket lines
      o += `<rect x="${x}" y="${bY}" width="${bW}" height="${bH}" rx="${r}" fill="${lr.color}" opacity="0.2" stroke="${lr.color}" stroke-width="1" stroke-opacity="0.4"/>`;
      o += `<line x1="${x}" y1="${bY}" x2="${x}" y2="${bY + bH}" stroke="${lr.color}" stroke-width="3" stroke-linecap="round"/>`;
      o += `<line x1="${x + bW}" y1="${bY}" x2="${x + bW}" y2="${bY + bH}" stroke="${lr.color}" stroke-width="3" stroke-linecap="round"/>`;
      continue;
    }

    if (task.milestone && el.showMilestones) {
      // Diamond milestone
      const mx = x + w / 2;
      const my = y + h / 2;
      const ms = Math.min(bH * 0.48, 11);
      o += `<polygon points="${mx},${my - ms} ${mx + ms},${my} ${mx},${my + ms} ${mx - ms},${my}" fill="${theme.milestone}" stroke="${theme.milestoneStroke}" stroke-width="1"/>`;
      if (task.name && colW > 50) {
        o += `<text x="${mx + ms + 4}" y="${my + 4}" fill="${theme.milestoneStroke}" font-size="${theme.fontSize - 1}" font-weight="600">${xml(task.name)}</text>`;
      }
      continue;
    }

    // Normal task bar
    o += `<rect x="${x}" y="${bY}" width="${bW}" height="${bH}" rx="${r}" fill="${lr.color}" opacity="0.85" stroke="${theme.taskBorder}" stroke-width="0.5"/>`;

    // Progress overlay
    if (el.showProgress && task.progress != null && task.progress > 0) {
      const progW = bW * Math.min(task.progress, 100) / 100;
      o += `<rect x="${x}" y="${bY}" width="${progW}" height="${bH}" rx="${r}" fill="${theme.taskProgress}" opacity="0.6"/>`;
    }

    // Task label inside bar
    if (el.showTaskLabels && bW > 36) {
      const textX = x + 6;
      const textW = bW - 12;
      const label = clampText(task.name, textW, theme.fontSize - 1);
      o += `<text x="${textX}" y="${bY + bH / 2 + Math.round((theme.fontSize - 1) * 0.38)}" fill="${theme.taskText}" font-size="${theme.fontSize - 1}" dominant-baseline="auto" opacity="0.95">${xml(label)}</text>`;
    }
  }
  return o;
}

function legend(theme: GanttTheme, pad: number, y: number, h: number): string {
  const items: Array<{ label: string; draw: () => string }> = [
    {
      label: 'Task',
      draw: () => `<rect x="0" y="3" width="16" height="10" rx="2" fill="${theme.palette[0]}" opacity="0.85"/>`,
    },
    {
      label: 'Milestone',
      draw: () => `<polygon points="8,0 16,8 8,16 0,8" fill="${theme.milestone}" stroke="${theme.milestoneStroke}" stroke-width="0.5"/>`,
    },
    {
      label: 'Progress',
      draw: () => `<rect x="0" y="3" width="16" height="10" rx="2" fill="${theme.palette[0]}" opacity="0.3"/><rect x="0" y="3" width="9" height="10" rx="2" fill="${theme.taskProgress}" opacity="0.6"/>`,
    },
    {
      label: 'Today',
      draw: () => `<line x1="8" y1="0" x2="8" y2="16" stroke="${theme.today}" stroke-width="2" stroke-dasharray="3,2"/><polygon points="3,0 13,0 8,6" fill="${theme.today}"/>`,
    },
    {
      label: 'Dependency',
      draw: () => `<line x1="0" y1="8" x2="12" y2="8" stroke="${theme.dependency}" stroke-width="1.5" marker-end="url(#arr)"/>`,
    },
  ];

  let o = `<text x="${pad + 4}" y="${y + h / 2 + 4}" fill="${theme.textSecondary}" font-size="10" font-weight="600">LEGEND:</text>`;
  let lx = pad + 68;

  for (const item of items) {
    o += `<g transform="translate(${lx},${y + h / 2 - 8})">${item.draw()}</g>`;
    o += `<text x="${lx + 20}" y="${y + h / 2 + 4}" fill="${theme.textSecondary}" font-size="10">${xml(item.label)}</text>`;
    lx += item.label.length * 7 + 32;
  }

  return o;
}

function xml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function clampText(text: string, maxPx: number, fontSize: number): string {
  const avg = fontSize * 0.58;
  const max = Math.floor(maxPx / avg);
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + '…';
}
