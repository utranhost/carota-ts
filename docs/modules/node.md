# node - 节点系统

`node` 模块定义了 Carota 布局树的节点基类和原型继承系统。

## 概述

Carota 的布局树（Doc → Frame → Line → PositionedWord → PositionedChar）中所有节点都继承自 `NodeBase`。该模块提供了节点的通用行为（遍历、查找、绘制）和原型派生机制。

## NodeBase 接口

所有布局节点的基接口：

```typescript
interface NodeBase {
  ordinal: number;       // 节点在文档中的起始位置
  length: number;        // 节点覆盖的字符数
  block?: boolean;       // 是否为块级元素
  newLine?: boolean;     // 是否包含换行
  type?: string;         // 节点类型标识

  children(): NodeBase[];
  parent(): NodeBase | null;
  first(): NodeBase | undefined;
  last(): NodeBase | undefined;
  next(): NodeBase | null;
  previous(): NodeBase | null;
  byOrdinal(index: number): NodeBase;
  byCoordinate(x: number, y: number): NodeBase;
  draw(ctx: CanvasRenderingContext2D, viewPort?: Rect): void;
  parentOfType(type: string): NodeBase | null;
  bounds(): Rect;
  finalize?(startDecrement?: number, lengthIncrement?: number): void;
}
```

## 节点遍历方法

### `children(): NodeBase[]`

获取子节点列表。默认返回空数组。

### `parent(): NodeBase | null`

获取父节点。默认返回 `null`。

### `first(): NodeBase | undefined`

获取第一个子节点。

### `last(): NodeBase | undefined`

获取最后一个子节点。

### `next(): NodeBase | null`

获取下一个兄弟节点（深度优先遍历）。如果没有下一个兄弟，则向上查找父节点的下一个兄弟。

### `previous(): NodeBase | null`

获取前一个节点。优先查找前一个兄弟的最后一个后代，否则查找父节点的前一个兄弟。

## 查找方法

### `byOrdinal(index: number): NodeBase`

根据序号查找最深层匹配的节点。递归遍历子节点，找到 `ordinal <= index < ordinal + length` 的节点。

```typescript
const node = doc.byOrdinal(5);
```

### `byCoordinate(x: number, y: number): NodeBase`

根据坐标查找节点。递归遍历子节点，找到边界包含该坐标的节点。

```typescript
const node = doc.byCoordinate(100, 50);
```

### `parentOfType(type: string): NodeBase | null`

向上查找指定类型的祖先节点。

```typescript
const lineNode = wordNode.parentOfType('line');
const docNode = wordNode.parentOfType('document');
```

## 渲染方法

### `draw(ctx: CanvasRenderingContext2D, viewPort?: Rect): void`

绘制节点及其子节点。默认实现遍历子节点并调用每个子节点的 `draw`。

### `bounds(): Rect`

获取节点的边界矩形。默认实现根据子节点的边界计算。

## 原型系统

### `deriveNode<T>(methods: T): NodePrototype & T`

从基础原型派生新的节点原型，添加自定义方法。

```typescript
const myPrototype = deriveNode({
  draw(this: MyNode, ctx: CanvasRenderingContext2D) {
    // 自定义绘制逻辑
  },
  bounds(this: MyNode): Rect {
    // 自定义边界计算
  }
});
```

### `genericNode(type: string, parent: NodeBase | null, left?: number, top?: number): NodeBase`

创建通用节点实例，具有 `children` 和 `parent` 支持，以及 `finalize` 方法。

```typescript
const node = genericNode('list', parent, 0, 0);
node.children().push(childNode);
node.finalize!();
```

### `finalize(startDecrement?: number, lengthIncrement?: number): void`

计算节点的 `ordinal` 和 `length`。遍历子节点确定范围。

## NodePrototype 接口

节点原型的类型定义，包含所有默认方法的签名：

```typescript
interface NodePrototype {
  children(this: NodeBase): NodeBase[];
  parent(this: NodeBase): NodeBase | null;
  first(this: NodeBase): NodeBase | undefined;
  last(this: NodeBase): NodeBase | undefined;
  next(this: NodeBase): NodeBase | null;
  previous(this: NodeBase): NodeBase | null;
  byOrdinal(this: NodeBase, index: number): NodeBase;
  byCoordinate(this: NodeBase, x: number, y: number): NodeBase;
  draw(this: NodeBase, ctx: CanvasRenderingContext2D, viewPort?: Rect): void;
  parentOfType(this: NodeBase, type: string): NodeBase | null;
  bounds(this: NodeBase): Rect;
}
```

## 节点类型

Carota 布局树中的节点类型标识：

| type 值 | 说明 |
|---------|------|
| `'document'` | 文档根节点（Doc） |
| `'frame'` | 帧节点 |
| `'line'` | 行节点 |
| `'word'` | 定位单词节点 |
| `'character'` | 定位字符节点 |
| `'list'` | 列表容器节点 |
| `'item'` | 列表项节点 |
