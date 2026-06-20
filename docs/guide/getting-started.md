# 快速开始

## 安装

```bash
npm install carota-ts
```

## 基本用法

### 1. 准备 HTML 容器

在页面中创建一个容器元素：

```html
<div id="editor" style="width: 600px; height: 400px;"></div>
```

### 2. 创建编辑器

```typescript
import carota from 'carota-ts';

const element = document.getElementById('editor')!;
const doc = carota.editor.create(element);
```

`create` 函数会自动在容器中创建 Canvas 和隐藏的 textarea，并返回一个 `Doc` 实例。

### 3. 加载内容

```typescript
// 加载纯文本
doc.load([{ text: '你好，世界！' }]);

// 加载富文本
doc.load([
  { text: '粗体', bold: true },
  { text: ' 和 ' },
  { text: '斜体', italic: true }
]);
```

### 4. 操作选区

```typescript
// 选中全部文本
doc.select(0, doc.frame.length - 1);

// 获取选中的范围
const range = doc.selectedRange();

// 设置格式
range.setFormatting('bold', true);
range.setFormatting('color', 'red');

// 获取格式
const formatting = range.getFormatting();
console.log(formatting.bold); // true
```

### 5. 监听事件

```typescript
// 选区变化
doc.selectionChanged((getFormatting) => {
  const fmt = getFormatting();
  console.log('当前格式:', fmt);
});

// 内容变化
doc.contentChanged(() => {
  console.log('内容已更新');
});
```

### 6. 从 HTML 导入

```typescript
const runs = carota.html.parse('<b>粗体</b>和<i>斜体</i>', {});
doc.load(runs);
```

### 7. 导出内容

```typescript
const runs = doc.save();
console.log(runs);
// [{ text: '粗体', bold: true }, { text: '和' }, { text: '斜体', italic: true }]
```

## 格式属性

Carota 支持以下格式属性：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bold` | `boolean` | `false` | 粗体 |
| `italic` | `boolean` | `false` | 斜体 |
| `underline` | `boolean` | `false` | 下划线 |
| `strikeout` | `boolean` | `false` | 删除线 |
| `color` | `string` | `'black'` | 文字颜色 |
| `font` | `string` | `'sans-serif'` | 字体 |
| `size` | `number` | `10` | 字号（pt） |
| `align` | `string` | `'left'` | 对齐方式（left/center/right/justify） |
| `script` | `string` | `'normal'` | 上下标（normal/super/sub） |

## 键盘快捷键

编辑器内置以下快捷键：

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+B` | 切换粗体 |
| `Ctrl+I` | 切换斜体 |
| `Ctrl+U` | 切换下划线 |
| `Ctrl+S` | 切换删除线 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` | 重做 |
| `Ctrl+A` | 全选 |
| `Ctrl+C` | 复制 |
| `Ctrl+X` | 剪切 |
| `Ctrl+V` | 粘贴 |
| `方向键` | 移动光标 |
| `Shift+方向键` | 扩展选区 |
| `Ctrl+方向键` | 按单词移动 |
| `Home/End` | 行首/行尾 |
| `PageUp/PageDown` | 文档首/尾 |
