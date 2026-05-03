export interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  dependencies?: string[];
  color?: string;
  group?: string;
  milestone?: boolean;
  progress?: number; // 0–100
}

export type TimeUnit = 'day' | 'week' | 'month' | 'quarter';

export interface GanttElements {
  showGrid?: boolean;
  showLegend?: boolean;
  showDependencies?: boolean;
  showProgress?: boolean;
  showMilestones?: boolean;
  showGroupHeaders?: boolean;
  showToday?: boolean;
  showWeekends?: boolean;
  showTaskLabels?: boolean;
}

export interface GanttTheme {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  border: string;
  grid: string;
  weekend: string;
  today: string;
  header: {
    background: string;
    text: string;
    border: string;
  };
  taskText: string;
  taskBorder: string;
  taskProgress: string;
  milestone: string;
  milestoneStroke: string;
  dependency: string;
  group: {
    background: string;
    text: string;
  };
  palette: string[];
  fontFamily: string;
  fontSize: number;
  taskBorderRadius: number;
}

export interface GanttOptions {
  tasks: Task[];
  theme?: Partial<GanttTheme> | 'light' | 'dark' | 'ocean' | 'forest';
  elements?: GanttElements;
  language?: 'en' | 'es';
  startDate?: Date;
  endDate?: Date;
  timeUnit?: TimeUnit;
  rowHeight?: number;
  columnWidth?: number;
  labelWidth?: number;
  title?: string;
  padding?: number;
}

export interface ExportOptions {
  filename?: string;
  scale?: number;
  quality?: number; // 0–1, JPEG only
  background?: string;
}

export interface TimeColumn {
  label: string;
  subLabel: string;
  date: Date;
  isWeekend: boolean;
  isMonthStart: boolean;
}

export interface HeaderSpan {
  label: string;
  startCol: number;
  endCol: number;
}

export interface LayoutRow {
  task: Task;
  row: number;
  isGroup: boolean;
  color: string;
}
