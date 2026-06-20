# 架构概览

Carota 采用分层架构设计，核心数据流为：

```
Run[] → Character → Word → Line → Frame → Doc
```

## 文档层级

Carota 的文档模型遵循以下层级结构：

```
Doc（文档）
 └── Frame（帧 - 整个文档的布局容器）
      └── Line（行 - 一行文本）
           └── PositionedWord（定位单词 - 带位置信息的单词）
                └── PositionedChar（定位字符 - 带位置信息的字符）
```

## 核心概念

### Run（文本运行）

`Run` 是最基础的数据单元，表示一段具有相同格式的文本：

```typescript
interface Run extends Formatting {
  text: string | CharacterObject | (string | CharacterObject)[];
}
```

一个 Run 包含文本内容和格式属性（粗体、斜体、颜色等）。多个 Run 可以组合成完整的文档内容。

### Doc（文档）

`Doc` 是文档的核心模型，管理所有内容、选区和事务：

- 维护 `words` 数组（Word 实例列表）
- 管理选区（`selection.start` / `selection.end`）
- 提供撤销/重做栈（`undo` / `redo`）
- 触发事件（`selectionChanged` / `contentChanged`）

### Range（范围）

`Range` 表示文档中的一个区间，提供区间内的文本操作：

- 获取/设置格式
- 插入/删除文本
- 导出纯文本或 Run 数组

### Frame / Line / Word（布局树）

布局系统将 Word 列表转换为可视化的布局树：

1. **Frame**：整个文档的布局容器，包含所有 Line
2. **Line**：一行文本，包含多个 PositionedWord，处理对齐
3. **PositionedWord**：带坐标信息的单词，包含 PositionedChar

## 数据流

### 加载内容

```
Run[] → characters() → split() → word() → frame() → Doc.layout()
```

1. `characters()` 将 Run 数组展开为字符序列
2. `split()` 按空格和换行将字符分割为单词
3. `word()` 为每个单词计算尺寸
4. `frame()` 将单词排列为行和帧
5. `Doc.layout()` 完成布局

### 编辑内容

```
用户输入 → Doc.splice() → spliceWordsWithRuns() → layout() → paint()
```

1. 用户输入触发 `splice` 操作
2. 将文本变化应用到 words 数组
3. 重新布局
4. 重绘 Canvas

## 模块依赖关系

```
carota（入口）
 ├── editor（编辑器）
 │    └── doc（文档模型）
 │         ├── runs（文本运行）
 │         ├── range（范围操作）
 │         ├── characters（字符迭代）
 │         ├── split（文字分割）
 │         ├── word（单词）
 │         ├── codes（自定义代码）
 │         └── frame（帧布局）
 │              ├── line（行布局）
 │              ├── wrap（文字换行）
 │              └── positionedword（定位单词）
 │                   └── part（片段）
 ├── html（HTML 解析）
 ├── dom（DOM 工具）
 ├── node（节点系统）
 ├── text（文本渲染）
 ├── rect（矩形）
 └── util（工具函数）
```
