import { NodeBase } from './node';
import wrap from './wrap';
import rect, { Rect } from './rect';
import { deriveNode } from './node';
import { Line } from './line';
import { Word, WordCode } from './word';

export interface Frame extends NodeBase {
  lines: (Line | NodeBase)[];
  _parent: NodeBase;
  _bounds?: Rect;
  _actualWidth?: number;
  height?: number;
  bounds(): Rect;
  actualWidth(): number;
  children(): NodeBase[];
  parent(): NodeBase;
  draw(ctx: CanvasRenderingContext2D, viewPort?: Rect): void;
  type: string;
}

const prototype = deriveNode({
  bounds(this: Frame): Rect {
    if (!this._bounds) {
      let left = 0, top = 0, right = 0, bottom = 0;
      if (this.lines.length) {
        const first = this.lines[0].bounds();
        left = first.l;
        top = first.t;
        this.lines.forEach(function (line: Line | NodeBase) {
          const b = line.bounds();
          right = Math.max(right, b.l + b.w);
          bottom = Math.max(bottom, b.t + b.h);
        });
      }
      this._bounds = rect(left, top, right - left, this.height || bottom - top);
    }
    return this._bounds;
  },
  actualWidth(this: Frame): number {
    if (!this._actualWidth) {
      let result = 0;
      this.lines.forEach(function (line: Line | NodeBase) {
        if (typeof (line as Line).actualWidth === 'number') {
          result = Math.max(result, (line as Line).actualWidth!);
        }
      });
      this._actualWidth = result;
    }
    return this._actualWidth;
  },
  children(this: Frame): NodeBase[] {
    return this.lines as NodeBase[];
  },
  parent(this: Frame): NodeBase {
    return this._parent;
  },
  draw(this: Frame, ctx: CanvasRenderingContext2D, viewPort?: Rect): void {
    const top = viewPort ? viewPort.t : 0;
    const bottom = viewPort ? (viewPort.t + viewPort.h) : Number.MAX_VALUE;
    this.lines.some(function (line: Line | NodeBase) {
      const b = line.bounds();
      if (b.t + b.h < top) {
        return false;
      }
      if (b.t > bottom) {
        return true;
      }
      line.draw(ctx, viewPort);
      return false;
    });
  },
  type: 'frame'
});

export default function (
  left: number, top: number, width: number, ordinal: number, parent: NodeBase,
  includeTerminator?: ((code: WordCode) => boolean), initialAscent?: number, initialDescent?: number
): (emit: (frame: Frame) => void, word: Word) => boolean | void {
  const lines: (Line | NodeBase)[] = [];
  const frame = Object.create(prototype, {
    lines: { value: lines },
    _parent: { value: parent },
    ordinal: { value: ordinal }
  }) as Frame;
  const wrapper = wrap(left, top, width, ordinal, frame, includeTerminator, initialAscent, initialDescent);
  let length = 0, height = 0;
  return function (emit: (frame: Frame) => void, word: Word): boolean | void {
    if (wrapper(function (lineOrNumber: Line | NodeBase | number) {
      if (typeof lineOrNumber === 'number') {
        height = lineOrNumber;
      } else {
        length = (lineOrNumber.ordinal + lineOrNumber.length) - ordinal;
        lines.push(lineOrNumber);
      }
    }, word)) {
      Object.defineProperty(frame, 'length', { value: length });
      Object.defineProperty(frame, 'height', { value: height });
      emit(frame);
      return true;
    }
  };
}
