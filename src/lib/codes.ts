import { Run, CharacterObject } from './runs';
import { NodeBase, deriveNode, genericNode } from './node';
import { derive } from './util';
import * as textModule from './text';
import rect, { Rect } from './rect';
import frame, { Frame } from './frame';
import { Word, WordCode } from './word';

interface Inline {
  measure(formatting: Run): { width: number; ascent: number; descent: number };
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ascent: number, descent: number, formatting: Run): void;
}

interface CodeImpl {
  eof?: boolean;
  block?: (left: number, top: number, width: number, ordinal: number, parent: NodeBase, formatting: Run) => ((inputWord: Word) => NodeBase | undefined);
  measure?: (formatting: Run) => { width: number; ascent: number; descent: number };
  draw?: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ascent: number, descent: number, formatting: Run) => void;
}

export type CodesFn = (obj: CharacterObject, number?: number, allCodes?: CodesFn) => CodeImpl | undefined;

const codes: Record<string, CodesFn> = {};

codes.number = function (obj: CharacterObject, number?: number): CodeImpl {
  const formattedNumber = (number! + 1) + '.';
  return {
    measure(formatting: Run) {
      return textModule.measure(formattedNumber, formatting);
    },
    draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ascent: number, descent: number, formatting: Run) {
      textModule.draw(ctx, formattedNumber, formatting, x, y, width, ascent, descent);
    }
  };
};

const listTerminator = function (obj: CharacterObject): CodeImpl {
  return derive(obj, {
    eof: true,
    measure() {
      return { width: 18, ascent: 0, descent: 0 };
    },
    draw() {
    }
  });
};

codes.listNext = codes.listEnd = listTerminator;

interface InlineMarkerNode extends NodeBase {
  inline: Inline;
  measured: { width: number; ascent: number; descent: number };
  left: number;
  baseline: number;
  _bounds?: Rect;
  position(left: number, baseline: number, bounds?: Rect): void;
  block?: boolean;
  formatting: Run;
}

type FrameConsumer = ((emit: (frame: Frame) => void, word: Word) => boolean | void) | null;

codes.listStart = function (obj: CharacterObject, data: number | undefined, allCodes?: CodesFn): CodeImpl {
  return derive(obj, {
    block(left: number, top: number, width: number, ordinal: number, parent: NodeBase, formatting: Run) {
      const list = genericNode('list', parent, left, top);
      let itemNode: NodeBase;
      let itemFrame: FrameConsumer;
      let itemMarker: InlineMarkerNode | null;

      const indent = 50, spacing = 10;

      const startItem = function (code: Exclude<WordCode, false>, formatting: Run) {
        itemNode = genericNode('item', list);
        const marker = allCodes!(code.marker || { $: 'number' }, list.children().length);
        itemMarker = inlineNode(marker as Inline, itemNode, ordinal, 1, formatting);
        itemMarker.block = true;
        itemFrame = frame(
          left + indent, top, width - indent, ordinal + 1, itemNode,
          function (terminatorCode: WordCode) {
            return !terminatorCode && false || (terminatorCode as Exclude<WordCode, false>).$ === 'listEnd';
          },
          itemMarker.measured.ascent
        );
      };

      startItem(obj as Exclude<WordCode, false>, formatting);

      return function (inputWord: Word): NodeBase | undefined {
        if (itemFrame) {
          itemFrame(function (finishedFrame: Frame) {
            ordinal = finishedFrame.ordinal + finishedFrame.length;
            const frameBounds = finishedFrame.bounds();

            const firstLine = finishedFrame.first();
            const markerLeft = left + indent - spacing - itemMarker!.measured.width;
            const markerBounds = rect(left, top, indent, frameBounds.h);
            if (firstLine && 'baseline' in firstLine) {
              itemMarker!.position(markerLeft, (firstLine as { baseline: number }).baseline, markerBounds);
            } else {
              itemMarker!.position(markerLeft, top + itemMarker!.measured.ascent, markerBounds);
            }

            top = frameBounds.t + frameBounds.h;

            itemNode.children().push(itemMarker!);
            itemNode.children().push(finishedFrame as NodeBase);
            itemNode.finalize!();

            list.children().push(itemNode);
            itemFrame = null;
            itemMarker = null;
          }, inputWord);
        } else {
          ordinal++;
        }

        if (!itemFrame) {
          const i = inputWord.code();
          if (i) {
            if (i.$ == 'listEnd') {
              list.finalize?.();
              return list;
            }
            if (i.$ == 'listNext') {
              startItem(i, inputWord.codeFormatting() as Run);
            }
          }
        }
      };
    }
  });
};

function codesFn(obj: CharacterObject, number?: number, allCodes?: CodesFn): CodeImpl | undefined {
  const impl = codes[obj.$!];
  return impl && impl(obj, number, allCodes);
}

export default codesFn;

export function editFilter(doc: import('./doc').Doc): void {
  let balance = 0;

  if (!doc.words.some(function (word: Word, i: number) {
    const code = word.code();
    if (code) {
      switch (code.$) {
        case 'listStart':
          balance++;
          break;
        case 'listNext':
          if (balance === 0) {
            doc.spliceWordsWithRuns(i, 1, [derive(word.codeFormatting() as Run, {
              text: {
                $: 'listStart',
                marker: code.marker
              }
            })]);
            return true;
          }
          break;
        case 'listEnd':
          if (balance === 0) {
            doc.spliceWordsWithRuns(i, 1, []);
          }
          balance--;
          break;
      }
    }
    return false;
  })) {
    if (balance > 0) {
      const ending: Run[] = [];
      while (balance > 0) {
        balance--;
        ending.push({
          text: { $: 'listEnd' }
        });
      }
      doc.spliceWordsWithRuns(doc.words.length - 1, 0, ending);
    }
  }
}

export function inlineNode(inline: Inline, parent: NodeBase, ordinal: number, length: number, formatting: Run): InlineMarkerNode {
  if (!inline.draw || !inline.measure) {
    throw new Error();
  }
  return Object.create(deriveNode({
    parent() {
      return parent;
    },
    draw(this: InlineMarkerNode, ctx: CanvasRenderingContext2D) {
      this.inline.draw(ctx,
        this.left,
        this.baseline,
        this.measured.width,
        this.measured.ascent,
        this.measured.descent,
        this.formatting);
    },
    position(this: InlineMarkerNode, left: number, baseline: number, bounds?: Rect) {
      this.left = left;
      this.baseline = baseline;
      if (bounds) {
        this._bounds = bounds;
      }
    },
    bounds(this: InlineMarkerNode) {
      return this._bounds || rect(this.left, this.baseline - this.measured.ascent,
        this.measured.width, this.measured.ascent + this.measured.descent);
    },
    byCoordinate(this: InlineMarkerNode, x: number, y: number) {
      if (x <= this.bounds().center().x) {
        return this;
      }
      return this.next();
    }
  }), {
    inline: { value: inline },
    _parent: { value: parent },
    ordinal: { value: ordinal },
    length: { value: length },
    formatting: { value: formatting },
    measured: {
      value: inline.measure(formatting)
    }
  }) as InlineMarkerNode;
}
