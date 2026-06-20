# wrap - 文字换行

`wrap` 模块实现了文本的自动换行算法，将单词序列排列到指定宽度的行中。

## 概述

`wrap` 是布局系统的核心算法，负责将 Word 逐个放入行缓冲区，当行宽超出可用宽度时自动换行。它还处理块级元素（如列表）和文档结束标记。

## 工厂函数

```typescript
function wrap(
  left: number,
  top: number,
  width: number,
  ordinal: number,
  parent: NodeBase,
  includeTerminator?: ((code: WordCode) => boolean),
  initialAscent?: number,
  initialDescent?: number
): (emit: (lineOrNumber: LineOrNumber) => boolean | void, word: Word) => boolean | void
```

**参数：**
- `left`, `top` — 起始坐标
- `width` — 可用宽度（决定换行点）
- `ordinal` — 起始序号
- `parent` — 父节点
- `includeTerminator` — 可选，判断终止符代码是否包含在最后一行
- `initialAscent`, `initialDescent` — 初始基线信息

**返回：** 流处理函数，接收 Word 并发射 Line 或高度数值

## 换行算法

### 普通单词

1. 如果行缓冲区为空，直接添加单词
2. 如果添加单词后行宽超出可用宽度，先发送当前行，再添加单词
3. 换行符自动触发发送当前行

### 块级元素

当遇到带有 `code.block` 的单词时：

1. 先发送当前行缓冲区中的内容
2. 将单词交给块级消费者处理
3. 块级消费者返回的节点作为行间元素插入

### 文档结束

当遇到 EOF 标记时：

1. 如果有 `includeTerminator` 函数且终止符代码通过检查，将终止符加入最后一行
2. 发送剩余的行缓冲区内容
3. 发射总高度数值

## 行创建

每行创建时：

1. 收集行缓冲区中的所有 Word
2. 计算最大 ascent 和 descent
3. 调用 `line()` 工厂函数创建 Line 对象
4. 更新 Y 坐标（`y += ascent + descent`）
5. 重置行缓冲区和尺寸累加器

## 发射值类型

流处理函数会发射两种类型的值：

- `Line | NodeBase`：完成的行或块级节点
- `number`：文档的总高度（最后发射）

```typescript
wrapper((lineOrNumber) => {
  if (typeof lineOrNumber === 'number') {
    // 总高度
    totalHeight = lineOrNumber;
  } else {
    // 行或块级节点
    lines.push(lineOrNumber);
  }
}, word);
```

## 与 frame 模块的协作

`wrap` 被 `frame` 模块调用，frame 在外层处理流的发射：

```typescript
// frame 内部
const wrapper = wrap(left, top, width, ordinal, frame, ...);

return function(emit, word) {
  if (wrapper(function(lineOrNumber) {
    if (typeof lineOrNumber === 'number') {
      height = lineOrNumber;
    } else {
      length = (lineOrNumber.ordinal + lineOrNumber.length) - ordinal;
      lines.push(lineOrNumber);
    }
  }, word)) {
    // 帧完成
    Object.defineProperty(frame, 'length', { value: length });
    Object.defineProperty(frame, 'height', { value: height });
    emit(frame);
    return true;
  }
};
```
