import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import * as visitorUtils from './visitorUtils'
import SupportedPrisonsService from '../services/supportedPrisonsService'

jest.mock('../services/supportedPrisonsService')

let app: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`

const supportedPrisonsService = new SupportedPrisonsService(null, systemToken) as jest.Mocked<SupportedPrisonsService>

const supportedPrisons = [
  { prisonId: 'HEI', prisonName: 'Hewell (HMP)' },
  { prisonId: 'BLI', prisonName: 'Bristol (HMP)' },
]

beforeEach(() => {
  supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /change-establishment', () => {
  it('should render select establishment page, with default establishment selected', () => {
    app = appWithAllRoutes({
      supportedPrisonsServiceOverride: supportedPrisonsService,
      systemTokenOverride: systemToken,
    })

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
      supportedPrisonsServiceOverride: supportedPrisonsService,
      systemTokenOverride: systemToken,
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

describe.skip('POST /change-establishment', () => {
  it('should set validation errors if no establishment selected', () => {
    jest.spyOn(visitorUtils, 'clearSession')
    const sessionData = {
      sessionData: { selectedEstablishment: { prisonId: 'BLI', prisonName: 'Bristol (HMP)' } } as SessionData,
    }
    app = appWithAllRoutes(sessionData)
    return request(app)
      .post(`/change-establishment`)
      .send('establishment=')
      .expect(302)
      .expect('location', `/change-establishment`)
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No prison selected', param: 'establishment', value: '' },
        ])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(0)
      })
  })

  it('should set validation errors if invalid establishment selected', () => {
    jest.spyOn(visitorUtils, 'clearSession')
    const sessionData = {
      sessionData: { selectedEstablishment: { prisonId: 'BLI', prisonName: 'Bristol (HMP)' } } as SessionData,
    }
    app = appWithAllRoutes(sessionData)
    return request(app)
      .post(`/change-establishment`)
      .send('establishment=HEX')
      .expect(302)
      .expect('location', `/change-establishment`)
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No prison selected', param: 'establishment', value: 'HEX' },
        ])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(0)
      })
  })

  it('should clear session, set selected establishment and redirect to home page', () => {
    jest.spyOn(visitorUtils, 'clearSession')
    const sessionData = {
      sessionData: { selectedEstablishment: { prisonId: 'BLI', prisonName: 'Bristol (HMP)' } } as SessionData,
    }

    app = appWithAllRoutes(sessionData)
    return request(app)
      .post(`/change-establishment`)
      .send('establishment=HEI')
      .expect(302)
      .expect('location', `/`)
      .expect(() => {
        // expect(sessionData).toBe('')
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
      })
  })
})
