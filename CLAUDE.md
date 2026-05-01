# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # compile src/ → dist/ (tsc)
npm test               # vitest unit tests (run once)
npm run test:watch     # vitest in watch mode
npm run test:coverage  # vitest with v8 coverage → tests/coverage/
npm run test:e2e       # playwright visual screenshot tests
npm run test:e2e:update  # regenerate snapshot baselines in tests/snapshots/
npm run test:all       # unit + e2e in sequence
```

To run a single unit test file:
```bash
npx vitest run tests/unit/layout.test.ts
```

E2E tests require Chromium. Install it once with:
```bash
npx playwright install chromium --with-deps
```

## Architecture

This is a **zero-dependency** TypeScript library. The rendering pipeline flows through four source files:

1. **`src/types.ts`** — all shared interfaces (`Task`, `GanttOptions`, `GanttTheme`, `GanttElements`, `LayoutRow`, `TimeColumn`, `HeaderSpan`, `ExportOptions`)

2. **`src/layout.ts`** — pure date/grid math:
   - `parseDates` normalizes task dates
   - `getDateRange` computes chart start/end with 1-unit padding on each side, aligned to the `timeUnit` boundary
   - `generateColumns` builds the `TimeColumn[]` array (one entry per grid column)
   - `generateHeaderSpans` groups columns into parent-row spans (e.g., month labels over week columns)
   - `buildRows` groups tasks by `task.group`, inserts synthetic group-header rows with `id: "__group__<name>"`, and assigns palette colors
   - `dateToX` converts a `Date` to an x-pixel offset within the chart area

3. **`src/themes.ts`** — `THEMES` map of the four built-ins; `resolveTheme(option)` merges a `Partial<GanttTheme>` on top of the `light` baseline

4. **`src/renderer.ts`** — `renderSVG(options)` assembles SVG by string concatenation (no DOM). Uses two `<clipPath>` regions: `#cc` for the bar/chart area and `#lc` for the label column. Dependency arrows are drawn under bars; bars are drawn via `renderBars()`. All user strings pass through the `xml()` helper to escape SVG entities.

5. **`src/exporter.ts`** — browser-only helpers (`exportSVG`, `exportPNG`, `exportJPG`, `toDataURL`) that use the Canvas API to rasterize the SVG string.

6. **`src/index.ts`** — re-exports everything; the `GanttChart` class wraps `renderSVG` and the exporter functions with a stateful `options` object and optional DOM mounting.

## Testing strategy

- **Unit tests** (`tests/unit/`, vitest, Node environment): cover layout math, theme resolution, and SVG structure assertions (regex / string checks on SVG output).
- **E2E tests** (`tests/e2e/`, Playwright, Chromium): render SVG into a browser page and compare against PNG snapshots stored in `tests/snapshots/`. Screenshot outputs land in `tests/screenshots/`. Update baselines with `test:e2e:update` after intentional visual changes.

## Key constraints

- No runtime dependencies — do not introduce any. The `devDependencies` are fine.
- The library targets both Node.js (`renderSVG`) and browsers (`GanttChart`, exporters). Keep those paths separate: exporters must never be called in a Node context.
- Task labels inside bars are clipped by the `clampText` helper using a character-width heuristic (`fontSize * 0.58`), not DOM measurement.
