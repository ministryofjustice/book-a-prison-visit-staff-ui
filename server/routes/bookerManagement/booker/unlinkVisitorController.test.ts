import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, flashProvider, user } from '../../testutils/appSetup'
import { createMockAuditService, createMockBookerService } from '../../../services/testutils/mocks'
import bapvUserRoles from '../../../constants/bapvUserRoles'
import TestData from '../../testutils/testData'
import { MoJAlert } from '../../../@types/bapv'

let app: Express

const auditService = createMockAuditService()
const bookerService = createMockBookerService()

const booker = TestData.bookerDetailedInfo()
const { reference } = booker
const bookerPrisonerId = booker.permittedPrisoners[0].prisoner.prisonerNumber
const bookerVisitorId = booker.permittedPrisoners[0].permittedVisitors[0].visitorId

let url: string
const buildUrl = (prisonerId: string, visitorId: number) =>
  `/manage-bookers/${reference}/prisoner/${prisonerId}/visitor/${visitorId}/unlink`

const bookerDetailsUrl = `/manage-bookers/${booker.reference}/booker-details`

beforeEach(() => {
  url = buildUrl(bookerPrisonerId, bookerVisitorId)

  bookerService.getBookerDetails.mockResolvedValue(booker)

  app = appWithAllRoutes({
    services: { auditService, bookerService },
    userSupplier: () => ({ ...user, userRoles: [bapvUserRoles.BOOKER_ADMIN] }),
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Booker management - unlink a visitor from a booker account', () => {
  describe('POST /manage-bookers/:reference/prisoner/:prisonerId/visitor/:visitorId/unlink', () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).post(url).expect(302).expect('location', '/authError')
    })

    it('should unlink visitor, send audit, set success message and redirect to booker details page', () => {
      bookerService.unlinkBookerVisitor.mockResolvedValue()

      return request(app)
        .post(url)
        .expect(302)
        .expect('location', bookerDetailsUrl)
        .expect(() => {
          expect(bookerService.getBookerDetails).toHaveBeenCalledWith({ username: 'user1', reference })
          expect(bookerService.unlinkBookerVisitor).toHaveBeenCalledWith({
            username: 'user1',
            reference,
            prisonerId: bookerPrisonerId,
            visitorId: bookerVisitorId,
          })

          expect(flashProvider).toHaveBeenCalledWith('messages', <MoJAlert>{
            variant: 'success',
            title: 'Jeanette Smith has been unlinked from this booker.',
            text: '',
            dismissible: true,
          })

          expect(auditService.unlinkedBookerVisitor).toHaveBeenCalledWith({
            reference,
            prisonerId: bookerPrisonerId,
            visitorId: bookerVisitorId.toString(),
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    describe('should handle invalid data by redirecting to booker details page', () => {
      it.each([
        ['prisonerId not on booker account', 'B3456CD', bookerVisitorId],
        ['visitorId not on booker account', bookerPrisonerId, 999],
        ['invalid prisonerId', 'INVALID', bookerVisitorId],
        ['invalid visitorId', bookerPrisonerId, 'INVALID'],
      ])('%s', (_: string, testPrisonerId: string, testVisitorId: number) => {
        url = buildUrl(testPrisonerId, testVisitorId)
        return request(app)
          .post(url)
          .expect(302)
          .expect('location', bookerDetailsUrl)
          .expect(() => {
            expect(bookerService.unlinkBookerVisitor).not.toHaveBeenCalled()
            expect(flashProvider).not.toHaveBeenCalled()
            expect(auditService.unlinkedBookerVisitor).not.toHaveBeenCalled()
          })
      })
    })
  })
})
