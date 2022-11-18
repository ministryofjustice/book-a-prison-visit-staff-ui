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
  config.features.establishmentSwitcherEnabled = true
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
      .get('/change-establishment?referrer=/search/prisoner/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Select establishment')
        expect($('input[name="establishment"]').eq(0).prop('value')).toBe('HEI')
        expect($('input[name="establishment"]').eq(0).prop('checked')).toBe(true)
        expect($('input[name="establishment"]').eq(1).prop('value')).toBe('BLI')
        expect($('input[name="establishment"]').length).toBe(2)
        expect($('form').attr('action')).toBe('/change-establishment?referrer=/search/prisoner/')
      })
  })

  it('shouldnt set form action to be non-relative link when passed incorrectly', () => {
    app = appWithAllRoutes({
      supportedPrisonsServiceOverride: supportedPrisonsService,
      systemTokenOverride: systemToken,
    })

    return request(app)
      .get('/change-establishment?referrer=//search/prisoner/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('Select establishment')
        expect($('form').attr('action')).toBe('/change-establishment?referrer=/')
      })
  })

  it('should render select establishment page, with current establishment selected', () => {
    app = appWithAllRoutes({
      supportedPrisonsServiceOverride: supportedPrisonsService,
      systemTokenOverride: systemToken,
      sessionData: { selectedEstablishment: supportedPrisons[1] } as SessionData,
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
        expect($('form').attr('action')).toBe('/change-establishment?referrer=/')
      })
  })

  it('should not render select establishment page, when feature flag disabled', () => {
    config.features.establishmentSwitcherEnabled = false
    app = appWithAllRoutes({
      supportedPrisonsServiceOverride: supportedPrisonsService,
      systemTokenOverride: systemToken,
    })

    return request(app).get('/change-establishment').expect(404)
  })
})

describe('POST /change-establishment', () => {
  let sessionData: SessionData

  beforeEach(() => {
    jest.spyOn(visitorUtils, 'clearSession')
    sessionData = { selectedEstablishment: supportedPrisons[1] } as SessionData

    app = appWithAllRoutes({
      supportedPrisonsServiceOverride: supportedPrisonsService,
      systemTokenOverride: systemToken,
      sessionData,
    })
  })

  it('should set validation errors if no establishment selected', () => {
    return request(app)
      .post(`/change-establishment`)
      .send('establishment=')
      .expect(302)
      .expect('location', `/change-establishment`)
      .expect(() => {
        expect(sessionData.selectedEstablishment).toStrictEqual(supportedPrisons[1])
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No prison selected', param: 'establishment', value: '' },
        ])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(0)
      })
  })

  it('should set validation errors if invalid establishment selected', () => {
    return request(app)
      .post(`/change-establishment`)
      .send('establishment=HEX')
      .expect(302)
      .expect('location', `/change-establishment`)
      .expect(() => {
        expect(sessionData.selectedEstablishment).toStrictEqual(supportedPrisons[1])
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No prison selected', param: 'establishment', value: 'HEX' },
        ])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(0)
      })
  })

  it('should clear session, set selected establishment and redirect to home page', () => {
    return request(app)
      .post(`/change-establishment`)
      .send('establishment=HEI')
      .expect(302)
      .expect('location', `/`)
      .expect(() => {
        expect(sessionData.selectedEstablishment).toStrictEqual(supportedPrisons[0])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
      })
  })

  it('should clear session, set selected establishment and redirect to / not the set referrer', () => {
    return request(app)
      .post(`/change-establishment?referrer=//search/prisoner/`)
      .send('establishment=HEI')
      .expect(302)
      .expect('location', `/`)
      .expect(() => {
        expect(sessionData.selectedEstablishment).toStrictEqual(supportedPrisons[0])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
      })
  })

  it('should redirect to valid page when passed in querystring', () => {
    return request(app)
      .post(`/change-establishment?referrer=/search/prisoner/`)
      .send('establishment=HEI')
      .expect(302)
      .expect('location', `/search/prisoner/`)
      .expect(() => {
        expect(sessionData.selectedEstablishment).toStrictEqual(supportedPrisons[0])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
      })
  })

  it('should not post if feature flag is disabled', () => {
    config.features.establishmentSwitcherEnabled = false

    return request(app).post(`/change-establishment`).send('establishment=HEI').expect(404)
  })
})
