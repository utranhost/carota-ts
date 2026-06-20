# line - 行布局

`line` 模块实现了一行文本的布局，将单词列表排列为带位置信息的行。

## 概述

`Line` 是布局树中的行级节点，包含多个 `PositionedWord`。它负责计算行的边界、处理文本对齐，并将单词定位到正确的坐标。

## Line 接口

```typescript
interface Line extends NodeBase {
  doc: NodeBase;            // 所属文档
  left: number;             // 行的左边距
  width: number;            // 行的可用宽度
  baseline: number;         // 基线 Y 坐标
  ascent: number;           // 基线以上高度
  descent: number;          // 基线以下高度
  ordinal: number;          // 行的起始序号
  align: string;            // 对齐方式
  positionedWords: PositionedWord[]; // 定位后的单词列表
  actualWidth: number;      // 实际内容宽度
  length: number;           // 行的字符长度
  bounds(minimal?: boolean): Rect;
  parent(): NodeBase;
  children(): PositionedWord[];
  draw(ctx: CanvasRenderingContext2D): void;
  first(): PositionedWord;
  last(): PositionedWord;
  type: string;
}
```

## 方法详解

### `bounds(minimal?: boolean): Rect`

获取行的边界矩形。

- `minimal = false`（默认）：返回行的完整边界，宽度为 `width`（可用宽度）
- `minimal = true`：返回行的紧凑边界，宽度为第一个单词到最后一个单词的宽度

```typescript
const fullBounds = line.bounds();
const compactBounds = line.bounds(true);
```

### `parent(): NodeBase`

返回所属文档节点。

### `children(): PositionedWord[]`

返回定位后的单词列表。

### `draw(ctx: CanvasRenderingContext2D): void`

绘制行中的所有单词。

## 文本对齐

行创建时根据第一个单词的对齐属性进行对齐处理：

| align 值 | 行为 |
|----------|------|
| `'left'` | 默认左对齐 |
| `'right'` | 右对齐，`x = width - actualWidth` |
| `'center'` | 居中，`x = (width - actualWidth) / 2` |
| `'justify'` | 两端对齐，单词间均匀分配间距（最后一行除外） |

## 工厂函数

```typescript
function line(
  doc: NodeBase,
  left: number,
  width: number,
  baseline: number,
  ascent: number,
  descent: number,
  words: Word[],
  ordinal: number
): Line
```

**参数：**
- `doc` — 文档节点
- `left` — 行的左边距
- `width` — 行的可用宽度
- `baseline` — 基线 Y 坐标
- `ascent` — 基线以上高度
- `descent` — 基线以下高度
- `words` — 该行包含的单词列表
- `ordinal` — 行的起始序号

**创建过程：**
1. 从第一个单词获取对齐方式
2. 计算实际内容宽度（总宽度减去最后一个单词的空格宽度）
3. 根据对齐方式计算起始 x 坐标和单词间距
4. 为每个单词创建 `PositionedWord`，赋予正确的坐标和序号
5. 设置行的 `length` 和 `actualWidth`

## 实际宽度计算

`actualWidth` 是行的实际内容宽度，计算方式为所有单词宽度之和减去最后一个单词的空格宽度：

```typescript
let actualWidth = 0;
words.forEach((word) => { actualWidth += word.width; });
actualWidth -= words[words.length - 1].space.width;
```

这是因为最后一个单词的尾部空格不应计入行的实际宽度。
