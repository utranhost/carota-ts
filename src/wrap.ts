import line from './line';
import { Line } from './line';
import { NodeBase } from './node';
import { Word, WordCode } from './word';
import { Run } from './runs';

type LineOrNumber = Line | NodeBase | number;

export default function (
  left: number, top: number, width: number, ordinal: number, parent: NodeBase,
  includeTerminator?: ((code: WordCode) => boolean), initialAscent?: number, initialDescent?: number
): (emit: (lineOrNumber: LineOrNumber) => boolean | void, word: Word) => boolean | void {

  let lineBuffer: Word[] = [];
  let lineWidth = 0;
  let maxAscent = initialAscent || 0;
  let maxDescent = initialDescent || 0;
  let quit: boolean | undefined;
  let lastNewLineHeight = 0;
  let y = top;

  const store = function (word: Word, emit: (lineOrNumber: LineOrNumber) => boolean | void): void {
    lineBuffer.push(word);
    lineWidth += word.width;
    maxAscent = Math.max(maxAscent, word.ascent);
    maxDescent = Math.max(maxDescent, word.descent);
    if (word.isNewLine()) {
      send(emit);
      lastNewLineHeight = word.ascent + word.descent;
    }
  };

  const send = function (emit: (lineOrNumber: LineOrNumber) => boolean | void): void {
    if (quit || lineBuffer.length === 0) {
      return;
    }
    const l = line(parent, left, width, y + maxAscent, maxAscent, maxDescent, lineBuffer, ordinal);
    ordinal += l.length;
    quit = !!emit(l);
    y += (maxAscent + maxDescent);
    lineBuffer.length = 0;
    lineWidth = maxAscent = maxDescent = 0;
  };

  let consumer: ((inputWord: Word) => NodeBase | undefined) | null = null;

  return function (emit: (lineOrNumber: LineOrNumber) => boolean | void, inputWord: Word): boolean | void {
    if (consumer) {
      lastNewLineHeight = 0;
      const node = consumer(inputWord);
      if (node) {
        consumer = null;
        ordinal += node.length;
        y += node.bounds().h;
        Object.defineProperty(node, 'block', { value: true });
        emit(node);
      }
    } else {
      const code = inputWord.code();
      if (code && code.block) {
        if (lineBuffer.length) {
          send(emit);
        } else {
          y += lastNewLineHeight;
        }
        consumer = code.block(left, y, width, ordinal, parent, inputWord.codeFormatting() as Run);
        lastNewLineHeight = 0;
      }
      else if ((code && code.eof) || inputWord.eof) {
        if (!code || (includeTerminator && includeTerminator(code))) {
          store(inputWord, emit);
        }
        if (!lineBuffer.length) {
          emit(y + lastNewLineHeight - top);
        } else {
          send(emit);
          emit(y - top);
        }
        quit = true;
      } else {
        lastNewLineHeight = 0;
        if (!lineBuffer.length) {
          store(inputWord, emit);
        } else {
          if (lineWidth + inputWord.text.width > width) {
            send(emit);
          }
          store(inputWord, emit);
        }
      }
    }
    return !!quit;
  };
}
