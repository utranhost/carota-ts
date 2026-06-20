import per from 'per';
import { Run } from './runs';
import rect, { Rect } from './rect';
import { derive } from './util';

export interface NodeBase {
  ordinal: number;
  length: number;
  block?: boolean;
  newLine?: boolean;
  type?: string;
  children(): NodeBase[];
  parent(): NodeBase | null;
  first(): NodeBase | undefined;
  last(): NodeBase | undefined;
  next(): NodeBase | null;
  previous(): NodeBase | null;
  byOrdinal(index: number): NodeBase;
  byCoordinate(x: number, y: number): NodeBase;
  draw(ctx: CanvasRenderingContext2D, viewPort?: Rect): void;
  parentOfType(type: string): NodeBase | null;
  bounds(): Rect;
  finalize?(startDecrement?: number, lengthIncrement?: number): void;
}

interface InternalNode extends NodeBase {
  _left: number;
  _top: number;
  _children: NodeBase[];
  _parent: NodeBase | null;
}

export interface NodePrototype {
  children(this: NodeBase): NodeBase[];
  parent(this: NodeBase): NodeBase | null;
  first(this: NodeBase): NodeBase | undefined;
  last(this: NodeBase): NodeBase | undefined;
  next(this: NodeBase): NodeBase | null;
  previous(this: NodeBase): NodeBase | null;
  byOrdinal(this: NodeBase, index: number): NodeBase;
  byCoordinate(this: NodeBase, x: number, y: number): NodeBase;
  draw(this: NodeBase, ctx: CanvasRenderingContext2D, viewPort?: Rect): void;
  parentOfType(this: NodeBase, type: string): NodeBase | null;
  bounds(this: NodeBase): Rect;
}

export const prototype: NodePrototype = {
  children(this: NodeBase): NodeBase[] {
    return [];
  },
  parent(this: NodeBase): NodeBase | null {
    return null;
  },
  first(this: NodeBase): NodeBase | undefined {
    return this.children()[0];
  },
  last(this: NodeBase): NodeBase | undefined {
    return this.children()[this.children().length - 1];
  },
  next(this: NodeBase): NodeBase | null {
    let self: NodeBase = this;
    for (;;) {
      const parent = self.parent();
      if (!parent) {
        return null;
      }
      const siblings = parent.children();
      let next: NodeBase | null | undefined = siblings[siblings.indexOf(self) + 1];
      if (next) {
        for (;;) {
          const first: NodeBase | undefined = next!.first();
          if (!first) {
            break;
          }
          next = first;
        }
        return next!;
      }
      self = parent;
    }
  },
  previous(this: NodeBase): NodeBase | null {
    const parent = this.parent();
    if (!parent) {
      return null;
    }
    const siblings = parent.children();
    const prev = siblings[siblings.indexOf(this) - 1];
    if (prev) {
      return prev;
    }
    const prevParent = parent.previous();
    return !prevParent ? null : prevParent.last() || null;
  },
  byOrdinal(this: NodeBase, index: number): NodeBase {
    let found: NodeBase | null = null;
    if (this.children().some(function (child) {
      if (index >= child.ordinal && index < child.ordinal + child.length) {
        found = child.byOrdinal(index);
        if (found) {
          return true;
        }
      }
      return false;
    })) {
      return found!;
    }
    return this;
  },
  byCoordinate(this: NodeBase, x: number, y: number): NodeBase {
    let found: NodeBase | undefined;
    this.children().some(function (child) {
      const b = child.bounds();
      if (b.contains(x, y)) {
        found = child.byCoordinate(x, y);
        if (found) {
          return true;
        }
      }
      return false;
    });
    if (!found) {
      found = this.last();
      while (found) {
        const next = found.last();
        if (!next) {
          break;
        }
        found = next;
      }
      const foundNext = found!.next();
      if (foundNext && foundNext.block) {
        found = foundNext;
      }
    }
    return found!;
  },
  draw(this: NodeBase, ctx: CanvasRenderingContext2D, viewPort?: Rect): void {
    this.children().forEach(function (child) {
      child.draw(ctx, viewPort);
    });
  },
  parentOfType(this: NodeBase, type: string): NodeBase | null {
    const p = this.parent();
    return p && (p.type === type ? p : p.parentOfType(type));
  },
  bounds(this: NodeBase): Rect {
    const self = this as InternalNode;
    let l = self._left, t = self._top, r = 0, b = 0;
    this.children().forEach(function (child) {
      const cb = child.bounds();
      l = Math.min(l, cb.l);
      t = Math.min(t, cb.t);
      r = Math.max(r, cb.l + cb.w);
      b = Math.max(b, cb.t + cb.h);
    });
    return rect(l, t, r - l, b - t);
  }
};

export function deriveNode<T extends Record<string, unknown>>(methods: T): NodePrototype & T {
  return derive(prototype, methods);
}

const generic = deriveNode({
  children(this: NodeBase): NodeBase[] {
    return (this as InternalNode)._children;
  },
  parent(this: NodeBase): NodeBase | null {
    return (this as InternalNode)._parent;
  },
  finalize(this: NodeBase, startDecrement?: number, lengthIncrement?: number): void {
    let start = Number.MAX_VALUE, end = 0;
    (this as InternalNode)._children.forEach(function (child: NodeBase) {
      start = Math.min(start, child.ordinal);
      end = Math.max(end, child.ordinal + child.length);
    });
    Object.defineProperty(this, 'ordinal', { value: start - (startDecrement || 0) });
    Object.defineProperty(this, 'length', { value: (lengthIncrement || 0) + end - start });
  }
});

export function genericNode(type: string, parent: NodeBase | null, left?: number, top?: number): NodeBase {
  return Object.create(generic, {
    type: { value: type },
    _children: { value: [] },
    _parent: { value: parent },
    _left: { value: typeof left === 'number' ? left : Number.MAX_VALUE },
    _top: { value: typeof top === 'number' ? top : Number.MAX_VALUE }
  });
}

export default { prototype, derive: deriveNode, generic: genericNode };
