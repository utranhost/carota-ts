# editor - 编辑器

`editor` 模块是 Carota 的编辑器入口，负责将一个 HTML 容器元素转换为可交互的富文本编辑器。

## 实时演示

<CarotaDemo height="220px" content="<p>在编辑器中自由编辑文本，体验完整的交互功能：</p><br><p><b>粗体文本</b>、<i>斜体文本</i>、<u>下划线文本</u></p><br><p>支持鼠标点击定位、拖拽选择、双击选词、键盘导航等操作。</p>" />

## 概述

编辑器模块在指定的 HTML 元素内创建 Canvas 和隐藏的 textarea，处理用户输入（键盘、鼠标），并将操作委托给 `Doc` 模型。它还负责：

- Canvas 渲染（支持高 DPI 屏幕）
- 光标闪烁
- 选区高亮
- 键盘导航（方向键、Home/End、PageUp/PageDown）
- 鼠标交互（点击、双击选择单词、拖拽选择）
- 复制/粘贴（保留富文本格式）
- 滚动处理
- 垂直对齐

## 导出

### `create(element: HTMLElement): Doc`

创建编辑器实例。

```typescript
import carota from 'carota-ts';

const element = document.getElementById('editor')!;
const doc = carota.editor.create(element);
```

**参数：**
- `element` — 用作编辑器容器的 HTML 元素，需要指定宽度和高度

**返回：**
- `Doc` 实例，可用于程序化操作文档内容

## 内部机制

### DOM 结构

`create` 函数会在容器内创建以下 DOM 结构：

```html
<div class="carotaSpacer">
  <canvas class="carotaEditorCanvas" style="position: absolute;"></canvas>
</div>
<div class="carotaTextArea" style="overflow: hidden; position: absolute; height: 0;">
  <textarea autocorrect="off" autocapitalize="off" spellcheck="false" tabindex="0"
    style="position: absolute; padding: 0px; width: 1000px; height: 1em; outline: none; font-size: 4px;">
  </textarea>
</div>
```

- **Canvas**：用于渲染文档内容
- **Spacer**：撑开容器以支持滚动
- **TextArea**：隐藏的文本区域，用于接收键盘输入和处理剪贴板

### 键盘处理

编辑器通过隐藏的 textarea 捕获键盘输入：

| 按键 | 功能 |
|------|------|
| 方向键 | 移动光标 |
| Shift + 方向键 | 扩展选区 |
| Ctrl + 方向键 | 按单词移动 |
| Home / End | 行首 / 行尾 |
| PageUp / PageDown | 文档首 / 尾 |
| Backspace / Delete | 删除字符 |
| Ctrl+Z / Ctrl+Y | 撤销 / 重做 |
| Ctrl+A | 全选 |
| Ctrl+B / I / U / S | 粗体 / 斜体 / 下划线 / 删除线 |
| Ctrl+C / X | 复制 / 剪切 |

### 鼠标处理

| 事件 | 行为 |
|------|------|
| `mousedown` | 设置光标位置，开始选区 |
| `dblclick` | 选中整个单词 |
| `mousemove` | 拖拽扩展选区 |
| `mouseup` | 结束选区，聚焦 textarea |

### 复制粘贴

编辑器实现了双轨剪贴板机制：

- `richClipboard`：保存富文本格式（Run 数组）
- `plainClipboard`：保存纯文本

在编辑器内部复制粘贴时，会保留原始格式。从外部粘贴时，作为纯文本插入。

### 垂直对齐

通过 `doc.setVerticalAlignment` 设置垂直对齐方式：

```typescript
doc.setVerticalAlignment('top');    // 顶部对齐（默认）
doc.setVerticalAlignment('middle'); // 垂直居中
doc.setVerticalAlignment('bottom'); // 底部对齐
```

### 定时器

编辑器使用共享定时器（200ms 间隔）处理：

- 光标闪烁切换
- 焦点状态检测
- 容器尺寸变化检测

所有 `.carotaEditorCanvas` 元素共享同一个定时器，避免多个编辑器实例时产生多余计时器。
