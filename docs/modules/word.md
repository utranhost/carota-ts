# word - 单词

`word` 模块定义了单词的数据结构，单词是布局和编辑操作的基本单位。

## 概述

`Word` 表示文档中的一个单词，由文本部分（text）和尾部空格部分（space）组成。每个部分包含多个 `Part`（片段），每个 Part 对应一个 Run。Word 负责计算自身的尺寸、绘制内容、以及提供 Run 的访问。

## Word 接口

```typescript
interface Word {
  text: Section;       // 文本部分
  space: Section;      // 尾部空格部分
  ascent: number;      // 最大上升高度
  descent: number;     // 最大下降高度
  width: number;       // 总宽度（text + space）
  length: number;      // 总字符数（text + space）
  eof?: boolean;       // 是否为文档结束标记
  isNewLine(): boolean;
  code(): WordCode | false;
  codeFormatting(): Run | false;
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
  plainText(): string;
  align(): string;
  runs(emit: (run: Run) => void, range?: { start?: number; end?: number }): void;
}
```

## Section 接口

单词的每个部分（text/space）都是一个 Section：

```typescript
interface Section {
  parts: Part[];       // 片段列表
  ascent: number;      // 最大上升高度
  descent: number;     // 最大下降高度
  width: number;       // 部分宽度
  length: number;      // 字符数
  plainText: string;   // 纯文本
}
```

## WordCode 接口

自定义单词代码，用于特殊内联元素（如列表标记）：

```typescript
interface WordCode {
  block?: (left, top, width, ordinal, parent, formatting) => (inputWord: Word) => NodeBase | undefined;
  eof?: boolean;
  draw?: (ctx, x, y, width, ascent, descent, formatting) => void;
  measure?: (formatting: Run) => { width: number; ascent: number; descent: number };
  $?: string;
  marker?: CharacterObject;
}
```

## 方法详解

### `isNewLine(): boolean`

判断单词是否为换行符。条件：文本部分只有一个 Part，且该 Part 是换行符。

### `code(): WordCode | false`

获取单词的自定义代码。仅当文本部分只有一个 Part 时返回代码，否则返回 `false`。

### `codeFormatting(): Run | false`

获取代码单词的格式 Run。仅当文本部分只有一个 Part 时返回。

### `draw(ctx: CanvasRenderingContext2D, x: number, y: number): void`

绘制单词。依次绘制文本部分和空格部分的所有 Part。

### `plainText(): string`

获取单词的纯文本（文本部分 + 空格部分）。

### `align(): string`

获取单词的对齐方式。取文本部分第一个 Part 的 `align` 属性，默认为 `'left'`。

### `runs(emit: (run: Run) => void, range?: { start?: number; end?: number }): void`

遍历单词中的 Run。支持范围限制，只发射指定范围内的 Run。

```typescript
word.runs((run) => {
  console.log(run.text);
});

// 只获取偏移 2 到 5 的 Run
word.runs((run) => {
  console.log(run.text);
}, { start: 2, end: 5 });
```

## 工厂函数

```typescript
function word(
  coords: { text: Character; spaces: Character; end: Character } | null,
  codes: (char: CharacterObject) => Inline | undefined
): Word
```

**参数：**
- `coords` — 字符坐标信息，由 `split` 模块提供。`null` 表示 EOF 标记
- `codes` — 代码查找函数，用于处理 CharacterObject

**创建过程：**
1. 从字符坐标创建文本 Section 和空格 Section
2. 每个 Section 通过 `part()` 函数将 Run 转换为 Part
3. 计算单词的 ascent、descent、width、length

**特殊处理：** 当 `coords` 为 `null` 时，创建一个只包含换行符的 EOF 标记单词。
