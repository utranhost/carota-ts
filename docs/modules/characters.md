# characters - 字符迭代

`characters` 模块将 Run 数组展开为字符序列，是文档内容处理的第一步。

## 概述

`characters` 模块是一个流处理器，将 Run 数组中的文本逐字符展开。每个字符都带有其在 Run 数组中的位置信息（run 索引和偏移量），支持后续的分割和重组操作。

## Character 接口

```typescript
interface Character {
  _runs: Run[];           // 所属 Run 数组
  _run: number;           // 当前 Run 的索引
  _offset: number;        // 在当前 Run 中的偏移量
  char: string | CharacterObject | null; // 字符内容
  equals(other: Character): boolean;
  cut(upTo: Character): (eachRun: (run: Run) => void) => void;
}
```

## 方法详解

### `equals(other: Character): boolean`

比较两个字符是否指向同一位置。要求两个字符属于同一个 Run 数组。

```typescript
char1.equals(char2); // true 如果 _run 和 _offset 相同
```

### `cut(upTo: Character): (eachRun: (run: Run) => void) => void`

切割从当前字符到目标字符之间的内容，返回一个发射器函数。

```typescript
const emitter = startChar.cut(endChar);
emitter((run) => {
  console.log('切割结果:', run.text);
});
```

**切割逻辑：**
1. 从 `this._run` 到 `upTo._run` 遍历 Run
2. 对首尾 Run 进行子串切割
3. 中间的 Run 整体发射

**示例：**

```
Run 数组: [ {text: "Hello"}, {text: " World"}, {text: "!"} ]
从 _run=0, _offset=2 到 _run=1, _offset=3

发射:
- "llo" (Run 0 的偏移 2 到末尾)
- " Wo" (Run 1 的偏移 0 到 3)
```

## 工厂函数

```typescript
function characters(runArray: Run[]): (emit: (c: Character) => boolean | void) => void
```

创建字符迭代器，遍历 Run 数组中的所有字符。

**遍历逻辑：**
1. 从第一个非空 Run 的第一个字符开始
2. 逐字符前进：同一 Run 内偏移加 1，否则跳到下一个非空 Run
3. 遇到 `char === null`（超出 Run 数组末尾）时停止

```typescript
const iterator = characters(runs);
iterator((char) => {
  console.log(char.char); // 'H', 'e', 'l', 'l', 'o', ...
});
```

## 使用场景

`characters` 模块主要在 `doc.load()` 和 `doc.spliceWordsWithRuns()` 中使用：

```typescript
// Doc.load() 中
this.words = per(characters(runs))
  .per(split(self.codes))
  .map((w) => word(w, self.codes))
  .all();
```

数据流：

```
Run[] → characters() → split() → word() → Word[]
```

## 内部函数

### `character(runArray, run, offset): Character`

创建单个字符实例。

### `firstNonEmpty(runArray, n): Character`

从索引 `n` 开始查找第一个非空 Run 的第一个字符。如果所有 Run 都为空，返回数组末尾的空字符。
