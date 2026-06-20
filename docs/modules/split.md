# split - 文字分割

`split` 模块将字符序列按空格和换行分割为单词，是文档内容处理的第二步。

## 概述

`split` 是一个流处理器，接收 `characters` 模块输出的字符序列，按空格和换行符将字符分组为单词坐标（WordCoords）。每个单词坐标包含文本部分、尾部空格部分和结束标记。

## WordCoords 接口

```typescript
interface WordCoords {
  text: Character;     // 单词文本的起始字符
  spaces: Character;   // 尾部空格的起始字符
  end: Character;      // 单词的结束字符
}
```

## 工厂函数

```typescript
function split(
  codes: (char: CharacterObject) => { block?: boolean; eof?: boolean }
): (emit: (coords: WordCoords | null) => boolean | void, inputChar: Character) => boolean | void
```

**参数：**
- `codes` — 代码检测函数，用于识别自定义字符的类型

**返回：** 流处理函数

## 分割规则

### 普通字符

| 字符 | 行为 |
|------|------|
| 普通字符（非空格/换行） | 追加到当前单词 |
| 空格 `' '` | 标记尾部空格开始，触发单词结束 |
| 换行 `'\n'` | 触发单词结束，标记新行开始 |

### 自定义字符（CharacterObject）

通过 `codes` 函数检测：

| 代码属性 | 行为 |
|----------|------|
| `code.block` | 触发单词结束，标记新行开始 |
| `code.eof` | 触发单词结束，标记新行开始 |

### 特殊规则

- **行首单词**：新行开始后的第一个字符立即触发单词结束（确保行首单词独立）
- **文档结束**：`char === null` 时触发最后一个单词的发射，然后发射 `null`

## 分割示例

输入字符序列：`H e l l o   W o r l d \n`

```
1. 'H' → 新单词开始（行首）
2. 'e', 'l', 'l', 'o' → 追加到当前单词
3. ' ' → 标记空格开始
4. 'W' → 触发单词发射：{ text: 'H', spaces: ' ', end: 'W' }，新单词开始
5. 'o', 'r', 'l', 'd' → 追加到当前单词
6. '\n' → 触发单词发射：{ text: 'W', spaces: 'd后', end: '\n' }，标记新行
7. null → 发射 null（文档结束）
```

## 在文档处理中的位置

```
Run[] → characters() → split() → word() → Word[]
```

`split` 的输出被 `word` 模块消费，用于创建 Word 实例：

```typescript
// Doc.load() 中
this.words = per(characters(runs))
  .per(split(self.codes))
  .map((w) => word(w, self.codes))
  .all();
```
