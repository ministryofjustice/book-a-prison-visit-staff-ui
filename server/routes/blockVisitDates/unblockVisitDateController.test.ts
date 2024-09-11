import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { createMockAuditService, createMockBlockedDatesService } from '../../services/testutils/mocks'
import config from '../../config'
import { FlashData } from '../../@types/bapv'

let app: Express

const auditService = createMockAuditService()
const blockedDatesService = createMockBlockedDatesService()

const url = '/block-visit-dates/unblock-date'
const unblockDate = '2024-09-06'

beforeEach(() => {
  jest.replaceProperty(config, 'features', { sessionManagement: true })

  app = appWithAllRoutes({ services: { auditService, blockedDatesService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Feature flag', () => {
  it('should return a 404 if feature not enabled', () => {
    jest.replaceProperty(config, 'features', { sessionManagement: false })
    app = appWithAllRoutes({})
    return request(app).get(url).expect(404)
  })
})

describe('Unblock visit date', () => {
  describe(`POST ${url}`, () => {
    let flashData: FlashData

    beforeEach(() => {
      flashData = { errors: [], formValues: [] }
      flashProvider.mockImplementation((key: keyof FlashData) => {
        return flashData[key]
      })
    })

    it('should unblock the date, set success message and redirect to blocked dates listing page', () => {
      blockedDatesService.unblockVisitDate.mockResolvedValue()
      const unblockedDateSuccessMessage = 'Visits are unblocked for Friday 6 September 2024.'

      return request(app)
        .post(url)
        .send({ date: unblockDate })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockedDatesService.unblockVisitDate).toHaveBeenCalledWith('user1', 'HEI', unblockDate)
          expect(auditService.unblockedVisitDate).toHaveBeenCalledWith({
            prisonId: 'HEI',
            date: unblockDate,
            username: 'user1',
            operationId: undefined,
          })
          expect(flashProvider).toHaveBeenCalledWith('message', unblockedDateSuccessMessage)
          expect(flashProvider).toHaveBeenCalledTimes(1)
        })
    })

    it('should reject invalid date and redirect to blocked dates listing page', () => {
      return request(app)
        .post(url)
        .send({ date: 'invalid' })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockedDatesService.unblockVisitDate).not.toHaveBeenCalled()
          expect(auditService.unblockedVisitDate).not.toHaveBeenCalled()
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })
  })
})
