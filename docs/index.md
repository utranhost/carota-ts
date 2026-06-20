---
layout: home

hero:
  name: Carota-TS
  text: Canvas 富文本编辑器
  tagline: 基于 HTML Canvas 的简洁、灵活的富文本渲染与编辑库
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 模块文档
      link: /modules/editor

features:
  - title: Canvas 渲染
    details: 完全基于 HTML5 Canvas 进行文本渲染，脱离 DOM 约束，性能优异
  - title: 富文本支持
    details: 支持粗体、斜体、下划线、删除线、颜色、字体、大小、对齐、上下标等格式
  - title: 撤销/重做
    details: 内置事务系统，支持完整的撤销与重做操作
  - title: HTML 导入
    details: 可将 HTML 内容解析为内部 Run 格式，支持样式映射和类名映射
  - title: 自定义内联元素
    details: 通过 codes 系统支持自定义内联元素（如列表标记），可扩展性强
  - title: TypeScript 重写
    details: 全面使用 TypeScript 严格模式重写，零 any 类型，类型安全
---

<script setup>
import { onMounted } from 'vue'
</script>

<div style="margin-top: -40px; padding: 0 24px;">

## 在线体验

<CarotaDemo height="280px" content="<h1>欢迎使用 Carota!</h1><br><p>这是一个基于 <b>HTML Canvas</b> 的富文本编辑器。你可以直接在这里编辑文本，体验各种格式功能。</p><br><p>试试选中文字后使用工具栏修改格式，或者使用快捷键 <code>Ctrl+B</code> 加粗、<code>Ctrl+I</code> 斜体。</p>" />

</div>
