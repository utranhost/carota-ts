# rect - 矩形

`rect` 模块定义了矩形数据结构和操作方法，用于表示文档中各元素的边界和位置。

## 概述

`Rect` 是 Carota 中表示二维矩形的核心数据结构，广泛用于布局计算、碰撞检测和 Canvas 绘制。它使用原型继承创建不可变实例。

## Rect 接口

```typescript
interface Rect {
  l: number;  // 左边距 (left)
  t: number;  // 上边距 (top)
  w: number;  // 宽度 (width)
  h: number;  // 高度 (height)
  r: number;  // 右边距 (left + width)，只读
  b: number;  // 下边距 (top + height)，只读

  contains(x: number, y: number): boolean;
  stroke(ctx: CanvasRenderingContext2D): void;
  fill(ctx: CanvasRenderingContext2D): void;
  offset(x: number, y: number): Rect;
  equals(other: Rect): boolean;
  center(): { x: number; y: number };
}
```

## 工厂函数

### `rect(l: number, t: number, w: number, h: number): Rect`

创建矩形实例。`r` 和 `b` 自动计算为 `l + w` 和 `t + h`。

```typescript
import carota from 'carota-ts';

const r = carota.rect(10, 20, 100, 50);
// { l: 10, t: 20, w: 100, h: 50, r: 110, b: 70 }
```

## 方法详解

### `contains(x: number, y: number): boolean`

检查点 `(x, y)` 是否在矩形内。左闭右开区间：`l <= x < r` 且 `t <= y < b`。

```typescript
const r = rect(0, 0, 100, 50);
r.contains(50, 25);  // true
r.contains(100, 25); // false（右边界不包含）
r.contains(50, 50);  // false（下边界不包含）
```

### `stroke(ctx: CanvasRenderingContext2D): void`

在 Canvas 上绘制矩形边框。

```typescript
const ctx = canvas.getContext('2d')!;
const r = rect(10, 10, 100, 50);
r.stroke(ctx);
```

### `fill(ctx: CanvasRenderingContext2D): void`

在 Canvas 上填充矩形。

```typescript
const ctx = canvas.getContext('2d')!;
ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
const r = rect(10, 10, 100, 50);
r.fill(ctx);
```

### `offset(x: number, y: number): Rect`

创建偏移后的新矩形。

```typescript
const r = rect(10, 20, 100, 50);
const r2 = r.offset(5, 10);
// { l: 15, t: 30, w: 100, h: 50, r: 115, b: 80 }
```

### `equals(other: Rect): boolean`

比较两个矩形是否相等。

```typescript
const r1 = rect(0, 0, 100, 50);
const r2 = rect(0, 0, 100, 50);
r1.equals(r2); // true
```

### `center(): { x: number; y: number }`

获取矩形中心点坐标。

```typescript
const r = rect(0, 0, 100, 50);
r.center(); // { x: 50, y: 25 }
```

## 不可变性

通过 `rect()` 创建的矩形实例是不可变的，所有属性通过 `Object.defineProperty` 定义为只读。`offset()` 方法返回新的矩形实例而非修改原实例。

## 使用场景

`Rect` 在 Carota 中广泛使用：

- **光标位置**：`Doc.getCaretCoords()` 返回光标的矩形区域
- **节点边界**：`NodeBase.bounds()` 返回节点的矩形边界
- **选区绘制**：使用 `fill()` 绘制选区高亮
- **碰撞检测**：`byCoordinate()` 使用 `contains()` 查找节点
- **视口裁剪**：`draw()` 方法接收 `viewPort` 参数进行视口裁剪
