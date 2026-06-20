# dom - DOM 工具

`dom` 模块提供了一组 DOM 操作的工具函数，用于事件处理和样式查询。

## 概述

该模块封装了常见的 DOM 操作，包括事件绑定、鼠标坐标转换和样式查询，简化了编辑器与 DOM 的交互。

## 导出函数

### `isAttached(element: HTMLElement): boolean`

检查元素是否已挂载到文档中。

```typescript
if (dom.isAttached(element)) {
  console.log('元素已挂载');
}
```

**实现：** 沿父节点链向上查找到根节点，检查根节点是否为 `Document` 实例且包含 `body`。

### `clear(element: HTMLElement): void`

清空元素的所有子节点。

```typescript
dom.clear(container);
```

### `setText(element: HTMLElement, text: string): void`

设置元素的文本内容（清空后添加文本节点）。

```typescript
dom.setText(element, 'Hello World');
```

### `handleEvent(element: HTMLElement, name: string, handler: (ev: Event) => boolean | void): void`

绑定事件处理器。如果处理器返回 `false`，则自动调用 `preventDefault()`。

```typescript
dom.handleEvent(button, 'click', (ev) => {
  console.log('点击');
  return false; // 阻止默认行为
});
```

**参数：**
- `element` — 目标元素
- `name` — 事件名称
- `handler` — 事件处理函数，返回 `false` 阻止默认行为

### `handleMouseEvent(element: HTMLElement, name: string, handler: (ev: MouseEvent, x: number, y: number) => boolean | void): void`

绑定鼠标事件处理器，自动将 `clientX/clientY` 转换为元素内的相对坐标。

```typescript
dom.handleMouseEvent(canvas, 'mousedown', (ev, x, y) => {
  console.log('鼠标位置:', x, y);
});
```

**参数：**
- `element` — 目标元素
- `name` — 事件名称（如 `mousedown`、`mousemove`、`mouseup`、`dblclick`）
- `handler` — 事件处理函数，接收原始事件和相对坐标 `(x, y)`

**坐标计算：** 使用 `getBoundingClientRect()` 将 `clientX/clientY` 减去元素左上角坐标，得到元素内的相对位置。

### `effectiveStyle(element: HTMLElement, name: string): string`

获取元素的计算样式值。

```typescript
const position = dom.effectiveStyle(element, 'position');
const color = dom.effectiveStyle(element, 'color');
```

**实现：** 使用 `window.getComputedStyle()` 获取计算样式。

## 使用场景

这些工具函数主要被 `editor` 模块内部使用：

- `handleEvent` — 绑定键盘事件、滚动事件、定时器事件
- `handleMouseEvent` — 绑定鼠标点击、拖拽、双击事件
- `effectiveStyle` — 检查容器元素的 `position` 样式
