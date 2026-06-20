import per from 'per';
import characters from './characters';
import split from './split';
import word from './word';
import { NodeBase, deriveNode } from './node';
import { Run, CharacterObject, consolidate, Formatting, FormattingValue } from './runs';
import range from './range';
import { RangeInstance } from './range';
import { event, derive } from './util';
import frame, { Frame } from './frame';
import codesFn, { editFilter, CodesFn } from './codes';
import rect, { Rect } from './rect';
import { Word } from './word';
import { WordCoords } from './split';

type Command = (log: (cmd: Command) => void) => void;

interface CommandLog {
  (cmd: Command): void;
  length: number;
}

const makeEditCommand = function (doc: Doc, start: number, count: number, words: Word[]): Command {
  const selStart = doc.selection.start, selEnd = doc.selection.end;
  return function (log: (cmd: Command) => void) {
    doc._wordOrdinals = [];
    const oldWords = doc.words.splice(start, count, ...words);
    log(makeEditCommand(doc, start, words.length, oldWords));
    doc._nextSelection = { start: selStart, end: selEnd };
  };
};

const makeTransaction = function (perform: (log: CommandLog) => void): (outerLog: (cmd: Command) => void) => void {
  const commands: Command[] = [];
  const log: CommandLog = Object.defineProperty(
    function (command: Command): void {
      commands.push(command);
      log.length = commands.length;
    },
    'length',
    { value: 0, writable: true, configurable: true }
  ) as CommandLog;
  perform(log);

  return function (outerLog: (cmd: Command) => void): void {
    outerLog(makeTransaction(function (innerLog: (cmd: Command) => void): void {
      while (commands.length) {
        commands.pop()!(innerLog);
      }
    }));
  };
};

const isBreaker = function (word: Word): boolean {
  if (word.isNewLine()) {
    return true;
  }
  const code = word.code();
  return !!(code && (code.block || code.eof));
};

export interface Doc extends NodeBase {
  _width: number;
  _wordOrdinals: number[];
  _nextSelection?: { start: number; end: number };
  _currentTransaction?: ((cmd: Command) => void) | null;
  _filtersRunning?: number;
  selection: { start: number; end: number };
  caretVisible: boolean;
  selectionJustChanged: boolean;
  nextInsertFormatting: Partial<Formatting>;
  undo: Command[];
  redo: Command[];
  words: Word[];
  frame: Frame;
  editFilters: ((doc: Doc) => void)[];
  selectionChanged: ReturnType<typeof event>;
  contentChanged: ReturnType<typeof event>;
  customCodes: CodesFn;
  codes: CodesFn;
  load(runs: Run[], takeFocus?: boolean): void;
  layout(): void;
  range(start: number, end: number): RangeInstance;
  documentRange(): RangeInstance;
  selectedRange(): RangeInstance;
  save(): Run[];
  paragraphRange(start: number, end: number): RangeInstance;
  insert(text: string | Run | Run[], takeFocus?: boolean): void;
  modifyInsertFormatting(attribute: keyof Formatting, value: Formatting[keyof Formatting]): void;
  applyInsertFormatting(text: Run[]): void;
  wordOrdinal(index: number): number | undefined;
  wordContainingOrdinal(ordinal: number): { word: Word; ordinal: number; index: number; offset: number } | undefined;
  runs(emit: (run: Run) => void, range: { start: number; end: number }): void;
  spliceWordsWithRuns(wordIndex: number, count: number, runs: Run[]): void;
  splice(start: number, end: number, text: string | Run | Run[]): number;
  registerEditFilter(filter: (doc: Doc) => void): void;
  width(width?: number): number | void;
  children(): NodeBase[];
  toggleCaret(): boolean;
  getCaretCoords(ordinal: number): Rect | undefined;
  byCoordinate(x: number, y: number): NodeBase;
  drawSelection(ctx: CanvasRenderingContext2D, hasFocus: boolean): void;
  notifySelectionChanged(takeFocus?: boolean): void;
  select(ordinal: number, ordinalEnd?: number | null, takeFocus?: boolean): void;
  performUndo(redo?: boolean): void;
  canUndo(redo?: boolean): boolean;
  transaction(perform: (log: (cmd: Command) => void) => void): void;
  setVerticalAlignment?(va: string): void;
  sendKey?: (key: number, selecting: boolean, ctrlKey: boolean) => boolean;
  type: string;
}

