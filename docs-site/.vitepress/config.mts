import { defineConfig } from 'vitepress'

const docsBase = process.env.DOCS_BASE || '/clauditorium/'

export default defineConfig({
  title: 'Clauditorium',
  description: 'Tutorial-first guides for using the Clauditorium Claude CLI API server.',
  base: docsBase,
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Tutorials', link: '/tutorials/first-chat' },
      { text: 'Reference', link: '/reference/endpoints' },
      { text: 'API Explorer', link: '/reference/openapi-explorer' }
    ],
    sidebar: [
      {
        text: 'Get Started',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Troubleshooting', link: '/troubleshooting' }
        ]
      },
      {
        text: 'Tutorials',
        items: [
          { text: 'First Chat Flow', link: '/tutorials/first-chat' },
          { text: 'Auth and Rate Limits', link: '/tutorials/auth-rate-limit' },
          { text: 'Production Hardening', link: '/tutorials/production-hardening' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Endpoints', link: '/reference/endpoints' },
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Observability', link: '/reference/observability' },
          { text: 'OpenAPI Explorer', link: '/reference/openapi-explorer' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/erikmaday/clauditorium' }
    ],
    footer: {
      message: 'MIT Licensed',
      copyright: 'Copyright 2026 Clauditorium contributors'
    },
    search: {
      provider: 'local'
    }
  }
})
