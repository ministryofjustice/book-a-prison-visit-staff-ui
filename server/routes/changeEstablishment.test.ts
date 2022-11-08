import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from './testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

// const enabledPrisons = [
//   { prisonId: 'HEI', prisonName: 'Hewell (HMP)' },
//   { prisonId: 'BLI', prisonName: 'Bristol (HMP)' },
// ]

// const selectedEstablishment = {
//   name: 'Bristol (HMP)',
//   prisonId: 'BLI',
// }

describe('GET /change-establishment', () => {
  it('should render select establishment page, with default establishment selected', () => {
    app = appWithAllRoutes({})

    return request(app)
      .get('/change-establishment')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Select establishment')
        expect($('input[name="establishment"]').eq(0).prop('value')).toBe('HEI')
        expect($('input[name="establishment"]').eq(0).prop('checked')).toBe(true)
        expect($('input[name="establishment"]').eq(1).prop('value')).toBe('BLI')
        expect($('input[name="establishment"]').length).toBe(2)
      })
  })

  it('should render select establishment page, with current establishment selected', () => {
    app = appWithAllRoutes({
      sessionData: { selectedEstablishment: { prisonId: 'BLI', prisonName: 'Bristol (HMP)' } } as SessionData,
    })

    return request(app)
      .get('/change-establishment')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Select establishment')
        expect($('input[name="establishment"]').eq(0).prop('value')).toBe('HEI')
        expect($('input[name="establishment"]').eq(1).prop('value')).toBe('BLI')
        expect($('input[name="establishment"]').eq(1).prop('checked')).toBe(true)
        expect($('input[name="establishment"]').length).toBe(2)
      })
  })
})
