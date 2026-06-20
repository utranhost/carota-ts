# frame - 帧布局

`frame` 模块实现了文档的顶层布局容器，将单词序列组织为行和帧。

## 概述

`Frame` 是布局树的第二层节点（Doc 之下），代表整个文档的可视化布局。它包含多个 `Line`，负责将 Word 序列排列为行，并计算整体边界。

## Frame 接口

```typescript
interface Frame extends NodeBase {
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
```

## 方法详解

### `bounds(): Rect`

获取帧的边界矩形。首次调用时计算并缓存。

计算方式：遍历所有行，取所有行边界的并集。如果帧有 `height` 属性，则使用该高度（用于文档末尾的空白区域）。

### `actualWidth(): number`

获取帧的实际内容宽度（最宽行的宽度）。首次调用时计算并缓存。

### `children(): NodeBase[]`

返回行列表作为子节点。

### `parent(): NodeBase`

返回父节点（通常是 Doc）。

### `draw(ctx: CanvasRenderingContext2D, viewPort?: Rect): void`

绘制帧中的所有行。支持视口裁剪——只绘制在视口范围内的行。

```typescript
frame.draw(ctx, viewPortRect);
```

**视口裁剪逻辑：**
- 跳过完全在视口上方的行（`line.bottom < viewport.top`）
- 遇到完全在视口下方的行时停止（`line.top > viewport.bottom`）

## 工厂函数

```typescript
function frame(
  left: number,
  top: number,
  width: number,
  ordinal: number,
  parent: NodeBase,
  includeTerminator?: ((code: WordCode) => boolean),
  initialAscent?: number,
  initialDescent?: number
): (emit: (frame: Frame) => void, word: Word) => boolean | void
```

创建帧布局处理器，作为 `per` 流的中间操作使用。

**参数：**
- `left`, `top` — 帧的起始坐标
- `width` — 帧的可用宽度（决定换行）
- `ordinal` — 起始序号
- `parent` — 父节点
- `includeTerminator` — 可选，判断终止符代码是否包含在帧中
- `initialAscent`, `initialDescent` — 初始基线信息（用于列表标记对齐）

**返回：** 流处理函数，接收 Word 并在完成时发射 Frame

## 布局过程

帧的布局通过 `wrap` 模块完成：

1. 逐个接收 Word
2. `wrap` 将 Word 排列到行中
3. 行满时创建 `Line` 对象并添加到 `lines` 数组
4. 遇到 EOF 标记时完成帧
5. 设置帧的 `length` 和 `height`
6. 通过 `emit` 发射完成的帧

## 在文档中的使用

```typescript
// Doc.layout() 中的使用
this.frame = per(this.words)
  .per(frame(0, 0, this._width, 0, this))
  .first()!;
```

帧作为 `per` 流的终端操作创建，将 Word 列表转换为带布局信息的 Frame 树。
