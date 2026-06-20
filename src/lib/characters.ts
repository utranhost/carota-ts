import per from 'per';
import { Run, CharacterObject, getTextLength, getSubText, getTextChar } from './runs';

interface Character {
  _runs: Run[];
  _run: number;
  _offset: number;
  char: string | CharacterObject | null;
  equals(other: Character): boolean;
  cut(upTo: Character): (eachRun: (run: Run) => void) => void;
}

function compatible(a: Character, b: Character): void {
  if (a._runs !== b._runs) {
    throw new Error('Characters for different documents');
  }
}

const prototype = {
  equals(this: Character, other: Character): boolean {
    compatible(this, other);
    return this._run === other._run && this._offset === other._offset;
  },
  cut(this: Character, upTo: Character): (eachRun: (run: Run) => void) => void {
    compatible(this, upTo);
    const self = this;
    return function (eachRun: (run: Run) => void) {
      for (let runIndex = self._run; runIndex <= upTo._run; runIndex++) {
        const run = self._runs[runIndex];
        if (run) {
          const start = (runIndex === self._run) ? self._offset : 0;
          const stop = (runIndex === upTo._run) ? upTo._offset : getTextLength(run.text);
          if (start < stop) {
            getSubText(function (piece) {
              const pieceRun = Object.create(run) as Run;
              pieceRun.text = piece;
              eachRun(pieceRun);
            }, run.text, start, stop - start);
          }
        }
      }
    };
  }
};

function character(runArray: Run[], run: number, offset: number): Character {
  return Object.create(prototype, {
    _runs: { value: runArray },
    _run: { value: run },
    _offset: { value: offset },
    char: {
      value: run >= runArray.length ? null :
        getTextChar(runArray[run].text, offset)
    }
  });
}

function firstNonEmpty(runArray: Run[], n: number): Character {
  for (; n < runArray.length; n++) {
    if (getTextLength(runArray[n].text) != 0) {
      return character(runArray, n, 0);
    }
  }
  return character(runArray, runArray.length, 0);
}

export default function (runArray: Run[]): (emit: (c: Character) => boolean | void) => void {
  return function (emit: (c: Character) => boolean | void) {
    let c = firstNonEmpty(runArray, 0);
    while (!emit(c) && (c.char !== null)) {
      c = (c._offset + 1 < getTextLength(runArray[c._run].text))
        ? character(runArray, c._run, c._offset + 1)
        : firstNonEmpty(runArray, c._run + 1);
    }
  };
}

export type { Character };
