import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { appWithAllRoutes, user } from './testutils/appSetup'
import TestData from './testutils/testData'
import { createMockSupportedPrisonsService } from '../services/testutils/mocks'

let app: Express

const supportedPrisonsService = createMockSupportedPrisonsService()

afterEach(() => {
  jest.resetAllMocks()
})

describe('Establishment not supported page', () => {
  it('should render the establishment not supported page when active case load is present and unsupported', () => {
    const unsupportedCaseLoad = TestData.caseLoad({ caseLoadId: 'XYZ', description: 'XYZ (HMP)' })
    supportedPrisonsService.isSupportedPrison.mockResolvedValue(false)

    app = appWithAllRoutes({
      userSupplier: () => ({ ...user, activeCaseLoadId: 'XYZ' }),
      services: { supportedPrisonsService },
      feComponents: {
        sharedData: {
          activeCaseLoad: unsupportedCaseLoad,
          caseLoads: [unsupportedCaseLoad],
          services: [],
          allocationJobResponsibilities: [],
        },
      },
    })

    return request(app)
      .get('/establishment-not-supported')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('XYZ (HMP) does not use this service')
        expect($('.govuk-back-link').length).toBeFalsy()
        expect(supportedPrisonsService.isSupportedPrison).toHaveBeenCalledWith('user1', 'XYZ')
      })
  })

  it('should redirect back to home page if feComponents activeCaseLoad is not set', () => {
    app = appWithAllRoutes({ services: { supportedPrisonsService } })

    return request(app)
      .get('/establishment-not-supported')
      .expect(302)
      .expect('location', '/')
      .expect(() => {
        expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      })
  })

  it('should redirect back to home page if feComponents activeCaseLoad is a supported prison', () => {
    const caseLoad = TestData.caseLoad()
    supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)

    app = appWithAllRoutes({
      services: { supportedPrisonsService },
      feComponents: {
        sharedData: {
          activeCaseLoad: caseLoad,
          caseLoads: [caseLoad],
          services: [],
          allocationJobResponsibilities: [],
        },
      },
    })

    return request(app)
      .get('/establishment-not-supported')
      .expect(302)
      .expect('location', '/')
      .expect(() => {
        expect(supportedPrisonsService.isSupportedPrison).toHaveBeenCalledWith('user1', 'HEI')
      })
  })
})
