export const formattingKeys: (keyof Formatting)[] = [
  'bold', 'italic', 'underline', 'strikeout', 'color', 'font', 'size', 'align', 'script'
];

export interface Formatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  color?: string;
  font?: string;
  size?: number;
  align?: string;
  script?: string;
}

export type FormattingValue = boolean | string | number | undefined;

export const multipleValuesSymbol: unique symbol = Symbol('multipleValues');
export type MultipleValues = typeof multipleValuesSymbol;

export interface Run extends Formatting {
  text: string | CharacterObject | (string | CharacterObject)[];
}

export interface CharacterObject {
  $?: string;
  [key: string]: string | boolean | number | undefined;
}

export const defaultFormatting: Required<Formatting> = {
  size: 10,
  font: 'sans-serif',
  color: 'black',
  bold: false,
  italic: false,
  underline: false,
  strikeout: false,
  align: 'left',
  script: 'normal'
};

export function sameFormatting(run1: Formatting, run2: Formatting): boolean {
  return formattingKeys.every(function (key) {
    return run1[key] === run2[key];
  });
}

export function clone(run: Run): Run {
  const result: Run = { text: run.text };
  formattingKeys.forEach(function (key) {
    const val = run[key];
    if (val && val != defaultFormatting[key]) {
      (result as Record<keyof Formatting, FormattingValue>)[key] = val;
    }
  });
  return result;
}

export const multipleValues: MultipleValues = multipleValuesSymbol;

export type MergedFormatting = { [K in keyof Formatting]?: Formatting[K] | MultipleValues };

export function merge(run1: Run | Run[], run2?: Run): MergedFormatting {
  if (arguments.length === 1) {
    return Array.isArray(run1) ? (run1 as Run[]).reduce(function (acc: MergedFormatting, cur: Run): MergedFormatting {
      return merge(acc as Run, cur) as MergedFormatting;
    }, {} as MergedFormatting) : run1;
  }
  if (arguments.length > 2) {
    return merge(Array.prototype.slice.call(arguments, 0));
  }
  const merged: MergedFormatting = {};
  formattingKeys.forEach(function (key) {
    if (key in (run1 as Run) || key in (run2 as Run)) {
      if ((run1 as Run)[key] === (run2 as Run)[key]) {
        (merged as Record<keyof Formatting, FormattingValue | MultipleValues>)[key] = (run1 as Run)[key];
      } else {
        (merged as Record<keyof Formatting, FormattingValue | MultipleValues>)[key] = multipleValues;
      }
    }
  });
  return merged;
}

export function format(run: Run | Run[], template: MergedFormatting): void {
  if (Array.isArray(run)) {
    (run as Run[]).forEach(function (r) {
      format(r, template);
    });
  } else {
    (Object.keys(template) as (keyof Formatting)[]).forEach(function (key) {
      const val = template[key];
      if (val !== multipleValues && val !== undefined) {
        (run as Record<keyof Formatting, FormattingValue | MultipleValues>)[key] = val;
      }
    });
  }
}

export function consolidate(): (emit: (run: Run) => void, run: Run) => void {
  let current: Run | undefined;
  return function (emit: (run: Run) => void, run: Run) {
    if (!current || !sameFormatting(current, run) ||
      (typeof current.text != 'string') ||
      (typeof run.text != 'string')) {
      current = clone(run);
      emit(current);
    } else {
      current.text += run.text;
    }
  };
}

export function getPlainText(run: Run): string {
  if (typeof run.text === 'string') {
    return run.text;
  }
  if (Array.isArray(run.text)) {
    const str: string[] = [];
    (run.text as (string | CharacterObject)[]).forEach(function (piece) {
      str.push(getPiecePlainText(piece));
    });
    return str.join('');
  }
  return '_';
}

export function getPieceLength(piece: string | CharacterObject): number {
  return (piece as string).length || 1;
}

export function getPiecePlainText(piece: string | CharacterObject): string {
  return (piece as string).length ? (piece as string) : '_';
}

export function getTextLength(text: string | CharacterObject | (string | CharacterObject)[]): number {
  if (typeof text === 'string') {
    return text.length;
  }
  if (Array.isArray(text)) {
    let length = 0;
    (text as (string | CharacterObject)[]).forEach(function (piece) {
      length += getPieceLength(piece);
    });
    return length;
  }
  return 1;
}

export function getSubText(
  emit: (piece: string | CharacterObject) => void,
  text: string | CharacterObject | (string | CharacterObject)[],
  start: number,
  count: number
): void {
  if (count === 0) {
    return;
  }
  if (typeof text === 'string') {
    emit(text.substr(start, count));
    return;
  }
  if (Array.isArray(text)) {
    let pos = 0;
    (text as (string | CharacterObject)[]).some(function (piece) {
      if (count <= 0) {
        return true;
      }
      const pieceLength = getPieceLength(piece);
      if (pos + pieceLength > start) {
        if (pieceLength === 1) {
          emit(piece);
          count -= 1;
        } else {
          const str = (piece as string).substr(Math.max(0, start - pos), count);
          emit(str);
          count -= str.length;
        }
      }
      pos += pieceLength;
    });
    return;
  }
  emit(text);
}

export function getTextChar(text: string | CharacterObject | (string | CharacterObject)[], offset: number): string | CharacterObject {
  let result: string | CharacterObject | undefined;
  getSubText(function (c) { result = c; }, text, offset, 1);
  return result!;
}

export function pieceCharacters(each: (char: string | CharacterObject) => void, piece: string | CharacterObject): void {
  if (typeof piece === 'string') {
    for (let c = 0; c < piece.length; c++) {
      each(piece[c]);
    }
  } else {
    each(piece);
  }
}
