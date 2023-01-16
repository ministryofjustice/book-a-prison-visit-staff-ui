import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from './routes/testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('NotFoundError: Not found')
        expect(res.text).not.toContain(
          'The page you were looking for could not be found. Please check the address and try again.',
        )
      })
  })

  it('should render content without stack in production mode', () => {
    const systemToken = async (user: string): Promise<string> => `${user}-token-1`

    return request(appWithAllRoutes({ systemTokenOverride: systemToken, production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('If you typed the web address, check it is correct.')
        expect(res.text).toContain('If you pasted the web address, check you copied the entire address.')
        expect(res.text).not.toContain('NotFoundError: Not found')
        expect($('[data-test="go-to-home"]').attr('href')).toBe('/')
      })
  })
})
