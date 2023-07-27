import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import * as visitorUtils from './visitorUtils'
import TestData from './testutils/testData'
import { Prison } from '../@types/bapv'
import config from '../config'
import {
  createMockAuditService,
  createMockSupportedPrisonsService,
  createMockUserService,
} from '../services/testutils/mocks'

let app: Express

const auditService = createMockAuditService()
const userService = createMockUserService()
const supportedPrisonsService = createMockSupportedPrisonsService()

const supportedPrisons = TestData.supportedPrisons()

beforeEach(() => {
  supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)

  app = appWithAllRoutes({ services: { supportedPrisonsService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /change-establishment', () => {
  it('should render select establishment page with none selected', () => {
    return request(app)
      .get('/change-establishment?referrer=/search/prisoner/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select establishment')
        expect($('input[name="establishment"]').eq(0).prop('value')).toBe('BLI')
        expect($('input[name="establishment"]').eq(0).prop('checked')).toBe(false)
        expect($('input[name="establishment"]').eq(1).prop('value')).toBe('HEI')
        expect($('input[name="establishment"]').eq(1).prop('checked')).toBe(false)
        expect($('input[name="establishment"]').length).toBe(2)
        expect($('form').attr('action')).toBe('/change-establishment?referrer=/search/prisoner/')
      })
  })

  it('should render establishments sorted by prison name', () => {
    const supportedPrisonsUnsorted = {
      CFI: 'Cardiff (HMP & YOI)',
      BNI: 'Bullingdon (HMP & YOI)',
      BSI: 'Brinsford (HMP & YOI)',
      BLI: 'Bristol (HMP & YOI)',
    }
    supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisonsUnsorted)
    userService.getUserCaseLoadIds.mockResolvedValue(Object.keys(supportedPrisonsUnsorted))
    app = appWithAllRoutes({ services: { supportedPrisonsService, userService } })

    return request(app)
      .get('/change-establishment')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select establishment')

        expect($('input[name="establishment"]').eq(0).prop('value')).toBe('BSI')
        expect($('input[name="establishment"] + label').eq(0).text().trim()).toBe('Brinsford (HMP & YOI)')

        expect($('input[name="establishment"]').eq(1).prop('value')).toBe('BLI')
        expect($('input[name="establishment"] + label').eq(1).text().trim()).toBe('Bristol (HMP & YOI)')

        expect($('input[name="establishment"]').eq(2).prop('value')).toBe('BNI')
        expect($('input[name="establishment"] + label').eq(2).text().trim()).toBe('Bullingdon (HMP & YOI)')

        expect($('input[name="establishment"]').eq(3).prop('value')).toBe('CFI')
        expect($('input[name="establishment"] + label').eq(3).text().trim()).toBe('Cardiff (HMP & YOI)')
      })
  })

  it('should not set form action to be non-relative link when passed incorrectly', () => {
    return request(app)
      .get('/change-establishment?referrer=//search/prisoner/')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select establishment')
        expect($('form').attr('action')).toBe('/change-establishment?referrer=/')
      })
  })

  it('should render select establishment page, with current establishment selected', () => {
    app = appWithAllRoutes({
      services: { supportedPrisonsService },
      sessionData: {
        selectedEstablishment: { prisonId: 'BLI', prisonName: supportedPrisons.BLI },
      } as SessionData,
    })

    return request(app)
      .get('/change-establishment')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select establishment')
        expect($('input[name="establishment"]').eq(0).prop('value')).toBe('BLI')
        expect($('input[name="establishment"]').eq(0).prop('checked')).toBe(true)
        expect($('input[name="establishment"]').eq(1).prop('value')).toBe('HEI')
        expect($('input[name="establishment"]').length).toBe(2)
        expect($('form').attr('action')).toBe('/change-establishment?referrer=/')
      })
  })

  it('should inform user if they have no available prisons in their caseload and link back to DPS', () => {
    userService.getUserCaseLoadIds.mockResolvedValue(['UNSUPPORTED', 'PRISONS'])

    app = appWithAllRoutes({ services: { supportedPrisonsService, userService } })

    return request(app)
      .get('/change-establishment')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('You do not have access to an establishment that uses this service')
        expect($('form').length).toBe(0)
        expect($('[data-test="go-to-dps"]').attr('href')).toBe(config.dpsHome)
      })
  })
})

describe('POST /change-establishment', () => {
  let sessionData: SessionData
  let selectedEstablishment: Prison

  beforeEach(() => {
    jest.spyOn(visitorUtils, 'clearSession')

    selectedEstablishment = { prisonId: 'BLI', prisonName: supportedPrisons.BLI }
    sessionData = { selectedEstablishment } as SessionData
    userService.getUserCaseLoadIds.mockResolvedValue(TestData.supportedPrisonIds())

    app = appWithAllRoutes({
      services: { auditService, supportedPrisonsService, userService },
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
          { location: 'body', msg: 'No prison selected', path: 'establishment', type: 'field', value: '' },
        ])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(0)
        expect(auditService.changeEstablishment).toHaveBeenCalledTimes(0)
        expect(userService.setActiveCaseLoad).not.toHaveBeenCalled()
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
          { location: 'body', msg: 'No prison selected', path: 'establishment', type: 'field', value: 'HEX' },
        ])
        expect(visitorUtils.clearSession).toHaveBeenCalledTimes(0)
        expect(auditService.changeEstablishment).toHaveBeenCalledTimes(0)
        expect(userService.setActiveCaseLoad).not.toHaveBeenCalled()
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
        expect(userService.setActiveCaseLoad).toHaveBeenCalledWith('HEI', 'user1')
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
        expect(userService.setActiveCaseLoad).toHaveBeenCalledWith('HEI', 'user1')
      })
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
        expect(userService.setActiveCaseLoad).toHaveBeenCalledWith('HEI', 'user1')
      })
  })
})
