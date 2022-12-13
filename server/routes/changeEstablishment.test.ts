import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import config from '../config'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import * as visitorUtils from './visitorUtils'
import SupportedPrisonsService from '../services/supportedPrisonsService'
import AuditService from '../services/auditService'
import { createSupportedPrisons } from '../data/__testutils/testObjects'
import { Prison } from '../@types/bapv'

jest.mock('../services/supportedPrisonsService')
jest.mock('../services/auditService')

let app: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`

const supportedPrisonsService = new SupportedPrisonsService(
  null,
  null,
  systemToken,
) as jest.Mocked<SupportedPrisonsService>

const supportedPrisons = createSupportedPrisons()

const auditService = new AuditService() as jest.Mocked<AuditService>

beforeEach(() => {
  supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)
  config.features.establishmentSwitcherEnabled = true
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /change-establishment', () => {
  it('should render select establishment page with none selected', () => {
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
        expect($('input[name="establishment"]').eq(0).prop('checked')).toBe(false)
        expect($('input[name="establishment"]').eq(1).prop('value')).toBe('BLI')
        expect($('input[name="establishment"]').eq(1).prop('checked')).toBe(false)
        expect($('input[name="establishment"]').length).toBe(2)
        expect($('form').attr('action')).toBe('/change-establishment?referrer=/search/prisoner/')
      })
  })

  it('should not set form action to be non-relative link when passed incorrectly', () => {
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
      sessionData: {
        selectedEstablishment: { prisonId: 'BLI', prisonName: supportedPrisons.BLI },
      } as SessionData,
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
  let selectedEstablishment: Prison

  beforeEach(() => {
    jest.spyOn(visitorUtils, 'clearSession')

    selectedEstablishment = { prisonId: 'BLI', prisonName: supportedPrisons.BLI }
    sessionData = { selectedEstablishment } as SessionData

    app = appWithAllRoutes({
      supportedPrisonsServiceOverride: supportedPrisonsService,
      auditServiceOverride: auditService,
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
        expect(sessionData.selectedEstablishment).toStrictEqual(selectedEstablishment)
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No prison selected', param: 'establishment', value: '' },
        ])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(0)
        expect(auditService.changeEstablishment).toHaveBeenCalledTimes(0)
      })
  })

  it('should set validation errors if invalid establishment selected', () => {
    return request(app)
      .post(`/change-establishment`)
      .send('establishment=HEX')
      .expect(302)
      .expect('location', `/change-establishment`)
      .expect(() => {
        expect(sessionData.selectedEstablishment).toStrictEqual(selectedEstablishment)
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No prison selected', param: 'establishment', value: 'HEX' },
        ])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(0)
        expect(auditService.changeEstablishment).toHaveBeenCalledTimes(0)
      })
  })

  it('should clear session, set selected establishment and redirect to home page', () => {
    const newEstablishment: Prison = { prisonId: 'HEI', prisonName: supportedPrisons.HEI }

    return request(app)
      .post(`/change-establishment`)
      .send('establishment=HEI')
      .expect(302)
      .expect('location', `/`)
      .expect(() => {
        expect(sessionData.selectedEstablishment).toStrictEqual(newEstablishment)
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
        expect(auditService.changeEstablishment).toHaveBeenCalledWith({
          previousEstablishment: 'BLI',
          newEstablishment: 'HEI',
          username: 'user1',
          operationId: undefined,
        })
        // @TODO should also check setActiveCaseLoad is called (awaiting VB-1430)
      })
  })

  it('should clear session, set selected establishment and redirect to / not the set referrer', () => {
    const newEstablishment: Prison = { prisonId: 'HEI', prisonName: supportedPrisons.HEI }

    return request(app)
      .post(`/change-establishment?referrer=//search/prisoner/`)
      .send('establishment=HEI')
      .expect(302)
      .expect('location', `/`)
      .expect(() => {
        expect(sessionData.selectedEstablishment).toStrictEqual(newEstablishment)
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
        expect(auditService.changeEstablishment).toHaveBeenCalledTimes(1)
      })
    // @TODO should also check setActiveCaseLoad is called (awaiting VB-1430)
  })

  it('should redirect to valid page when passed in querystring', () => {
    const newEstablishment: Prison = { prisonId: 'HEI', prisonName: supportedPrisons.HEI }

    return request(app)
      .post(`/change-establishment?referrer=/search/prisoner/`)
      .send('establishment=HEI')
      .expect(302)
      .expect('location', `/search/prisoner/`)
      .expect(() => {
        expect(sessionData.selectedEstablishment).toStrictEqual(newEstablishment)
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(1)
        expect(auditService.changeEstablishment).toHaveBeenCalledTimes(1)
      })
  })

  it('should not post if feature flag is disabled', () => {
    config.features.establishmentSwitcherEnabled = false

    return request(app).post(`/change-establishment`).send('establishment=HEI').expect(404)
  })
})
