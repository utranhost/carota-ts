import per from 'per';
import { Run, CharacterObject, getPieceLength, getPiecePlainText, pieceCharacters } from './runs';
import { measure, draw as textDraw } from './text';

export interface Inline {
  measure?(formatting: Run): { width: number; ascent: number; descent: number };
  draw?(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ascent: number, descent: number, formatting: Run): void;
}

const defaultInline: Inline = {
  measure(formatting: Run): { width: number; ascent: number; descent: number } {
    const m = measure('?', formatting);
    return {
      width: m.width + 4,
      ascent: m.width + 2,
      descent: m.width + 2
    };
  },
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ascent: number, descent: number, _formatting: Run): void {
    ctx.fillStyle = 'silver';
    ctx.fillRect(x, y - ascent, width, ascent + descent);
    ctx.strokeRect(x, y - ascent, width, ascent + descent);
    ctx.fillStyle = 'black';
    ctx.fillText('?', x + 2, y);
  }
};

export interface Part {
  run: Run;
  isNewLine: boolean;
  width: number;
  ascent: number;
  descent: number;
  code?: { draw?: Inline['draw']; measure?: Inline['measure']; block?: boolean; eof?: boolean };
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}

const prototype = {
  draw(this: Part, ctx: CanvasRenderingContext2D, x: number, y: number): void {
    if (typeof this.run.text === 'string') {
      textDraw(ctx, this.run.text, this.run, x, y, this.width, this.ascent, this.descent);
    } else if (this.code && this.code.draw) {
      ctx.save();
      this.code.draw(ctx, x, y, this.width, this.ascent, this.descent, this.run);
      ctx.restore();
    }
  }
};

export default function (run: Run, codes: (char: CharacterObject) => Inline | undefined): Part {
  let m: { width: number; ascent: number; descent: number };
  let isNewLine: boolean | undefined;
  let code: { draw?: Inline['draw']; measure?: Inline['measure']; block?: boolean; eof?: boolean } | undefined;

  if (typeof run.text === 'string') {
    isNewLine = (run.text.length === 1) && (run.text[0] === '\n');
    m = measure(isNewLine ? '\u00a0' : run.text, run);
  } else {
    const inline = codes(run.text as CharacterObject);
    code = inline || defaultInline;
    m = code.measure ? code.measure(run) : {
      width: 0, ascent: 0, descent: 0
    };
  }

  const part = Object.create(prototype, {
    run: { value: run },
    isNewLine: { value: isNewLine },
    width: { value: isNewLine ? 0 : m.width },
    ascent: { value: m.ascent },
    descent: { value: m.descent }
  }) as Part;

  if (code) {
    Object.defineProperty(part, 'code', { value: code });
  }
  return part;
}
