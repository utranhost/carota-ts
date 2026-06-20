# codes - 自定义代码

`codes` 模块实现了自定义内联元素系统，支持在文档中嵌入列表等结构化内容。

## 概述

`codes` 模块通过 `CharacterObject` 的 `$` 属性识别自定义元素类型，并提供对应的测量、绘制和布局实现。目前内置了列表（list）功能。

## CodesFn 类型

```typescript
type CodesFn = (obj: CharacterObject, number?: number, allCodes?: CodesFn) => CodeImpl | undefined;
```

代码查找函数，根据 CharacterObject 的 `$` 属性返回对应的实现。

## CodeImpl 接口

```typescript
interface CodeImpl {
  eof?: boolean;     // 是否为文档结束标记
  block?: (left, top, width, ordinal, parent, formatting) => (inputWord: Word) => NodeBase | undefined;
  measure?: (formatting: Run) => { width: number; ascent: number; descent: number };
  draw?: (ctx, x, y, width, ascent, descent, formatting) => void;
}
```

## 内置代码类型

### `number` — 有序列表编号

```typescript
{ $: 'number' }
```

渲染为带序号的列表标记（如 `1.`, `2.`, `3.`）。

### `listStart` — 列表开始

```typescript
{ $: 'listStart', marker: { $: 'number' } }
```

标记列表的开始，`marker` 指定列表项标记的类型。

### `listNext` — 列表项分隔

```typescript
{ $: 'listNext' }
```

标记列表中下一个列表项的开始。

### `listEnd` — 列表结束

```typescript
{ $: 'listEnd' }
```

标记列表的结束。

## 列表实现

列表使用 `block` 属性实现块级布局：

1. `listStart` 的 `block` 函数创建列表容器节点
2. 为每个列表项创建子节点和内联标记
3. 每个列表项包含一个内联标记（如序号）和一个 Frame（项内容）
4. `listNext` 开始新的列表项
5. `listEnd` 结束列表，返回列表容器节点

### 列表布局参数

- **缩进**：`indent = 50px`
- **间距**：`spacing = 10px`
- 列表内容从 `left + indent` 开始
- 标记位于 `left + indent - spacing - markerWidth`

## editFilter 函数

```typescript
function editFilter(doc: Doc): void
```

编辑过滤器，在每次编辑后自动维护列表结构的完整性：

1. **孤立的 `listNext`**：如果 `listNext` 出现在列表外部，将其转换为 `listStart`
2. **孤立的 `listEnd`**：如果 `listEnd` 出现在列表外部，将其删除
3. **未关闭的列表**：如果文档末尾有未关闭的列表，自动添加 `listEnd`

```typescript
// Doc 初始化时注册
doc.editFilters = [editFilter];
```

## inlineNode 函数

```typescript
function inlineNode(
  inline: Inline,
  parent: NodeBase,
  ordinal: number,
  length: number,
  formatting: Run
): InlineMarkerNode
```

创建内联标记节点，用于列表项的序号标记。

**InlineMarkerNode 接口：**

```typescript
interface InlineMarkerNode extends NodeBase {
  inline: Inline;
  measured: { width: number; ascent: number; descent: number };
  left: number;
  baseline: number;
  _bounds?: Rect;
  position(left: number, baseline: number, bounds?: Rect): void;
  block?: boolean;
  formatting: Run;
}
```

## 自定义代码

可以通过 `doc.customCodes` 注册自定义代码：

```typescript
doc.customCodes = function(char, data, allCodes) {
  if (char.$ === 'myCode') {
    return {
      measure(formatting) {
        return { width: 20, ascent: 10, descent: 5 };
      },
      draw(ctx, x, y, width, ascent, descent, formatting) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(x, y - ascent, width, ascent + descent);
      }
    };
  }
};
```

## 代码查找链

```typescript
doc.codes = function(code, data, allCodes) {
  const instance = codesFn(code, data, doc.codes);
  return instance || doc.customCodes(code, data, doc.codes);
};
```

先查找内置代码，再查找自定义代码。
