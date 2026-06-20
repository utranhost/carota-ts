# part - 片段

`part` 模块定义了单词中最小的可视单元——片段（Part），负责单个 Run 的测量和绘制。

## 概述

`Part` 是单词中一个 Run 的可视化表示，包含测量后的尺寸信息和绘制逻辑。它是布局树中最小的绘制单位。

## Inline 接口

自定义内联元素的接口，用于处理非文本字符（如 CharacterObject）：

```typescript
interface Inline {
  measure?(formatting: Run): { width: number; ascent: number; descent: number };
  draw?(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, ascent: number, descent: number, formatting: Run): void;
}
```

## Part 接口

```typescript
interface Part {
  run: Run;           // 关联的 Run
  isNewLine: boolean; // 是否为换行符
  width: number;      // 测量后的宽度
  ascent: number;     // 测量后的上升高度
  descent: number;    // 测量后的下降高度
  code?: {            // 自定义代码（可选）
    draw?: Inline['draw'];
    measure?: Inline['measure'];
    block?: boolean;
    eof?: boolean;
  };
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}
```

## 方法详解

### `draw(ctx: CanvasRenderingContext2D, x: number, y: number): void`

绘制片段。

- 如果 `run.text` 是字符串：使用 `text.draw()` 绘制普通文本
- 如果有自定义 `code` 且 `code.draw` 存在：使用自定义绘制函数

```typescript
part.draw(ctx, 100, 50);
```

## 工厂函数

```typescript
function part(run: Run, codes: (char: CharacterObject) => Inline | undefined): Part
```

**参数：**
- `run` — 要创建片段的 Run
- `codes` — 代码查找函数，用于处理 CharacterObject

**创建过程：**

1. **文本 Run**（`run.text` 为字符串）：
   - 检测是否为换行符（长度为 1 且字符为 `\n`）
   - 使用 `measure()` 测量文本尺寸
   - 换行符宽度设为 0

2. **对象 Run**（`run.text` 为 CharacterObject）：
   - 通过 `codes()` 查找对应的 Inline 实现
   - 如果找不到，使用默认的 `defaultInline`
   - 通过 `inline.measure()` 获取尺寸

## 默认内联元素

当 CharacterObject 没有匹配的 Inline 实现时，使用默认的 `defaultInline`：

```typescript
const defaultInline: Inline = {
  measure(formatting: Run) {
    const m = measure('?', formatting);
    return {
      width: m.width + 4,
      ascent: m.width + 2,
      descent: m.width + 2
    };
  },
  draw(ctx, x, y, width, ascent, descent, _formatting) {
    ctx.fillStyle = 'silver';
    ctx.fillRect(x, y - ascent, width, ascent + descent);
    ctx.strokeRect(x, y - ascent, width, ascent + descent);
    ctx.fillStyle = 'black';
    ctx.fillText('?', x + 2, y);
  }
};
```

默认内联元素显示为银色矩形框内的问号，表示未识别的自定义字符。
