import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import CarotaDemo from '../components/CarotaDemo.vue'
import Playground from '../components/Playground.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CarotaDemo', CarotaDemo)
    app.component('Playground', Playground)
  }
} satisfies Theme
