import per from 'per';
import { Run, CharacterObject, getPiecePlainText } from './runs';
import rect, { Rect } from './rect';
import { deriveNode, NodeBase } from './node';
import positionedWord, { PositionedWord } from './positionedword';
import { Word } from './word';

export interface Line extends NodeBase {
  doc: NodeBase;
  left: number;
  width: number;
  baseline: number;
  ascent: number;
  descent: number;
  ordinal: number;
  align: string;
  positionedWords: PositionedWord[];
  actualWidth: number;
  length: number;
  bounds(minimal?: boolean): Rect;
  parent(): NodeBase;
  children(): PositionedWord[];
  draw(ctx: CanvasRenderingContext2D): void;
  first(): PositionedWord;
  last(): PositionedWord;
  type: string;
}

const prototype = deriveNode({
  bounds(this: Line, minimal?: boolean): Rect {
    if (minimal) {
      const firstWord = this.first().bounds();
      const lastWord = this.last().bounds();
      return rect(
        firstWord.l,
        this.baseline - this.ascent,
        (lastWord.l + lastWord.w) - firstWord.l,
        this.ascent + this.descent);
    }
    return rect(this.left, this.baseline - this.ascent,
      this.width, this.ascent + this.descent);
  },
  parent(this: Line): NodeBase {
    return this.doc;
  },
  children(this: Line): PositionedWord[] {
    return this.positionedWords;
  },
  type: 'line'
});

export default function (doc: NodeBase, left: number, width: number, baseline: number, ascent: number, descent: number, words: Word[], ordinal: number): Line {
  const align = words[0].align();

  const line = Object.create(prototype, {
    doc: { value: doc },
    left: { value: left },
    width: { value: width },
    baseline: { value: baseline },
    ascent: { value: ascent },
    descent: { value: descent },
    ordinal: { value: ordinal },
    align: { value: align }
  }) as Line;

  let actualWidth = 0;
  words.forEach(function (word: Word) {
    actualWidth += word.width;
  });
  actualWidth -= words[words.length - 1].space.width;

  let x = 0, spacing = 0;
  if (actualWidth < width) {
    switch (align) {
      case 'right':
        x = width - actualWidth;
        break;
      case 'center':
        x = (width - actualWidth) / 2;
        break;
      case 'justify':
        if (words.length > 1 && !words[words.length - 1].isNewLine()) {
          spacing = (width - actualWidth) / (words.length - 1);
        }
        break;
    }
  }

  Object.defineProperty(line, 'positionedWords', {
    value: words.map(function (word: Word) {
      const wordLeft = x;
      x += (word.width + spacing);
      const wordOrdinal = ordinal;
      ordinal += (word.text.length + word.space.length);
      return positionedWord(word, line, wordLeft, wordOrdinal, word.width + spacing);
    })
  });

  Object.defineProperty(line, 'actualWidth', { value: actualWidth });
  Object.defineProperty(line, 'length', { value: ordinal - line.ordinal });
  return line;
}
