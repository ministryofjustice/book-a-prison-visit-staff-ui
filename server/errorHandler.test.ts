import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { getFrontendComponents } from '@ministryofjustice/hmpps-connect-dps-components'
import { appWithAllRoutes } from './routes/testutils/appSetup'

jest.mock('@ministryofjustice/hmpps-connect-dps-components', () => ({
  getFrontendComponents: jest.fn().mockReturnValue((req: unknown, res: unknown, next: () => void) => next()),
}))

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('GET 404', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('If you typed the web address, check it is correct.')
        expect(res.text).toContain('If you pasted the web address, check you copied the entire address.')
        expect($('[data-test="back-to-start"]').attr('href')).toBe('/back-to-start')
        expect(res.text).toContain('NotFoundError: Not Found')
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('If you typed the web address, check it is correct.')
        expect(res.text).toContain('If you pasted the web address, check you copied the entire address.')
        expect($('[data-test="back-to-start"]').attr('href')).toBe('/back-to-start')
        expect(res.text).not.toContain('NotFoundError: Not Found')
      })
  })
})

describe('Load DPS components on failed POST requests only', () => {
  it('should load DPS components on failed POST request', () => {
    return request(app)
      .post('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('NotFoundError: Not Found')

        expect(getFrontendComponents).toHaveBeenCalled()
      })
  })

  it('should NOT load DPS components on failed GET request', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Page not found')
        expect(res.text).toContain('NotFoundError: Not Found')

        expect(getFrontendComponents).not.toHaveBeenCalled()
      })
  })
})
