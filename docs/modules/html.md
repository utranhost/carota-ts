# html - HTML 解析

`html` 模块负责将 HTML 内容解析为 Carota 内部的 Run 数组。

## 实时演示

<CarotaDemo height="200px" content="<h2>HTML 解析演示</h2><br><p>这段文本从 <b>HTML</b> 解析而来，支持 <i>多种格式</i> 标签。</p><br><ul><li>粗体 &lt;b&gt;</li><li>斜体 &lt;i&gt;</li><li>下划线 &lt;u&gt;</li></ul>" />

## 概述

该模块将 HTML 字符串或 DOM 元素解析为 Run 数组，支持常见的 HTML 格式标签和 CSS 样式属性。还可以通过类名映射自定义格式。

## 导出

### `parse(html: HTMLElement | string, classes: Record<string, Partial<Formatting>>): Run[]`

解析 HTML 内容为 Run 数组。

**参数：**
- `html` — HTML 字符串或 DOM 元素
- `classes` — 类名到格式的映射表

```typescript
import carota from 'carota-ts';

// 解析 HTML 字符串
const runs = carota.html.parse('<b>粗体</b>和<i>斜体</i>', {});
// [{ text: '粗体', bold: true }, { text: '和' }, { text: '斜体', italic: true }]

// 使用类名映射
const runs2 = carota.html.parse('<span class="highlight">高亮文本</span>', {
  highlight: { color: 'yellow', bold: true }
});
```

## 支持的 HTML 标签

| 标签 | 格式属性 |
|------|----------|
| `<b>`, `<strong>` | `bold: true` |
| `<i>`, `<em>` | `italic: true` |
| `<u>` | `underline: true` |
| `<s>`, `<strike>`, `<del>` | `strikeout: true` |
| `<sub>` | `script: 'sub'` |
| `<super>` | `script: 'super'` |
| `<code>` | `font: 'monospace'` |
| `<br>`, `<p>` | 换行符 `\n` |
| `<h1>` ~ `<h5>` | 对应字号 + 换行 |

## 支持的 CSS 样式

| CSS 属性 | 格式属性 | 说明 |
|----------|----------|------|
| `font-weight: bold` | `bold: true` | 粗体 |
| `font-style: italic` | `italic: true` | 斜体 |
| `text-decoration: underline` | `underline: true` | 下划线 |
| `text-decoration: line-through` | `strikeout: true` | 删除线 |
| `color` | `color` | 文字颜色 |
| `font-family` | `font` | 字体（自动去除引号） |
| `font-size` (pt) | `size` | 字号 |
| `text-align` | `align` | 对齐方式 |

## 支持的 HTML 属性

| 属性 | 标签 | 格式属性 |
|------|------|----------|
| `color` | `<font>` | `color` |
| `face` | `<font>` | `font` |
| `align` | 任意 | `align` |
| `size` | `<font>` | `size`（1-7 映射为 6-20pt） |

## 标题字号映射

| 标签 | 字号 (pt) |
|------|-----------|
| `<h1>` | 30 |
| `<h2>` | 20 |
| `<h3>` | 16 |
| `<h4>` | 14 |
| `<h5>` | 12 |

## 旧版 font 标签字号映射

| size 属性 | 字号 (pt) |
|-----------|-----------|
| 1 | 6 |
| 2 | 7 |
| 3 | 9 |
| 4 | 10 |
| 5 | 12 |
| 6 | 16 |
| 7 | 20 |

## 空白处理

HTML 解析器对空白字符有特殊处理：

- 连续的换行和空白压缩为单个空格
- 标签前的空白保留一个前导空格
- 标签后的空白保留一个尾随空格
- 块级元素（`<br>`, `<p>`, `<h1>`~`<h5>`）后插入换行符

## 类名映射

通过 `classes` 参数可以将 CSS 类名映射到格式属性：

```typescript
const classes = {
  'text-danger': { color: 'red', bold: true },
  'text-muted': { color: 'gray' },
  'font-large': { size: 16 }
};

const runs = carota.html.parse(
  '<span class="text-danger">警告</span><span class="font-large">大字</span>',
  classes
);
```

一个元素可以有多个类名，格式会叠加：

```typescript
const runs = carota.html.parse(
  '<span class="text-danger font-large">红色大字</span>',
  { 'text-danger': { color: 'red' }, 'font-large': { size: 16 } }
);
// 结果: { text: '红色大字', color: 'red', size: 16 }
```
