import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import OpenApiExplorer from './components/OpenApiExplorer.vue'
import './custom.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('OpenApiExplorer', OpenApiExplorer)
  }
}

export default theme
