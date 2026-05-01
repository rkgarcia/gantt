import { ExportOptions } from './types';

export function exportSVG(svgString: string, options: ExportOptions = {}): void {
  const { filename = 'gantt-chart' } = options;
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, `${filename}.svg`);
}

export async function exportPNG(svgString: string, options: ExportOptions = {}): Promise<void> {
  const { filename = 'gantt-chart', scale = 2, background = '#ffffff' } = options;
  const canvas = await rasterize(svgString, scale, background);
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Canvas toBlob returned null'));
      triggerDownload(blob, `${filename}.png`);
      resolve();
    }, 'image/png');
  });
}

export async function exportJPG(svgString: string, options: ExportOptions = {}): Promise<void> {
  const { filename = 'gantt-chart', scale = 2, quality = 0.92, background = '#ffffff' } = options;
  const canvas = await rasterize(svgString, scale, background);
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return reject(new Error('Canvas toBlob returned null'));
      triggerDownload(blob, `${filename}.jpg`);
      resolve();
    }, 'image/jpeg', quality);
  });
}

export async function toDataURL(svgString: string, format: 'png' | 'jpg' = 'png', options: ExportOptions = {}): Promise<string> {
  const { scale = 2, quality = 0.92, background = '#ffffff' } = options;
  const canvas = await rasterize(svgString, scale, background);
  return format === 'jpg'
    ? canvas.toDataURL('image/jpeg', quality)
    : canvas.toDataURL('image/png');
}

async function rasterize(svgString: string, scale: number, background: string): Promise<HTMLCanvasElement> {
  const wMatch = svgString.match(/\bwidth="(\d+(?:\.\d+)?)"/);
  const hMatch = svgString.match(/\bheight="(\d+(?:\.\d+)?)"/);
  const svgW = wMatch ? parseFloat(wMatch[1]) : 800;
  const svgH = hMatch ? parseFloat(hMatch[1]) : 400;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(svgW * scale);
      canvas.height = Math.round(svgH * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG to canvas'));
    };
    img.src = url;
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
