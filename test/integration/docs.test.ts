import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app'

describe('documentation endpoints', () => {
  it('serves raw openapi yaml', async () => {
    const app = createApp()
    const response = await request(app).get('/openapi.yaml')

    expect(response.status).toBe(200)
    expect(response.text).toContain('openapi: 3.0.3')
    expect(response.headers['content-type']).toContain('application/yaml')
  })

  it('serves docs ui html', async () => {
    const app = createApp()
    const response = await request(app).get('/docs')

    expect(response.status).toBe(200)
    expect(response.text).toContain('<redoc')
    expect(response.text).toContain('/openapi.yaml')
    expect(response.headers['content-type']).toContain('text/html')
  })

  it('serves metrics endpoint', async () => {
    const app = createApp()
    const response = await request(app).get('/metrics')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('text/plain')
    expect(response.text).toContain('clauditorium_http_requests_total')
  })
})
