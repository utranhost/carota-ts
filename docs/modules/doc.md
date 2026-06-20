# doc - 文档模型

`doc` 模块是 Carota 的核心，管理文档的所有内容、选区和事务操作。

## 实时演示

<CarotaDemo height="200px" content="<p>Doc 是文档的核心模型。编辑此文本时，Doc 管理着内容、选区和撤销/重做栈。</p><br><p>试试 <code>Ctrl+Z</code> 撤销、<code>Ctrl+Y</code> 重做。</p>" />

## 概述

`Doc` 是文档的核心模型对象，由 `editor.create()` 创建。它维护了文档的单词列表、选区状态、撤销/重做栈，并提供了内容操作和布局的完整 API。

## Doc 接口

```typescript
interface Doc extends NodeBase {
  _width: number;
  _wordOrdinals: number[];
  selection: { start: number; end: number };
  caretVisible: boolean;
  selectionJustChanged: boolean;
  nextInsertFormatting: Partial<Formatting>;
  undo: Command[];
  redo: Command[];
  words: Word[];
  frame: Frame;
  editFilters: ((doc: Doc) => void)[];
  selectionChanged: EventHandler;
  contentChanged: EventHandler;
  customCodes: CodesFn;
  codes: CodesFn;
  // ... 方法见下文
}
```

## 核心方法

### 内容加载

#### `load(runs: Run[], takeFocus?: boolean): void`

加载 Run 数组作为文档内容，替换所有现有内容。

```typescript
doc.load([
  { text: '你好', bold: true },
  { text: '，世界！' }
]);
```

#### `save(): Run[]`

导出整个文档为 Run 数组。

```typescript
const runs = doc.save();
```

### 内容编辑

#### `insert(text: string | Run | Run[], takeFocus?: boolean): void`

在当前选区末尾插入文本。

```typescript
doc.insert('纯文本');
doc.insert({ text: '富文本', bold: true });
doc.insert([{ text: '多段' }, { text: '富文本', italic: true }]);
```

#### `splice(start: number, end: number, text: string | Run | Run[]): number`

替换指定范围的文本，返回长度变化量。

```typescript
const delta = doc.splice(0, 5, '替换文本');
```

#### `range(start: number, end: number): RangeInstance`

获取指定范围的 Range 对象。

```typescript
const r = doc.range(0, 10);
```

#### `documentRange(): RangeInstance`

获取覆盖整个文档的 Range 对象。

#### `selectedRange(): RangeInstance`

获取当前选区的 Range 对象。

#### `paragraphRange(start: number, end: number): RangeInstance`

获取包含指定范围的段落 Range。

### 选区操作

#### `select(ordinal: number, ordinalEnd?: number | null, takeFocus?: boolean): void`

设置选区位置。

```typescript
// 光标移到位置 5
doc.select(5);

// 选中 0 到 10 的范围
doc.select(0, 10);
```

#### `notifySelectionChanged(takeFocus?: boolean): void`

手动触发选区变化通知。

#### `toggleCaret(): boolean`

切换光标可见性，返回可见性是否发生变化。

#### `getCaretCoords(ordinal: number): Rect | undefined`

获取指定位置的光标坐标。

### 布局

#### `layout(): void`

重新计算文档布局。

#### `width(width?: number): number | void`

获取或设置文档宽度。设置宽度会触发重新布局。

```typescript
doc.width(600);  // 设置宽度
const w = doc.width();  // 获取宽度
```

### 撤销/重做

#### `transaction(perform: (log: (cmd: Command) => void) => void): void`

执行事务操作。事务内的所有编辑操作作为一个整体进行撤销/重做。

```typescript
doc.transaction((log) => {
  // 多个编辑操作
  doc.splice(0, 5, '新文本');
  doc.splice(10, 15, '更多文本');
});
```

#### `performUndo(redo?: boolean): void`

执行撤销（默认）或重做操作。

```typescript
doc.performUndo();       // 撤销
doc.performUndo(true);   // 重做
```

#### `canUndo(redo?: boolean): boolean`

检查是否可以撤销或重做。

### 格式操作

#### `modifyInsertFormatting(attribute: keyof Formatting, value: FormattingValue): void`

修改下次插入时的默认格式。当光标在空选区时使用。

```typescript
doc.modifyInsertFormatting('bold', true);
doc.modifyInsertFormatting('color', 'red');
```

#### `applyInsertFormatting(text: Run[]): void`

将 `nextInsertFormatting` 应用到指定的 Run 数组。

### 单词查询

#### `wordOrdinal(index: number): number | undefined`

获取指定索引处单词的起始序号。

#### `wordContainingOrdinal(ordinal: number): WordInfo | undefined`

获取包含指定序号的单词信息。

```typescript
const info = doc.wordContainingOrdinal(5);
// { word: Word, ordinal: 3, index: 1, offset: 2 }
```

### 渲染

#### `draw(ctx: CanvasRenderingContext2D, viewPort: Rect): void`

在指定 Canvas 上下文中渲染文档。

#### `drawSelection(ctx: CanvasRenderingContext2D, hasFocus: boolean): void`

绘制选区高亮或光标。

### 编辑过滤器

#### `registerEditFilter(filter: (doc: Doc) => void): void`

注册编辑过滤器，在每次编辑后执行。用于维护文档结构的完整性（如列表的配对标记）。

```typescript
doc.registerEditFilter((doc) => {
  // 检查并修复文档结构
});
```

### 坐标查找

#### `byCoordinate(x: number, y: number): NodeBase`

根据坐标查找最近的节点。

## 事件

### `selectionChanged`

选区变化时触发，回调接收 `getFormatting` 函数和 `takeFocus` 标志。

```typescript
doc.selectionChanged((getFormatting, takeFocus) => {
  const fmt = getFormatting();
  console.log('选区格式:', fmt);
});
```

### `contentChanged`

文档内容变化时触发。

```typescript
doc.contentChanged(() => {
  console.log('内容已更新');
});
```

## 事务系统

Doc 使用事务系统管理撤销/重做：

- 每次编辑操作生成一个 `Command`
- 多个 Command 可以组合成一个事务
- 事务是撤销/重做的最小单位
- 撤销栈最多保留 50 个事务
- 执行新操作时清空重做栈

## 工厂函数

```typescript
import carota from 'carota-ts';

// 通过编辑器创建
const doc = carota.editor.create(element);

// 直接创建（无 UI）
const doc2 = carota.document();
```