const prototype = deriveNode({
  load(this: Doc, runs: Run[], takeFocus?: boolean): void {
    const self = this;
    this.undo = [];
    this.redo = [];
    this._wordOrdinals = [];
    this.words = per(characters(runs)).per(split(self.codes as (char: CharacterObject) => { block?: boolean; eof?: boolean })).map(function (w: WordCoords | null) {
      return word(w, self.codes);
    }).all() as Word[];
    this.layout();
    this.contentChanged.fire();
    this.select(0, 0, takeFocus);
  },
  layout(this: Doc): void {
    this.frame = null as unknown as Frame;
    try {
      this.frame = per(this.words).per(frame(0, 0, this._width, 0, this)).first()!;
    } catch (x) {
      console.error(x);
    }
    if (!this.frame) {
      console.error('A bug somewhere has produced an invalid state - rolling back');
      this.performUndo();
    } else if (this._nextSelection) {
      const next = this._nextSelection;
      delete this._nextSelection;
      this.select(next.start, next.end);
    }
  },
  range(this: Doc, start: number, end: number): RangeInstance {
    return range(this, start, end);
  },
  documentRange(this: Doc): RangeInstance {
    return this.range(0, this.frame.length - 1);
  },
  selectedRange(this: Doc): RangeInstance {
    return this.range(this.selection.start, this.selection.end);
  },
  save(this: Doc): Run[] {
    return this.documentRange().save();
  },
  paragraphRange(this: Doc, start: number, end: number): RangeInstance {
    let i: number;

    const startInfo = this.wordContainingOrdinal(start);
    start = 0;
    if (startInfo && !isBreaker(startInfo.word)) {
      for (i = startInfo.index; i > 0; i--) {
        if (isBreaker(this.words[i - 1])) {
          start = this.wordOrdinal(i)!;
          break;
        }
      }
    }

    const endInfo = this.wordContainingOrdinal(end);
    end = this.frame.length - 1;
    if (endInfo && !isBreaker(endInfo.word)) {
      for (i = endInfo.index; i < this.words.length; i++) {
        if (isBreaker(this.words[i])) {
          end = this.wordOrdinal(i)!;
          break;
        }
      }
    }

    return this.range(start, end);
  },
  insert(this: Doc, text: string | Run | Run[], takeFocus?: boolean): void {
    this.select(this.selection.end + this.selectedRange().setText(text), null, takeFocus);
  },
  modifyInsertFormatting(this: Doc, attribute: keyof Formatting, value: Formatting[keyof Formatting]): void {
    (this.nextInsertFormatting as Record<keyof Formatting, Formatting[keyof Formatting]>)[attribute] = value;
    this.notifySelectionChanged();
  },
  applyInsertFormatting(this: Doc, text: Run[]): void {
    const formatting = this.nextInsertFormatting;
    const insertFormattingProperties = Object.keys(formatting) as (keyof Formatting)[];
    if (insertFormattingProperties.length) {
      text.forEach(function (run: Run) {
        const runRecord = run as unknown as Record<string, FormattingValue>;
        insertFormattingProperties.forEach(function (property: keyof Formatting) {
          runRecord[property] = formatting[property]!;
        });
      });
    }
  },
  wordOrdinal(this: Doc, index: number): number | undefined {
    if (index < this.words.length) {
      const cached = this._wordOrdinals.length;
      if (cached < (index + 1)) {
        let o = cached > 0 ? this._wordOrdinals[cached - 1] : 0;
        for (let n = cached; n <= index; n++) {
          this._wordOrdinals[n] = o;
          o += this.words[n].length;
        }
      }
      return this._wordOrdinals[index];
    }
  },
  wordContainingOrdinal(this: Doc, ordinal: number): { word: Word; ordinal: number; index: number; offset: number } | undefined {
    let result: { word: Word; ordinal: number; index: number; offset: number } | undefined;
    let pos = 0;
    this.words.some(function (word: Word, i: number) {
      if (ordinal >= pos && ordinal < (pos + word.length)) {
        result = {
          word: word,
          ordinal: pos,
          index: i,
          offset: ordinal - pos
        };
        return true;
      }
      pos += word.length;
      return false;
    });
    return result;
  },
  runs(this: Doc, emit: (run: Run) => void, range: { start: number; end: number }): void {
    const startDetails = this.wordContainingOrdinal(Math.max(0, range.start));
    const endDetails = this.wordContainingOrdinal(Math.min(range.end, this.frame.length - 1));
    if (!startDetails || !endDetails) return;
    if (startDetails.index === endDetails.index) {
      startDetails.word.runs(emit, {
        start: startDetails.offset,
        end: endDetails.offset
      });
    } else {
      startDetails.word.runs(emit, { start: startDetails.offset });
      for (let n = startDetails.index + 1; n < endDetails.index; n++) {
        this.words[n].runs(emit);
      }
      endDetails.word.runs(emit, { end: endDetails.offset });
    }
  },
  spliceWordsWithRuns(this: Doc, wordIndex: number, count: number, runs: Run[]): void {
    const self = this;

    const newWords = per(characters(runs))
      .per(split(self.codes as (char: CharacterObject) => { block?: boolean; eof?: boolean }))
      .truthy()
      .map(function (w: WordCoords | null) {
        return word(w, self.codes);
      })
      .all() as Word[];

    let runFilters = false;

    if ('_filtersRunning' in self) {
      self._filtersRunning!++;
    } else {
      for (let n = 0; n < count; n++) {
        if (this.words[wordIndex + n].code()) {
          runFilters = true;
        }
      }
      if (!runFilters) {
        runFilters = newWords.some(function (word: Word) {
          return !!word.code();
        });
      }
    }

    this.transaction(function (log: (cmd: Command) => void) {
      makeEditCommand(self, wordIndex, count, newWords)(log);
      if (runFilters) {
        self._filtersRunning = 0;
        try {
          for (;;) {
            const spliceCount = self._filtersRunning!;
            if (!self.editFilters.some(function (filter: (doc: Doc) => void) {
              filter(self);
              return spliceCount !== self._filtersRunning!;
            })) {
              break;
            }
          }
        } finally {
          delete self._filtersRunning;
        }
      }
    });
  },
  splice(this: Doc, start: number, end: number, text: string | Run | Run[]): number {
    if (typeof text === 'string') {
      const sample = Math.max(0, start - 1);
      const sampleRun = per({ start: sample, end: sample + 1 } as { start: number; end: number })
        .per(this.runs, this)
        .first();
      text = [
        sampleRun ? Object.create(sampleRun, { text: { value: text } }) as Run : { text: text }
      ];
    } else if (!Array.isArray(text)) {
      text = [{ text: text as unknown as Run['text'] }];
    }

    this.applyInsertFormatting(text as Run[]);

    const startWord = this.wordContainingOrdinal(start)!;
    const endWord = this.wordContainingOrdinal(end)!;

    let prefix: Run[];
    if (start === startWord.ordinal) {
      if (startWord.index > 0 && !isBreaker(this.words[startWord.index - 1])) {
        startWord.index--;
        const previousWord = this.words[startWord.index];
        prefix = per({ start: 0, end: Number.MAX_VALUE } as { start: number; end: number }).per(previousWord.runs, previousWord).all() as Run[];
      } else {
        prefix = [];
      }
    } else {
      prefix = per({ start: 0, end: startWord.offset } as { start: number; end: number })
        .per(startWord.word.runs, startWord.word)
        .all() as Run[];
    }

    let suffix: Run[];
    if (end === endWord.ordinal) {
      if ((end === this.frame.length - 1) || isBreaker(endWord.word)) {
        suffix = [];
        endWord.index--;
      } else {
        suffix = per({ start: 0, end: Number.MAX_VALUE } as { start: number; end: number }).per(endWord.word.runs, endWord.word).all() as Run[];
      }
    } else {
      suffix = per({ start: endWord.offset } as { start: number; end: number })
        .per(endWord.word.runs, endWord.word)
        .all() as Run[];
    }

    const oldLength = this.frame.length;

    this.spliceWordsWithRuns(startWord.index, (endWord.index - startWord.index) + 1,
      per(prefix).concat(text as Run[]).concat(suffix).per(consolidate()).all());

    return this.frame ? (this.frame.length - oldLength) : 0;
  },
  registerEditFilter(this: Doc, filter: (doc: Doc) => void): void {
    this.editFilters.push(filter);
  },
  width(this: Doc, width?: number): number | void {
    if (arguments.length === 0) {
      return this._width;
    }
    this._width = width!;
    this.layout();
  },
  children(this: Doc): NodeBase[] {
    return [this.frame];
  },
  toggleCaret(this: Doc): boolean {
    const old = this.caretVisible;
    if (this.selection.start === this.selection.end) {
      if (this.selectionJustChanged) {
        this.selectionJustChanged = false;
      } else {
        this.caretVisible = !this.caretVisible;
      }
    }
    return this.caretVisible !== old;
  },
  getCaretCoords(this: Doc, ordinal: number): Rect | undefined {
    const node = this.byOrdinal(ordinal);
    let b: Rect | undefined;
    if (node) {
      if (node.block && ordinal > 0) {
        const nodeBefore = this.byOrdinal(ordinal - 1);
        if (nodeBefore.newLine) {
          const newLineBounds = nodeBefore.bounds();
          const lineBounds = nodeBefore.parent()!.parent()!.bounds();
          b = rect(lineBounds.l, lineBounds.b, 1, newLineBounds.h);
        } else {
          b = nodeBefore.bounds();
          b = rect(b.r, b.t, 1, b.h);
        }
      } else {
        b = node.bounds();
        if (b.h) {
          b = rect(b.l, b.t, 1, b.h);
        } else {
          b = rect(b.l, b.t, b.w, 1);
        }
      }
      return b;
    }
  },
  byCoordinate(this: Doc, x: number, y: number): NodeBase {
    let ordinal = this.frame.byCoordinate(x, y).ordinal;
    let caret = this.getCaretCoords(ordinal);
    while (caret && caret.b <= y && ordinal < (this.frame.length - 1)) {
      ordinal++;
      caret = this.getCaretCoords(ordinal);
    }
    while (caret && caret.t >= y && ordinal > 0) {
      ordinal--;
      caret = this.getCaretCoords(ordinal);
    }
    return this.byOrdinal(ordinal);
  },
  drawSelection(this: Doc, ctx: CanvasRenderingContext2D, hasFocus: boolean): void {
    if (this.selection.end === this.selection.start) {
      if (this.selectionJustChanged || hasFocus && this.caretVisible) {
        const caret = this.getCaretCoords(this.selection.start);
        if (caret) {
          ctx.save();
          ctx.fillStyle = 'black';
          caret.fill(ctx);
          ctx.restore();
        }
      }
    } else {
      ctx.save();
      ctx.fillStyle = hasFocus ? 'rgba(0, 100, 200, 0.3)' : 'rgba(160, 160, 160, 0.3)';
      this.selectedRange().parts(function (part: NodeBase) {
        (part as { bounds(minimal?: boolean): Rect }).bounds(true).fill(ctx);
      });
      ctx.restore();
    }
  },
  notifySelectionChanged(this: Doc, takeFocus?: boolean): void {
    let cachedFormatting: Partial<Formatting> | null = null;
    const self = this;
    const getFormatting = function () {
      if (!cachedFormatting) {
        cachedFormatting = self.selectedRange().getFormatting();
      }
      return cachedFormatting;
    };
    this.selectionChanged.fire(getFormatting, takeFocus);
  },
  select(this: Doc, ordinal: number, ordinalEnd?: number | null, takeFocus?: boolean): void {
    if (!this.frame) {
      return;
    }
    this.selection.start = Math.max(0, ordinal);
    this.selection.end = Math.min(
      typeof ordinalEnd === 'number' ? ordinalEnd : this.selection.start,
      this.frame.length - 1
    );
    this.selectionJustChanged = true;
    this.caretVisible = true;
    this.nextInsertFormatting = {};

    this.notifySelectionChanged(takeFocus);
  },
  performUndo(this: Doc, redo?: boolean): void {
    const fromStack = redo ? this.redo : this.undo;
    const toStack = redo ? this.undo : this.redo;
    const oldCommand = fromStack.pop();

    if (oldCommand) {
      oldCommand(function (newCommand: Command) {
        toStack.push(newCommand);
      });
      this.layout();
      this.contentChanged.fire();
    }
  },
  canUndo(this: Doc, redo?: boolean): boolean {
    return redo ? !!this.redo.length : !!this.undo.length;
  },
  transaction(this: Doc, perform: (log: (cmd: Command) => void) => void): void {
    if (this._currentTransaction) {
      perform(this._currentTransaction);
    } else {
      const self = this;
      while (this.undo.length > 50) {
        self.undo.shift();
      }
      this.redo.length = 0;
      let changed = false;
      this.undo.push(makeTransaction(function (log: CommandLog) {
        self._currentTransaction = log;
        try {
          perform(log);
        } finally {
          changed = log.length > 0;
          self._currentTransaction = null;
        }
      }));
      if (changed) {
        self.layout();
        self.contentChanged.fire();
      }
    }
  },
  type: 'document'
});

export default function (): Doc {
  const doc = Object.create(prototype) as Doc;
  doc._width = 0;
  doc.selection = { start: 0, end: 0 };
  doc.caretVisible = true;
  doc.customCodes = function (code: CharacterObject, data?: number, allCodes?: CodesFn) { return undefined; };
  doc.codes = function (code: CharacterObject, data?: number, allCodes?: CodesFn) {
    const instance = codesFn(code, data, doc.codes);
    return instance || doc.customCodes(code, data, doc.codes);
  };
  doc.selectionChanged = event();
  doc.contentChanged = event();
  doc.editFilters = [editFilter];
  doc.load([]);
  return doc;
}
