import per from 'per';
import carotaDoc from './doc';
import { Doc } from './doc';
import * as dom from './dom';
import rect, { Rect } from './rect';
import { Run, Formatting } from './runs';
import { NodeBase } from './node';

if (typeof document !== 'undefined') {
  setInterval(function () {
    const editors = document.querySelectorAll('.carotaEditorCanvas');

    const ev = document.createEvent('Event');
    ev.initEvent('carotaEditorSharedTimer', true, true);

    for (let n = 0; n < editors.length; n++) {
      (editors[n] as HTMLElement).dispatchEvent(ev);
    }
  }, 200);
}

export function create(element: HTMLElement): Doc {

  if (dom.effectiveStyle(element, 'position') !== 'absolute') {
    element.style.position = 'relative';
  }

  element.innerHTML =
    '<div class="carotaSpacer">' +
    '<canvas width="100" height="100" class="carotaEditorCanvas" style="position: absolute;"></canvas>' +
    '</div>' +
    '<div class="carotaTextArea" style="overflow: hidden; position: absolute; height: 0;">' +
    '<textarea autocorrect="off" autocapitalize="off" spellcheck="false" tabindex="0" ' +
    'style="position: absolute; padding: 0px; width: 1000px; height: 1em; ' +
    'outline: none; font-size: 4px;"></textarea>'
    '</div>';

  const canvas = element.querySelector('canvas') as HTMLCanvasElement;
  const spacer = element.querySelector('.carotaSpacer') as HTMLElement;
  const textAreaDiv = element.querySelector('.carotaTextArea') as HTMLElement;
  const textArea = element.querySelector('textarea') as HTMLTextAreaElement;
  const doc = carotaDoc();
  let keyboardSelect = 0;
  let keyboardX: number | null = null, nextKeyboardX: number | null = null;
  let selectDragStart: number | null = null;
  let focusChar: number | null = null;
  let textAreaContent = '';
  let richClipboard: Run[] | null = null;
  let plainClipboard: string | null = null;

  const toggles: Record<number, keyof Formatting> = {
    66: 'bold',
    73: 'italic',
    85: 'underline',
    83: 'strikeout'
  };

  const exhausted = function (ordinal: number, direction: number): boolean {
    return direction < 0 ? ordinal <= 0 : ordinal >= doc.frame.length - 1;
  };

  const differentLine = function (caret1: Rect, caret2: Rect): boolean {
    return (caret1.b <= caret2.t) ||
      (caret2.b <= caret1.t);
  };

  const changeLine = function (ordinal: number, direction: number): number {
    let originalCaret = doc.getCaretCoords(ordinal)!;
    let newCaret: Rect;
    const targetX = (keyboardX !== null) ? keyboardX : originalCaret.l;

    while (!exhausted(ordinal, direction)) {
      ordinal += direction;
      newCaret = doc.getCaretCoords(ordinal)!;
      if (differentLine(newCaret, originalCaret)) {
        break;
      }
    }

    originalCaret = newCaret!;
    while (!exhausted(ordinal, direction)) {
      if ((direction > 0 && newCaret!.l >= targetX) ||
        (direction < 0 && newCaret!.l <= targetX)) {
        break;
      }

      ordinal += direction;
      newCaret = doc.getCaretCoords(ordinal)!;
      if (differentLine(newCaret, originalCaret)) {
        ordinal -= direction;
        break;
      }
    }

    return ordinal;
  };

  const endOfline = function (ordinal: number, direction: number): number {
    let originalCaret = doc.getCaretCoords(ordinal)!;
    let newCaret: Rect;
    while (!exhausted(ordinal, direction)) {
      ordinal += direction;
      newCaret = doc.getCaretCoords(ordinal)!;
      if (differentLine(newCaret, originalCaret)) {
        ordinal -= direction;
        break;
      }
    }
    return ordinal;
  };

  const handleKey = function (key: number, selecting: boolean, ctrlKey: boolean): boolean {
    let start = doc.selection.start;
    let end = doc.selection.end;
    const length = doc.frame.length - 1;
    let handled = false;

    nextKeyboardX = null;

    if (!selecting) {
      keyboardSelect = 0;
    } else if (!keyboardSelect) {
      switch (key) {
        case 37:
        case 38:
        case 36:
        case 33:
          keyboardSelect = -1;
          break;
        case 39:
        case 40:
        case 35:
        case 34:
          keyboardSelect = 1;
          break;
      }
    }

    let ordinal = keyboardSelect === 1 ? end : start;

    let changingCaret = false;
    switch (key) {
      case 37:
        if (!selecting && start != end) {
          ordinal = start;
        } else {
          if (ordinal > 0) {
            if (ctrlKey) {
              const wordInfo = doc.wordContainingOrdinal(ordinal);
              if (wordInfo) {
                if (wordInfo.ordinal === ordinal) {
                  ordinal = wordInfo.index > 0 ? doc.wordOrdinal(wordInfo.index - 1)! : 0;
                } else {
                  ordinal = wordInfo.ordinal;
                }
              }
            } else {
              ordinal--;
            }
          }
        }
        changingCaret = true;
        break;
      case 39:
        if (!selecting && start != end) {
          ordinal = end;
        } else {
          if (ordinal < length) {
            if (ctrlKey) {
              const wordInfo = doc.wordContainingOrdinal(ordinal);
              if (wordInfo) {
                ordinal = wordInfo.ordinal + wordInfo.word.length;
              }
            } else {
              ordinal++;
            }
          }
        }
        changingCaret = true;
        break;
      case 40:
        ordinal = changeLine(ordinal, 1);
        changingCaret = true;
        break;
      case 38:
        ordinal = changeLine(ordinal, -1);
        changingCaret = true;
        break;
      case 36:
        ordinal = endOfline(ordinal, -1);
        changingCaret = true;
        break;
      case 35:
        ordinal = endOfline(ordinal, 1);
        changingCaret = true;
        break;
      case 33:
        ordinal = 0;
        changingCaret = true;
        break;
      case 34:
        ordinal = length;
        changingCaret = true;
        break;
      case 8:
        if (start === end && start > 0) {
          doc.range(start - 1, start).clear();
          focusChar = start - 1;
          doc.select(focusChar, focusChar);
          handled = true;
        }
        break;
      case 46:
        if (start === end && start < length) {
          doc.range(start, start + 1).clear();
          handled = true;
        }
        break;
      case 90:
        if (ctrlKey) {
          handled = true;
          doc.performUndo();
        }
        break;
      case 89:
        if (ctrlKey) {
          handled = true;
          doc.performUndo(true);
        }
        break;
      case 65:
        if (ctrlKey) {
          handled = true;
          doc.select(0, length);
        }
        break;
      case 67:
      case 88:
        if (ctrlKey) {
          richClipboard = doc.selectedRange().save();
          plainClipboard = doc.selectedRange().plainText();
        }
        break;
    }

    const toggle = toggles[key];
    if (ctrlKey && toggle) {
      const selRange = doc.selectedRange();
      selRange.setFormatting(toggle, selRange.getFormatting()[toggle] !== true);
      paint();
      handled = true;
    }

    if (changingCaret) {
      switch (keyboardSelect) {
        case 0:
          start = end = ordinal;
          break;
        case -1:
          start = ordinal;
          break;
        case 1:
          end = ordinal;
          break;
      }

      if (start === end) {
        keyboardSelect = 0;
      } else {
        if (start > end) {
          keyboardSelect = -keyboardSelect;
          const t = end;
          end = start;
          start = t;
        }
      }
      focusChar = ordinal;
      doc.select(start, end);
      handled = true;
    }

    keyboardX = nextKeyboardX;
    return handled;
  };

  dom.handleEvent(textArea, 'keydown', function (ev: Event) {
    const ke = ev as KeyboardEvent;
    if (handleKey(ke.keyCode, ke.shiftKey, ke.ctrlKey)) {
      return false;
    }
  });

  let verticalAlignment = 'top';

  doc.setVerticalAlignment = function (va: string) {
    verticalAlignment = va;
    paint();
  };

  function getVerticalOffset(): number {
    const docHeight = doc.frame.bounds().h;
    if (docHeight < element.clientHeight) {
      switch (verticalAlignment) {
        case 'middle':
          return (element.clientHeight - docHeight) / 2;
        case 'bottom':
          return element.clientHeight - docHeight;
      }
    }
    return 0;
  }

  const paint = function (): void {
    const availableWidth = element.clientWidth * 1;
    if (doc.width() !== availableWidth) {
      doc.width(availableWidth);
    }

    const docHeight = doc.frame.bounds().h;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const logicalWidth = Math.max(doc.frame.actualWidth(), element.clientWidth);
    const logicalHeight = element.clientHeight;

    canvas.width = dpr * logicalWidth;
    canvas.height = dpr * logicalHeight;
    canvas.style.width = logicalWidth + 'px';
    canvas.style.height = logicalHeight + 'px';

    canvas.style.top = element.scrollTop + 'px';
    spacer.style.width = logicalWidth + 'px';
    spacer.style.height = Math.max(docHeight, element.clientHeight) + 'px';

    if (docHeight < (element.clientHeight - 50) &&
      doc.frame.actualWidth() <= availableWidth) {
      element.style.overflow = 'hidden';
    } else {
      element.style.overflow = 'auto';
    }

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.translate(0, getVerticalOffset() - element.scrollTop);

    doc.draw(ctx, rect(0, element.scrollTop, logicalWidth, logicalHeight));
    doc.drawSelection(ctx, selectDragStart !== null || (document.activeElement === textArea));
  };

  dom.handleEvent(element, 'scroll', paint);

  dom.handleEvent(textArea, 'input', function () {
    let newText = textArea.value;
    if (textAreaContent != newText) {
      textAreaContent = '';
      textArea.value = '';
      if (plainClipboard !== null && newText === plainClipboard) {
        doc.insert(richClipboard!);
      } else {
        doc.insert(newText);
      }
    }
  });

  // Handle paste event to preserve rich formatting when pasting within the editor
  textArea.addEventListener('paste', function (ev: ClipboardEvent) {
    if (richClipboard && plainClipboard !== null) {
      const clipboardText = ev.clipboardData?.getData('text/plain');
      if (clipboardText === plainClipboard) {
        ev.preventDefault();
        doc.insert(richClipboard);
      }
    }
  });

  const updateTextArea = function (): void {
    focusChar = focusChar === null ? doc.selection.end : focusChar;
    const endChar = doc.byOrdinal(focusChar);
    focusChar = null;
    if (endChar) {
      const bounds = endChar.bounds();
      textAreaDiv.style.left = bounds.l + 'px';
      textAreaDiv.style.top = bounds.t + 'px';
      textArea.focus();
      const scrollDownBy = Math.max(0, bounds.t + bounds.h -
        (element.scrollTop + element.clientHeight));
      if (scrollDownBy) {
        element.scrollTop += scrollDownBy;
      }
      const scrollUpBy = Math.max(0, element.scrollTop - bounds.t);
      if (scrollUpBy) {
        element.scrollTop -= scrollUpBy;
      }
      const scrollRightBy = Math.max(0, bounds.l -
        (element.scrollLeft + element.clientWidth));
      if (scrollRightBy) {
        element.scrollLeft += scrollRightBy;
      }
      const scrollLeftBy = Math.max(0, element.scrollLeft - bounds.l);
      if (scrollLeftBy) {
        element.scrollLeft -= scrollLeftBy;
      }
    }
    textAreaContent = doc.selectedRange().plainText();
    textArea.value = textAreaContent;
    textArea.select();

    setTimeout(function () {
      textArea.focus();
    }, 10);
  };

  doc.selectionChanged(function (getFormatting: () => Partial<Formatting>, takeFocus: boolean | undefined) {
    paint();
    if (!selectDragStart) {
      if (takeFocus !== false) {
        updateTextArea();
      }
    }
  });

  function registerMouseEvent(name: string, handler: (node: NodeBase) => void): void {
    dom.handleMouseEvent(spacer, name, function (_ev: MouseEvent, x: number, y: number) {
      handler(doc.byCoordinate(x, y - getVerticalOffset()));
    });
  }

  registerMouseEvent('mousedown', function (node) {
    selectDragStart = node.ordinal;
    doc.select(node.ordinal, node.ordinal);
    keyboardX = null;
  });

  registerMouseEvent('dblclick', function (node) {
    const parentNode = node.parent();
    if (parentNode) {
      doc.select(parentNode.ordinal, parentNode.ordinal +
        ((parentNode as NodeBase & { word?: { text: string } }).word?.text.length ?? parentNode.length));
    }
  });

  registerMouseEvent('mousemove', function (node) {
    if (selectDragStart !== null) {
      if (node) {
        focusChar = node.ordinal;
        if (selectDragStart > node.ordinal) {
          doc.select(node.ordinal, selectDragStart);
        } else {
          doc.select(selectDragStart, node.ordinal);
        }
      }
    }
  });

  registerMouseEvent('mouseup', function (node) {
    selectDragStart = null;
    keyboardX = null;
    updateTextArea();
    textArea.focus();
  });

  let nextCaretToggle = new Date().getTime();
  let focused = false;
  let cachedWidth = element.clientWidth;
  let cachedHeight = element.clientHeight;

  const update = function (): void {
    let requirePaint = false;
    const newFocused = document.activeElement === textArea;
    if (focused !== newFocused) {
      focused = newFocused;
      requirePaint = true;
    }

    const now = new Date().getTime();
    if (now > nextCaretToggle) {
      nextCaretToggle = now + 500;
      if (doc.toggleCaret()) {
        requirePaint = true;
      }
    }

    if (element.clientWidth !== cachedWidth ||
      element.clientHeight !== cachedHeight) {
      requirePaint = true;
      cachedWidth = element.clientWidth;
      cachedHeight = element.clientHeight;
    }

    if (requirePaint) {
      paint();
    }
  };

  dom.handleEvent(canvas, 'carotaEditorSharedTimer', update);
  update();

  doc.sendKey = handleKey;
  return doc;
}
