<script setup lang="ts">
import { onMounted } from 'vue'
import { withBase } from 'vitepress'

const containerId = 'swagger-ui-container'

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve) => {
    const existing = document.querySelector(`link[href="${href}"]`)
    if (existing) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => resolve()
    document.head.appendChild(link)
  })
}

onMounted(async () => {
  await loadStylesheet('https://unpkg.com/swagger-ui-dist@5/swagger-ui.css')
  await loadScript('https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js')

  const swaggerBundle = (window as unknown as {
    SwaggerUIBundle?: (config: {
      url: string
      dom_id: string
      deepLinking: boolean
      displayRequestDuration: boolean
      docExpansion: 'none' | 'list' | 'full'
      persistAuthorization: boolean
      defaultModelsExpandDepth: number
    }) => unknown
  }).SwaggerUIBundle

  if (!swaggerBundle) {
    return
  }

  swaggerBundle({
    url: withBase('/openapi.yaml'),
    dom_id: `#${containerId}`,
    deepLinking: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    persistAuthorization: true,
    defaultModelsExpandDepth: 1
  })
})
</script>

<template>
  <div :id="containerId" />
</template>
