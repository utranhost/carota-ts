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
import Playground from './.vitepress/components/Playground.vue'
</script>

<div class="home-demo">

## 在线体验

<ClientOnly>
<Playground />
</ClientOnly>

## 关于 Carota 原版项目

Carota-TS 基于 [Carota](https://github.com/danielearwicker/carota) 项目，由 Daniel Earwicker 开发并基于 MIT 许可证发布。

Carota 是一个轻量级的 JavaScript 富文本编辑器，完全基于 HTML5 Canvas 进行文本渲染，不依赖浏览器原生的 `contentEditable`。它的核心设计理念是：

- **Canvas 渲染**：摆脱 DOM 的复杂性，直接在 Canvas 上绘制文本，实现精确的排版控制
- **Run 数据模型**：用简洁的 JSON 数组（Run[]）表示富文本，天然适合序列化和持久化
- **函数式流处理**：借助 [per](https://github.com/danielearwicker/per) 库，以流式管道处理文本分割、布局和渲染
- **零依赖**：运行时无外部依赖，体积小巧

Carota-TS 在原版基础上进行了全面改造：

- 使用 TypeScript 严格模式重写，消除所有 `any` 类型，提供完整的类型定义
- 采用 Vite 构建工具链，支持 ESM 和 UMD 两种输出格式
- 修复了剪贴板富文本格式丢失等运行时问题
- 优化了项目结构，库代码统一放置于 `src/lib` 目录

</div>

<style>
.home-demo {
  max-width: 1152px;
  margin: 48px auto 0;
  padding: 0 24px;
}
</style>
