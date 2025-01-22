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
  const url = '/visit-new'
  const visitReference = 'ab-cd-ef-gh'

  describe('GET /visit-new/:reference', () => {
    it('should render the visit details page for a valid visit reference', () => {
      return request(app)
        .get(`${url}/${visitReference}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text()).toBe('Visit booking details')
        })
    })

    it('should reject an invalid visit reference', () => {
      return request(app).get(`${url}/NOT-A-VISIT-REFERENCE`).expect(400)
    })
  })
})
