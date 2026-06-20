import per from 'per';
import { Run, CharacterObject, getPlainText, consolidate, merge, defaultFormatting, format, multipleValues, Formatting, MergedFormatting } from './runs';
import { Doc } from './doc';
import { NodeBase } from './node';

export interface RangeInstance {
  doc: Doc;
  start: number;
  end: number;
  parts(emit: (item: NodeBase) => void, list?: NodeBase[]): void;
  clear(): number;
  setText(text: string | Run | Run[]): number;
  runs(emit: (run: Run) => void): void;
  plainText(): string;
  save(): Run[];
  getFormatting(): Partial<Formatting>;
  setFormatting(attribute: keyof Formatting, value: Formatting[keyof Formatting]): void;
}

class Range implements RangeInstance {
  doc: Doc;
  start: number;
  end: number;

  constructor(doc: Doc, start: number, end: number) {
    this.doc = doc;
    this.start = start;
    this.end = end;
    if (start > end) {
      this.start = end;
      this.end = start;
    }
  }

  parts(emit: (item: NodeBase) => void, list?: NodeBase[]): void {
    list = list || this.doc.children();
    const self = this;

    list.some(function (item: NodeBase) {
      if (item.ordinal + item.length <= self.start) {
        return false;
      }
      if (item.ordinal >= self.end) {
        return true;
      }
      if (item.ordinal >= self.start &&
        item.ordinal + item.length <= self.end) {
        emit(item);
      } else {
        self.parts(emit, item.children());
      }
      return false;
    });
  }

  clear(): number {
    return this.setText([]);
  }

  setText(text: string | Run | Run[]): number {
    return this.doc.splice(this.start, this.end, text);
  }

  runs(emit: (run: Run) => void): void {
    this.doc.runs(emit, this);
  }

  plainText(): string {
    return per(this.runs.bind(this)).map(getPlainText).all().join('');
  }

  save(): Run[] {
    return per(this.runs.bind(this)).per(consolidate()).all();
  }

  getFormatting(): Partial<Formatting> {
    const range = this;
    if (range.start === range.end) {
      let pos = range.start;
      if (pos > 0) {
        pos--;
      }
      range.start = pos;
      range.end = pos + 1;
    }
    return per(range.runs.bind(range)).reduce(function (acc: MergedFormatting, cur: Run): MergedFormatting {
      return merge(acc as Run, cur);
    }, {} as MergedFormatting).last() as Partial<Formatting> || defaultFormatting;
  }

  setFormatting(attribute: keyof Formatting, value: Formatting[keyof Formatting]): void {
    let range: RangeInstance = this;
    if (attribute === 'align') {
      range = range.doc.paragraphRange(range.start, range.end);
    }
    if (range.start === range.end) {
      range.doc.modifyInsertFormatting(attribute, value);
    } else {
      const saved = range.save();
      const template: Partial<Formatting> = {};
      (template as Record<string, Formatting[keyof Formatting]>)[attribute] = value;
      format(saved, template as Record<string, unknown>);
      range.setText(saved);
    }
  }
}

export default function (doc: Doc, start: number, end: number): RangeInstance {
  return new Range(doc, start, end);
}
