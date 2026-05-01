import { GanttOptions, ExportOptions } from './types';
import { renderSVG } from './renderer';
import { exportSVG as _exportSVG, exportPNG as _exportPNG, exportJPG as _exportJPG, toDataURL } from './exporter';

export class GanttChart {
  private options: GanttOptions;
  private el: HTMLElement | null = null;

  constructor(options: GanttOptions) {
    this.options = options;
  }

  /** Returns the rendered SVG markup as a string. */
  render(): string {
    return renderSVG(this.options);
  }

  /** Mounts the chart into a DOM element, replacing its contents. */
  mount(element: HTMLElement): this {
    this.el = element;
    element.innerHTML = this.render();
    return this;
  }

  /** Merges new options and re-renders if mounted. */
  update(options: Partial<GanttOptions>): this {
    this.options = { ...this.options, ...options };
    if (this.el) this.el.innerHTML = this.render();
    return this;
  }

  /** Triggers an SVG file download in the browser. */
  exportSVG(opts?: ExportOptions): void {
    _exportSVG(this.render(), opts);
  }

  /** Triggers a PNG file download in the browser. */
  async exportPNG(opts?: ExportOptions): Promise<void> {
    await _exportPNG(this.render(), opts);
  }

  /** Triggers a JPEG file download in the browser. */
  async exportJPG(opts?: ExportOptions): Promise<void> {
    await _exportJPG(this.render(), opts);
  }

  /** Returns a base64 data URL (PNG or JPEG) for embedding or server use. */
  async toDataURL(format: 'png' | 'jpg' = 'png', opts?: ExportOptions): Promise<string> {
    return toDataURL(this.render(), format, opts);
  }
}

// Named function exports for tree-shaking / functional use
export { renderSVG } from './renderer';
export { exportSVG, exportPNG, exportJPG, toDataURL } from './exporter';
export { THEMES, resolveTheme } from './themes';

// Type exports
export type {
  Task,
  GanttOptions,
  GanttTheme,
  GanttElements,
  ExportOptions,
  TimeUnit,
  TimeColumn,
  HeaderSpan,
  LayoutRow,
} from './types';

export default GanttChart;
