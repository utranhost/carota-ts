import { Run, Formatting, defaultFormatting } from './runs';

export function getFontString(run?: Formatting): string {
  let size = (run && run.size) || defaultFormatting.size;

  if (run) {
    switch (run.script) {
      case 'super':
      case 'sub':
        size *= 0.8;
        break;
    }
  }

  return (run && run.italic ? 'italic ' : '') +
    (run && run.bold ? 'bold ' : '') + ' ' +
    size + 'pt ' +
    ((run && run.font) || defaultFormatting.font);
}

export function applyRunStyle(ctx: CanvasRenderingContext2D, run?: Formatting): void {
  ctx.fillStyle = (run && run.color) || defaultFormatting.color;
  ctx.font = getFontString(run);
}

export function prepareContext(ctx: CanvasRenderingContext2D): void {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export function getRunStyle(run?: Formatting): string {
  const parts: string[] = [
    'font: ', getFontString(run),
    '; color: ', ((run && run.color) || defaultFormatting.color)
  ];

  if (run) {
    switch (run.script) {
      case 'super':
        parts.push('; vertical-align: super');
        break;
      case 'sub':
        parts.push('; vertical-align: sub');
        break;
    }
  }

  return parts.join('');
}

export const nbsp: string = String.fromCharCode(160);
export const enter: string = nbsp;

export interface TextMetrics {
  ascent: number;
  height: number;
  descent: number;
  width: number;
}

export function measureText(text: string, style: string): TextMetrics {
  let span: HTMLSpanElement, block: HTMLDivElement, div: HTMLDivElement;

  span = document.createElement('span');
  block = document.createElement('div');
  div = document.createElement('div');

  block.style.display = 'inline-block';
  block.style.width = '1px';
  block.style.height = '0';

  div.style.visibility = 'hidden';
  div.style.position = 'absolute';
  div.style.top = '0';
  div.style.left = '0';
  div.style.width = '500px';
  div.style.height = '200px';

  div.appendChild(span);
  div.appendChild(block);
  document.body.appendChild(div);
  try {
    span.setAttribute('style', style);

    span.innerHTML = '';
    span.appendChild(document.createTextNode(text.replace(/\s/g, nbsp)));

    const result = {} as TextMetrics;
    block.style.verticalAlign = 'baseline';
    result.ascent = (block.offsetTop - span.offsetTop);
    block.style.verticalAlign = 'bottom';
    result.height = (block.offsetTop - span.offsetTop);
    result.descent = result.height - result.ascent;
    result.width = span.offsetWidth;
    return result;
  } finally {
    div.parentNode!.removeChild(div);
  }
}

export function createCachedMeasureText(): (text: string, style: string) => TextMetrics {
  const cache: Record<string, TextMetrics> = {};
  return function (text: string, style: string): TextMetrics {
    const key = style + '<>!&%' + text;
    let result = cache[key];
    if (!result) {
      cache[key] = result = measureText(text, style);
    }
    return result;
  };
}

export const cachedMeasureText: (text: string, style: string) => TextMetrics = createCachedMeasureText();

export function measure(str: string, formatting: Formatting): TextMetrics {
  return cachedMeasureText(str, getRunStyle(formatting));
}

export function draw(
  ctx: CanvasRenderingContext2D,
  str: string,
  formatting: Formatting,
  left: number,
  baseline: number,
  width: number,
  ascent: number,
  descent: number
): void {
  prepareContext(ctx);
  applyRunStyle(ctx, formatting);
  switch (formatting.script) {
    case 'super':
      baseline -= (ascent * (1 / 3));
      break;
    case 'sub':
      baseline += (descent / 2);
      break;
  }
  ctx.fillText(str === '\n' ? enter : str, left, baseline);
  if (formatting.underline) {
    ctx.fillRect(left, 1 + baseline, width, 1);
  }
  if (formatting.strikeout) {
    ctx.fillRect(left, 1 + baseline - (ascent / 2), width, 1);
  }
}
