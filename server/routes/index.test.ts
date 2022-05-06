import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage prison visits')
        expect(res.text).toContain('Book a visit')
        expect(res.text).toContain('Cancel a visit')
        expect(res.text).toContain('View visits by date')
      })
  })
})
