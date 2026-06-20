# text - 文本渲染

`text` 模块负责文本的测量和 Canvas 渲染，是 Carota 文本显示的基础。

## 概述

该模块提供了字体字符串生成、Canvas 文本样式应用、文本测量（宽度和基线信息）以及文本绘制等功能。文本测量使用 DOM 元素实现，并内置了缓存机制。

## 导出函数

### `getFontString(run?: Formatting): string`

根据格式属性生成 CSS 字体字符串。

```typescript
getFontString({ bold: true, italic: true, size: 12, font: 'Arial' });
// 'italic bold  12pt Arial'

getFontString({ script: 'super', size: 10 });
// ' 8pt sans-serif' （上下标字号缩小为 80%）
```

**特殊处理：** 当 `script` 为 `'super'` 或 `'sub'` 时，字号乘以 0.8。

### `applyRunStyle(ctx: CanvasRenderingContext2D, run?: Formatting): void`

将格式应用到 Canvas 上下文，设置 `fillStyle` 和 `font`。

```typescript
const ctx = canvas.getContext('2d')!;
applyRunStyle(ctx, { bold: true, color: 'red', size: 14 });
// ctx.fillStyle = 'red'
// ctx.font = 'bold  14pt sans-serif'
```

### `prepareContext(ctx: CanvasRenderingContext2D): void`

初始化 Canvas 上下文的文本对齐设置。

```typescript
prepareContext(ctx);
// ctx.textAlign = 'left'
// ctx.textBaseline = 'alphabetic'
```

### `getRunStyle(run?: Formatting): string`

生成 CSS 样式字符串，用于文本测量。

```typescript
getRunStyle({ bold: true, size: 12, color: 'blue' });
// 'font: bold  12pt sans-serif; color: blue'
```

**特殊处理：** 上下标会添加 `vertical-align: super/sub`。

### `measureText(text: string, style: string): TextMetrics`

测量文本的尺寸信息。使用 DOM 元素进行测量。

```typescript
const m = measureText('Hello World', 'font: 12pt Arial; color: black');
// { ascent: 10, height: 14, descent: 4, width: 72 }
```

**实现原理：**
1. 创建隐藏的 `<span>` 和辅助 `<div>`
2. 设置样式并插入文本
3. 通过 `offsetTop` 差值计算 ascent 和 height
4. descent = height - ascent
5. width = span 的 offsetWidth

### `cachedMeasureText(text: string, style: string): TextMetrics`

带缓存的文本测量函数。相同的文本和样式只测量一次。

```typescript
const m1 = cachedMeasureText('Hello', style); // 执行测量
const m2 = cachedMeasureText('Hello', style); // 从缓存返回
```

### `measure(str: string, formatting: Formatting): TextMetrics`

便捷函数，将格式转换为样式字符串后测量。

```typescript
const m = measure('Hello', { bold: true, size: 12 });
```

### `draw(ctx, str, formatting, left, baseline, width, ascent, descent): void`

在 Canvas 上绘制文本。

```typescript
draw(ctx, 'Hello', { bold: true, color: 'red' }, 10, 50, 40, 12, 4);
```

**特殊处理：**
- 换行符 `\n` 替换为不间断空格（`\u00a0`）绘制
- 上标：基线上移 ascent 的 1/3
- 下标：基线下移 descent 的 1/2
- 下划线：基线下方 1px 处绘制 1px 高的矩形
- 删除线：基线上方 ascent/2 处绘制 1px 高的矩形

## TextMetrics 接口

```typescript
interface TextMetrics {
  ascent: number;   // 基线以上的高度
  height: number;   // 总高度
  descent: number;  // 基线以下的高度
  width: number;    // 文本宽度
}
```

## 常量

### `nbsp: string`

不间断空格字符（`\u00a0`），用于换行符的绘制。

### `enter: string`

等同于 `nbsp`，用于换行符的绘制替代。

## 缓存机制

`createCachedMeasureText()` 创建一个带缓存的测量函数：

- 缓存键：`style + '<>!&%' + text`
- 缓存存储在闭包中的 `Record<string, TextMetrics>` 对象
- 全局实例 `cachedMeasureText` 在模块加载时创建

由于文本测量需要操作 DOM，缓存可以显著减少重复测量的性能开销。
