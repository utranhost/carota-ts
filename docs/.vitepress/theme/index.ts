import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import CarotaDemo from '../components/CarotaDemo.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('CarotaDemo', CarotaDemo)
  }
} satisfies Theme
