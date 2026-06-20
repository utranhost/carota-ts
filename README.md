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