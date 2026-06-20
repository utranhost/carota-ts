# runs - 文本运行

`runs` 模块定义了 Carota 的核心数据结构和文本格式系统。

## 实时演示

<CarotaDemo height="180px" :show-json="true" content="<b>粗体文本</b> 和 <i>斜体文本</i><br><font color='red' size='5'>红色大字</font> 和 <u>下划线</u>" />

## 概述

`Run`（文本运行）是 Carota 中最基础的数据单元，表示一段具有相同格式的文本。所有文档内容都由 Run 数组表示。该模块还提供了格式合并、比较、克隆、文本操作等工具函数。

## 核心类型

### Formatting 接口

定义文本格式属性：

```typescript
interface Formatting {
  bold?: boolean;      // 粗体
  italic?: boolean;    // 斜体
  underline?: boolean; // 下划线
  strikeout?: boolean; // 删除线
  color?: string;      // 文字颜色
  font?: string;       // 字体
  size?: number;       // 字号（pt）
  align?: string;      // 对齐方式（left/center/right/justify）
  script?: string;     // 上下标（normal/super/sub）
}
```

### Run 接口

文本运行，继承 `Formatting` 并添加 `text` 属性：

```typescript
interface Run extends Formatting {
  text: string | CharacterObject | (string | CharacterObject)[];
}
```

`text` 可以是：
- `string`：普通文本
- `CharacterObject`：自定义内联对象（如列表标记）
- 数组：混合内容

### CharacterObject 接口

自定义字符对象，用于表示非文本的内联元素：

```typescript
interface CharacterObject {
  $?: string;                                    // 类型标识符
  [key: string]: string | boolean | number | undefined;  // 自定义属性
}
```

示例：

```typescript
// 列表开始标记
{ $: 'listStart', marker: { $: 'number' } }

// 列表结束标记
{ $: 'listEnd' }
```

### FormattingValue 类型

```typescript
type FormattingValue = boolean | string | number | undefined;
```

### MultipleValues 类型

当合并多个 Run 的格式时，如果某个属性值不一致，使用 `multipleValues` Symbol 标记：

```typescript
const multipleValues: unique symbol = Symbol('multipleValues');
type MultipleValues = typeof multipleValues;
```

### MergedFormatting 类型

```typescript
type MergedFormatting = { [K in keyof Formatting]?: Formatting[K] | MultipleValues };
```

## 默认格式

```typescript
const defaultFormatting: Required<Formatting> = {
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
```

## 工具函数

### `sameFormatting(run1: Formatting, run2: Formatting): boolean`

比较两个格式是否完全相同。

```typescript
sameFormatting({ bold: true }, { bold: true });  // true
sameFormatting({ bold: true }, { bold: false }); // false
```

### `clone(run: Run): Run`

克隆一个 Run，只复制非默认值的格式属性。

```typescript
const original: Run = { text: 'Hello', bold: true, color: 'red' };
const copy = clone(original);
// { text: 'Hello', bold: true, color: 'red' }
```

### `merge(run1: Run | Run[], run2?: Run): MergedFormatting`

合并格式。相同属性取相同值，不同属性标记为 `multipleValues`。

```typescript
// 合并两个 Run
merge({ bold: true }, { bold: true });   // { bold: true }
merge({ bold: true }, { bold: false });  // { bold: multipleValues }

// 合并 Run 数组
merge([{ bold: true }, { bold: false }, { bold: true }]);
// { bold: multipleValues }
```

### `format(run: Run | Run[], template: MergedFormatting): void`

将模板格式应用到 Run 或 Run 数组。跳过值为 `multipleValues` 或 `undefined` 的属性。

```typescript
const runs: Run[] = [
  { text: 'Hello', bold: true },
  { text: 'World', italic: true }
];
format(runs, { color: 'red', bold: multipleValues });
// bold 保持不变（因为模板中为 multipleValues），color 统一设为 red
```

### `consolidate(): (emit: (run: Run) => void, run: Run) => void`

创建合并流处理器，将相邻且格式相同的 Run 合并为一个。

```typescript
// 通常通过 per 库使用
const result = per(runs).per(consolidate()).all();
```

### `getPlainText(run: Run): string`

获取 Run 的纯文本表示。

```typescript
getPlainText({ text: 'Hello' });              // 'Hello'
getPlainText({ text: { $: 'image' } });       // '_'
getPlainText({ text: ['He', { $: 'img' }] }); // 'He_'
```

### 文本长度与子串

#### `getTextLength(text): number`

获取文本长度。

#### `getSubText(emit, text, start, count): void`

获取文本子串，通过回调发射。

#### `getTextChar(text, offset): string | CharacterObject`

获取文本中指定位置的字符。

#### `pieceCharacters(each, piece): void`

遍历一个文本片段中的每个字符。

## 格式键列表

```typescript
const formattingKeys: (keyof Formatting)[] = [
  'bold', 'italic', 'underline', 'strikeout',
  'color', 'font', 'size', 'align', 'script'
];
```
