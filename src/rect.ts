export interface Rect {
  l: number;
  t: number;
  w: number;
  h: number;
  r: number;
  b: number;
  contains(x: number, y: number): boolean;
  stroke(ctx: CanvasRenderingContext2D): void;
  fill(ctx: CanvasRenderingContext2D): void;
  offset(x: number, y: number): Rect;
  equals(other: Rect): boolean;
  center(): { x: number; y: number };
}

const prototype = {
  contains(this: Rect, x: number, y: number): boolean {
    return x >= this.l && x < (this.l + this.w) &&
      y >= this.t && y < (this.t + this.h);
  },
  stroke(this: Rect, ctx: CanvasRenderingContext2D): void {
    ctx.strokeRect(this.l, this.t, this.w, this.h);
  },
  fill(this: Rect, ctx: CanvasRenderingContext2D): void {
    ctx.fillRect(this.l, this.t, this.w, this.h);
  },
  offset(this: Rect, x: number, y: number): Rect {
    return rect(this.l + x, this.t + y, this.w, this.h);
  },
  equals(this: Rect, other: Rect): boolean {
    return this.l === other.l && this.t === other.t &&
      this.w === other.w && this.h === other.h;
  },
  center(this: Rect): { x: number; y: number } {
    return { x: this.l + this.w / 2, y: this.t + this.h / 2 };
  }
};

function rect(l: number, t: number, w: number, h: number): Rect {
  return Object.create(prototype, {
    l: { value: l },
    t: { value: t },
    w: { value: w },
    h: { value: h },
    r: { value: l + w },
    b: { value: t + h }
  });
}

export default rect;
