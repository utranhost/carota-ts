# positionedword - 定位单词

`positionedword` 模块为单词赋予在行中的具体坐标位置，是布局树中可交互的单词节点。

## 概述

`PositionedWord` 在 `Word` 的基础上添加了位置信息（左边距、所属行），并提供了字符级别的访问。它是鼠标交互和光标定位的基础。

## PositionedWord 接口

```typescript
interface PositionedWord extends NodeBase {
  word: Word;                  // 原始单词
  line: Line;                  // 所属行
  left: number;                // 在行中的左边距
  width: number;               // 占位宽度（含间距）
  ordinal: number;             // 文档中的起始序号
  length: number;              // 字符长度
  _characters?: PositionedChar[]; // 字符缓存
  draw(ctx: CanvasRenderingContext2D): void;
  bounds(): Rect;
  parts(eachPart: (part: Part) => boolean | void): void;
  realiseCharacters(): void;
  children(): PositionedChar[];
  parent(): Line;
  type: string;
}
```

## PositionedChar 接口

定位字符，单词中单个字符的位置信息：

```typescript
interface PositionedChar extends NodeBase {
  left: number;        // 在单词中的左边距
  part: Part;          // 所属片段
  word: PositionedWord; // 所属定位单词
  ordinal: number;     // 文档中的序号
  length: number;      // 固定为 1
  width?: number;      // 字符宽度（最后一个字符可能扩展）
  newLine?: boolean;   // 是否为换行符
  bounds(): Rect;
  parent(): PositionedWord;
  byOrdinal(): PositionedChar;
  byCoordinate(x: number, y: number): NodeBase;
  type: string;
}
```

## 方法详解

### PositionedWord

#### `draw(ctx: CanvasRenderingContext2D): void`

绘制单词，将坐标转换为行内的绝对坐标。

#### `bounds(): Rect`

获取单词的边界矩形，坐标为行内的绝对坐标。

#### `parts(eachPart: (part: Part) => boolean | void): void`

遍历单词的所有 Part（文本部分 + 空格部分）。

#### `realiseCharacters(): void`

实例化单词中的所有字符。延迟计算，首次访问 `children()` 时调用。

**创建过程：**
1. 遍历所有 Part
2. 对每个 Part 的文本调用 `pieceCharacters` 逐字符处理
3. 为每个字符创建 `PositionedChar`，记录 x 坐标和序号
4. 最后一个字符的宽度扩展到单词末尾
5. 换行符或 EOF 字符标记 `newLine` 属性

#### `children(): PositionedChar[]`

获取定位字符列表。首次调用时触发 `realiseCharacters()`。

#### `parent(): Line`

返回所属行。

### PositionedChar

#### `bounds(): Rect`

获取字符的边界矩形，基于单词的边界和字符的 left 偏移计算。

#### `parent(): PositionedWord`

返回所属定位单词。

#### `byOrdinal(): PositionedChar`

返回自身（字符是最小单位）。

#### `byCoordinate(x: number, y: number): NodeBase`

根据 x 坐标判断点击位置在字符中心左侧还是右侧，返回自身或下一个字符。

## 工厂函数

```typescript
function positionedWord(
  word: Word,
  line: Line,
  left: number,
  ordinal: number,
  width: number
): PositionedWord
```

**参数：**
- `word` — 原始单词
- `line` — 所属行
- `left` — 在行中的左边距
- `ordinal` — 文档中的起始序号
- `width` — 占位宽度（含对齐间距）

## 延迟字符化

字符的实例化是延迟的，只在需要时（如鼠标点击定位字符）才计算。这避免了为所有字符创建对象的开销。

```typescript
// 首次访问 children() 时触发 realiseCharacters()
const chars = positionedWord.children();
```
