import rect, { Rect } from './rect';
import per from 'per';
import { Run, CharacterObject, pieceCharacters } from './runs';
import { measure } from './text';
import { deriveNode, NodeBase } from './node';
import part, { Part } from './part';
import { Word } from './word';
import type { Line } from './line';
import type { Doc } from './doc';

export interface PositionedChar extends NodeBase {
  left: number;
  part: Part;
  word: PositionedWord;
  ordinal: number;
  length: number;
  width?: number;
  newLine?: boolean;
  bounds(): Rect;
  parent(): PositionedWord;
  byOrdinal(): PositionedChar;
  byCoordinate(x: number, y: number): NodeBase;
  type: string;
}

export interface PositionedWord extends NodeBase {
  word: Word;
  line: Line;
  left: number;
  width: number;
  ordinal: number;
  length: number;
  _characters?: PositionedChar[];
  draw(ctx: CanvasRenderingContext2D): void;
  bounds(): Rect;
  parts(eachPart: (part: Part) => boolean | void): void;
  realiseCharacters(): void;
  children(): PositionedChar[];
  parent(): Line;
  type: string;
}

const newLineWidth = function (run: Run): number {
  return measure('\n', run).width;
};

const positionedChar = deriveNode({
  bounds(this: PositionedChar): Rect {
    const wb = this.word.bounds();
    const width = this.word.word.isNewLine()
      ? newLineWidth(this.word.word.text.parts[0].run)
      : this.width || this.part.width;
    return rect(wb.l + this.left, wb.t, width, wb.h);
  },
  parent(this: PositionedChar): PositionedWord {
    return this.word;
  },
  byOrdinal(this: PositionedChar): PositionedChar {
    return this;
  },
  byCoordinate(this: PositionedChar, x: number, y: number): NodeBase {
    if (x <= this.bounds().center().x) {
      return this;
    }
    return this.next()!;
  },
  type: 'character'
});

const prototype = deriveNode({
  draw(this: PositionedWord, ctx: CanvasRenderingContext2D): void {
    this.word.draw(ctx, this.line.left + this.left, this.line.baseline);
  },
  bounds(this: PositionedWord): Rect {
    return rect(
      this.line.left + this.left,
      this.line.baseline - this.line.ascent,
      this.word.isNewLine() ? newLineWidth(this.word.text.parts[0].run) : this.width,
      this.line.ascent + this.line.descent);
  },
  parts(this: PositionedWord, eachPart: (part: Part) => boolean | void): void {
    this.word.text.parts.some(eachPart) ||
      this.word.space.parts.some(eachPart);
  },
  realiseCharacters(this: PositionedWord): void {
    if (!this._characters) {
      const cache: PositionedChar[] = [];
      let x = 0;
      const self = this;
      let ordinal = this.ordinal;
      const codes = (this.parentOfType('document')! as Doc).codes;
      this.parts(function (wordPart: Part) {
        pieceCharacters(function (char: string | CharacterObject) {
          const charRun = Object.create(wordPart.run) as Run;
          charRun.text = char;
          const p = part(charRun, codes);
          cache.push(Object.create(positionedChar, {
            left: { value: x },
            part: { value: p },
            word: { value: self },
            ordinal: { value: ordinal },
            length: { value: 1 }
          }) as PositionedChar);
          x += p.width;
          ordinal++;
        }, wordPart.run.text as string | CharacterObject);
      });
      const lastChar = cache[cache.length - 1];
      const wordCode = this.word.code();
      if (lastChar) {
        Object.defineProperty(lastChar, 'width',
          { value: this.width - lastChar.left });
        if (this.word.isNewLine() || (wordCode && wordCode.eof)) {
          Object.defineProperty(lastChar, 'newLine', { value: true });
        }
      }
      this._characters = cache;
    }
  },
  children(this: PositionedWord): PositionedChar[] {
    this.realiseCharacters();
    return this._characters!;
  },
  parent(this: PositionedWord): Line {
    return this.line;
  },
  type: 'word'
});

export default function (word: Word, line: Line, left: number, ordinal: number, width: number): PositionedWord {
  const pword = Object.create(prototype, {
    word: { value: word },
    line: { value: line },
    left: { value: left },
    width: { value: width },
    ordinal: { value: ordinal },
    length: { value: word.text.length + word.space.length }
  }) as PositionedWord;
  return pword;
}
