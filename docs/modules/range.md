# range - 范围操作

`range` 模块提供了文档区间操作的抽象，用于在指定范围内读取和修改文本内容与格式。

## 实时演示

<CarotaDemo height="180px" content="<p>选中一段文字后，使用工具栏修改格式——这就是 Range 的功能。Range 让你可以读取和修改任意区间的文本与格式。</p>" />

## 概述

`Range` 表示文档中的一个区间 `[start, end)`，提供了该区间内的文本操作、格式读取/设置、内容导出等功能。它是编辑操作的核心接口之一。

## RangeInstance 接口

```typescript
interface RangeInstance {
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
  setFormatting(attribute: keyof Formatting, value: FormattingValue): void;
}
```

## 方法详解

### `parts(emit: (item: NodeBase) => void, list?: NodeBase[]): void`

遍历范围内所有的节点。递归遍历布局树，只发射完全包含在范围内的叶子节点，对部分包含的节点继续递归。

```typescript
const range = doc.range(5, 20);
range.parts((node) => {
  console.log('节点:', node.type, node.ordinal, node.length);
});
```

### `clear(): number`

清除范围内的所有文本。等价于 `setText([])`。

```typescript
const range = doc.range(5, 10);
const delta = range.clear();
```

**返回：** 文档长度的变化量

### `setText(text: string | Run | Run[]): number`

设置范围内的文本内容，替换原有内容。

```typescript
const range = doc.range(0, 5);
range.setText('替换文本');

// 使用富文本
range.setText({ text: '红色文本', color: 'red' });

// 使用 Run 数组
range.setText([
  { text: '粗体', bold: true },
  { text: '普通' }
]);
```

**返回：** 文档长度的变化量

### `runs(emit: (run: Run) => void): void`

遍历范围内的所有 Run。

```typescript
const range = doc.range(0, 10);
range.runs((run) => {
  console.log('Run:', run.text, run.bold, run.color);
});
```

### `plainText(): string`

获取范围内的纯文本内容。

```typescript
const range = doc.selectedRange();
const text = range.plainText();
console.log('选中文本:', text);
```

### `save(): Run[]`

导出范围为 Run 数组，格式经过合并优化。

```typescript
const range = doc.selectedRange();
const runs = range.save();
```

### `getFormatting(): Partial<Formatting>`

获取范围内的合并格式。如果范围内所有文本的某个格式属性值相同，则返回该值；如果不同，则该属性为 `multipleValues`（Symbol）。

```typescript
const range = doc.selectedRange();
const fmt = range.getFormatting();

if (fmt.bold === true) {
  console.log('选区全部为粗体');
} else if (fmt.bold === carota.runs.multipleValues) {
  console.log('选区中粗体格式不一致');
} else {
  console.log('选区无粗体');
}
```

**特殊行为：** 当 `start === end`（光标位置）时，会自动扩展到前一个字符来获取格式信息。

### `setFormatting(attribute: keyof Formatting, value: FormattingValue): void`

设置范围内的格式属性。

```typescript
const range = doc.selectedRange();

// 设置粗体
range.setFormatting('bold', true);

// 设置颜色
range.setFormatting('color', '#ff0000');

// 设置对齐（会自动扩展到整个段落）
range.setFormatting('align', 'center');
```

**特殊行为：**
- 当 `attribute` 为 `'align'` 时，自动扩展到整个段落范围
- 当 `start === end`（光标位置）时，设置 `nextInsertFormatting`，影响下次输入的格式

## 工厂函数

```typescript
import carota from 'carota-ts';

// 通过 Doc 方法创建
const range = doc.range(0, 10);
const docRange = doc.documentRange();
const selRange = doc.selectedRange();
const paraRange = doc.paragraphRange(5, 10);
```

## 使用示例

### 格式化选区

```typescript
const range = doc.selectedRange();
const fmt = range.getFormatting();

// 切换粗体
range.setFormatting('bold', fmt.bold !== true);
```

### 提取选区内容

```typescript
const range = doc.selectedRange();
const text = range.plainText();
const runs = range.save();
```

### 替换选区内容

```typescript
const range = doc.selectedRange();
range.setText('新内容');
```
