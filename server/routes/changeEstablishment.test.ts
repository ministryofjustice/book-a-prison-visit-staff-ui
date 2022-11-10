import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import config from '../config'
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
    config.features.establishmentSwitcherEnabled = true
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
    config.features.establishmentSwitcherEnabled = true
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

  it('should not render select establishment page, when feature flag disabled', () => {
    config.features.establishmentSwitcherEnabled = false
    app = appWithAllRoutes({
      supportedPrisonsServiceOverride: supportedPrisonsService,
      systemTokenOverride: systemToken,
    })

    return request(app)
      .get('/change-establishment')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Error')
        expect($('input[name="establishment"]').length).toBe(0)
      })
  })
})

describe('POST /change-establishment', () => {
  config.features.establishmentSwitcherEnabled = true

  app = appWithAllRoutes({
    supportedPrisonsServiceOverride: supportedPrisonsService,
    systemTokenOverride: systemToken,
  })

  it('should set validation errors if no establishment selected', () => {
    jest.spyOn(visitorUtils, 'clearSession')

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

    return request(app)
      .post(`/change-establishment`)
      .send('establishment=HEI')
      .expect(302)
      .expect('location', `/`)
      .expect(() => {
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
      })
  })
})
