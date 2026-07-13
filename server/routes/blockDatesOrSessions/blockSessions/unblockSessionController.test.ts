import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, flashProvider } from '../../testutils/appSetup'
import {
  createMockAuditService,
  createMockBlockDatesOrSessionsService,
  createMockVisitSessionsService,
} from '../../../services/testutils/mocks'
import TestData from '../../testutils/testData'

let app: Express

const auditService = createMockAuditService()
const blockDatesOrSessionsService = createMockBlockDatesOrSessionsService()
const visitSessionsService = createMockVisitSessionsService()

const url = '/block-visit-dates/unblock-session'
const unblockDate = '2024-09-06'
const session = TestData.sessionSchedule()

beforeEach(() => {
  app = appWithAllRoutes({ services: { auditService, blockDatesOrSessionsService, visitSessionsService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Unblock visit session', () => {
  describe(`POST ${url}`, () => {
    it('should unblock the session on date, set success message and redirect to blocked dates and sessions listing page', () => {
      blockDatesOrSessionsService.unblockVisitSession.mockResolvedValue()
      visitSessionsService.getSessionSchedule.mockResolvedValue([session])

      return request(app)
        .post(url)
        .send({ date: unblockDate, sessionTemplateReference: session.sessionTemplateReference })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockDatesOrSessionsService.unblockVisitSession).toHaveBeenCalledWith({
            sessionTemplateReference: session.sessionTemplateReference,
            date: unblockDate,
            username: 'user1',
          })
          expect(auditService.unblockedVisitSession).toHaveBeenCalledWith({
            date: unblockDate,
            sessionReference: session.sessionTemplateReference,
            username: 'user1',
            operationId: undefined,
          })
          expect(flashProvider).toHaveBeenCalledWith('messages', {
            variant: 'success',
            title: 'Visit session unblocked for date',
            html: 'Visits are unblocked on Friday 6 September 2024 for 1:45pm to 3:45pm,<br>All prisoners',
          })
          expect(flashProvider).toHaveBeenCalledTimes(1)
        })
    })

    it('should reject invalid details and redirect to blocked dates and sessions listing page', () => {
      return request(app)
        .post(url)
        .send({ date: 'invalid' })
        .expect(302)
        .expect('location', '/block-visit-dates')
        .expect(() => {
          expect(blockDatesOrSessionsService.unblockVisitSession).not.toHaveBeenCalled()
          expect(auditService.unblockedVisitSession).not.toHaveBeenCalled()
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })
  })
})
