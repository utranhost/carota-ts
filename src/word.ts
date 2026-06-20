import per from 'per';
import part, { Part, Inline } from './part';
import { Run, CharacterObject, getPieceLength, getPiecePlainText, pieceCharacters } from './runs';
import { measure } from './text';
import { NodeBase } from './node';
import { Character } from './characters';

export interface Section {
  parts: Part[];
  ascent: number;
  descent: number;
  width: number;
  length: number;
  plainText: string;
}

export interface WordCode {
  block?: (left: number, top: number, width: number, ordinal: number, parent: NodeBase, formatting: Run) => (inputWord: Word) => NodeBase | undefined;
  eof?: boolean;
  draw?: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ascent: number, descent: number, formatting: Run) => void;
  measure?: (formatting: Run) => { width: number; ascent: number; descent: number };
  $?: string;
  marker?: CharacterObject;
}

export interface Word {
  text: Section;
  space: Section;
  ascent: number;
  descent: number;
  width: number;
  length: number;
  eof?: boolean;
  isNewLine(): boolean;
  code(): WordCode | false;
  codeFormatting(): Run | false;
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
  plainText(): string;
  align(): string;
  runs(emit: (run: Run) => void, range?: { start?: number; end?: number }): void;
}

const prototype = {
  isNewLine(this: Word): boolean {
    return this.text.parts.length == 1 && this.text.parts[0].isNewLine;
  },
  code(this: Word): WordCode | false {
    if (this.text.parts.length !== 1) return false;
    return this.text.parts[0].code as WordCode | false;
  },
  codeFormatting(this: Word): Run | false {
    if (this.text.parts.length !== 1) return false;
    return this.text.parts[0].run;
  },
  draw(this: Word, ctx: CanvasRenderingContext2D, x: number, y: number): void {
    per(this.text.parts).concat(this.space.parts).forEach(function (p: Part) {
      p.draw(ctx, x, y);
      x += p.width;
    });
  },
  plainText(this: Word): string {
    return this.text.plainText + this.space.plainText;
  },
  align(this: Word): string {
    const first = this.text.parts[0];
    return first ? first.run.align || 'left' : 'left';
  },
  runs(this: Word, emit: (run: Run) => void, range?: { start?: number; end?: number }): void {
    let start = range?.start ?? 0;
    let end: number = range?.end ?? Number.MAX_VALUE;
    [this.text, this.space].forEach(function (section: Section) {
      section.parts.some(function (p: Part) {
        if (start >= end || end <= 0) {
          return true;
        }
        const run = p.run;
        const text = run.text;
        if (typeof text === 'string') {
          if (start <= 0 && end >= text.length) {
            emit(run);
          } else if (start < text.length) {
            const pieceRun = Object.create(run) as Run;
            const firstChar = Math.max(0, start);
            pieceRun.text = text.substr(
              firstChar,
              Math.min(text.length, end - firstChar)
            );
            emit(pieceRun);
          }
          start -= text.length;
          end -= text.length;
        } else {
          if (start <= 0 && end >= 1) {
            emit(run);
          }
          start--;
          end--;
        }
      });
    });
  }
};

function section(runEmitter: (emit: (run: Run) => void) => void, codes: (char: CharacterObject) => Inline | undefined): Section {
  const s: Section = {
    parts: per(runEmitter).map(function (p: Run) {
      return part(p, codes);
    }).all() as Part[],
    ascent: 0,
    descent: 0,
    width: 0,
    length: 0,
    plainText: ''
  };
  s.parts.forEach(function (p) {
    s.ascent = Math.max(s.ascent, p.ascent);
    s.descent = Math.max(s.descent, p.descent);
    s.width += p.width;
    s.length += getPieceLength(p.run.text as string | CharacterObject);
    s.plainText += getPiecePlainText(p.run.text as string | CharacterObject);
  });
  return s;
}

export default function (coords: { text: Character; spaces: Character; end: Character } | null, codes: (char: CharacterObject) => Inline | undefined): Word {
  let textSection: (emit: (run: Run) => void) => void;
  let spaceSection: (emit: (run: Run) => void) => void;
  if (!coords) {
    textSection = function (emit: (run: Run) => void) { emit({ text: '\n' }); };
    spaceSection = function (emit: (run: Run) => void) { };
  } else {
    textSection = coords.text.cut(coords.spaces);
    spaceSection = coords.spaces.cut(coords.end);
  }
  const text = section(textSection, codes);
  const space = section(spaceSection, codes);
  const word = Object.create(prototype, {
    text: { value: text },
    space: { value: space },
    ascent: { value: Math.max(text.ascent, space.ascent) },
    descent: { value: Math.max(text.descent, space.descent) },
    width: { value: text.width + space.width, configurable: true },
    length: { value: text.length + space.length }
  }) as Word;
  if (!coords) {
    Object.defineProperty(word, 'eof', { value: true });
  }
  return word;
}
