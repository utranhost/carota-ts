import { defineConfig } from 'vitepress'
import { fileURLToPath } from 'url'
import path from 'path'

const rootDir = path.resolve(fileURLToPath(import.meta.url), '../../..')

export default defineConfig({
  lang: 'zh-CN',
  title: 'Carota-TS',
  description: '基于 HTML Canvas 的简洁、灵活的富文本渲染与编辑库',
  vite: {
    resolve: {
      alias: {
        'per': path.resolve(rootDir, 'node_modules/per/per.js')
      }
    }
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      { text: '模块', link: '/modules/editor' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '架构概览', link: '/guide/architecture' }
          ]
        }
      ],
      '/modules/': [
        {
          text: '核心模块',
          items: [
            { text: 'editor - 编辑器', link: '/modules/editor' },
            { text: 'doc - 文档模型', link: '/modules/doc' },
            { text: 'range - 范围操作', link: '/modules/range' },
            { text: 'runs - 文本运行', link: '/modules/runs' }
          ]
        },
        {
          text: '布局模块',
          items: [
            { text: 'frame - 帧布局', link: '/modules/frame' },
            { text: 'line - 行布局', link: '/modules/line' },
            { text: 'word - 单词', link: '/modules/word' },
            { text: 'part - 片段', link: '/modules/part' },
            { text: 'positionedword - 定位单词', link: '/modules/positionedword' },
            { text: 'wrap - 文字换行', link: '/modules/wrap' }
          ]
        },
        {
          text: '文本处理模块',
          items: [
            { text: 'text - 文本渲染', link: '/modules/text' },
            { text: 'characters - 字符迭代', link: '/modules/characters' },
            { text: 'split - 文字分割', link: '/modules/split' }
          ]
        },
        {
          text: '功能模块',
          items: [
            { text: 'html - HTML 解析', link: '/modules/html' },
            { text: 'codes - 自定义代码', link: '/modules/codes' },
            { text: 'dom - DOM 工具', link: '/modules/dom' },
            { text: 'node - 节点系统', link: '/modules/node' },
            { text: 'rect - 矩形', link: '/modules/rect' },
            { text: 'util - 工具函数', link: '/modules/util' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/utran/carota-ts' }
    ]
  }
})
