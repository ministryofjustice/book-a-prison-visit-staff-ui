import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes } from '../testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('(NEW) Visit details page', () => {
  describe('GET /visit-new/:reference', () => {
    const visitReference = 'ab-cd-ef-gh'

    it('should render the visit details page for a valid visit reference', () => {
      return request(app)
        .get(`/visit-new/${visitReference}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
        })
    })
  })
})
