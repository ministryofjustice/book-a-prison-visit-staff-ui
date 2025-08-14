import type { Express } from 'express'
import request from 'supertest'
import { BadRequest, InternalServerError } from 'http-errors'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import TestData from '../testutils/testData'
import { createMockVisitRequestsService, createMockVisitService } from '../../services/testutils/mocks'
import { VisitBookingDetails } from '../../data/orchestrationApiTypes'

let app: Express

const visitRequestsService = createMockVisitRequestsService()
const visitService = createMockVisitService()

let visitDetails: VisitBookingDetails
const visitRequestResponse = TestData.visitRequestResponse()

beforeEach(() => {
  visitDetails = TestData.visitBookingDetails()

  visitRequestsService.approveVisitRequest.mockResolvedValue(visitRequestResponse)
  visitRequestsService.rejectVisitRequest.mockResolvedValue(visitRequestResponse)

  visitService.getVisitDetailed.mockResolvedValue(visitDetails)

  app = appWithAllRoutes({ services: { visitRequestsService, visitService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Process a visit request (approve / reject)', () => {
  describe('POST /visit/:reference/request/approve', () => {
    it('should approve visit request, set success message and redirect to requests listing page', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/request/approve')
        .expect(302)
        .expect('location', '/requested-visits')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('messages', {
            variant: 'success',
            title: 'You approved the request and booked the visit with John Smith',
            showTitleAsHeading: true,
            html: 'The main contact has been notified. You can <a href="/visit/ab-cd-ef-gh">view this visit again</a>.',
          })

          expect(visitRequestsService.approveVisitRequest).toHaveBeenCalledWith('user1', visitDetails.reference)
          expect(visitRequestsService.rejectVisitRequest).not.toHaveBeenCalled()
          expect(visitService.getVisitDetailed).not.toHaveBeenCalled()
        })
    })

    it('should approve visit request, set success message and redirect to visits page when coming from visits page', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/request/approve')
        .send({ fromVisits: 'true' })
        .expect(302)
        .expect('location', '/visits')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('messages', {
            variant: 'success',
            title: 'You approved the request and booked the visit with John Smith',
            showTitleAsHeading: true,
            html: 'The main contact has been notified. You can <a href="/visit/ab-cd-ef-gh">view this visit again</a>.',
          })

          expect(visitRequestsService.approveVisitRequest).toHaveBeenCalledWith('user1', visitDetails.reference)
          expect(visitRequestsService.rejectVisitRequest).not.toHaveBeenCalled()
          expect(visitService.getVisitDetailed).not.toHaveBeenCalled()
        })
    })

    it('should handle 400 Bad Request from API, set failure message and redirect to requests listing page', () => {
      visitDetails.visitSubStatus = 'APPROVED'
      visitRequestsService.approveVisitRequest.mockRejectedValue(new BadRequest())

      return request(app)
        .post('/visit/ab-cd-ef-gh/request/approve')
        .expect(302)
        .expect('location', '/requested-visits')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('messages', {
            variant: 'information',
            title: 'The visit to John Smith has already been approved',
            showTitleAsHeading: true,
            html: 'The main contact has been notified. You can <a href="/visit/ab-cd-ef-gh">view this visit again</a>.',
          })

          expect(visitRequestsService.approveVisitRequest).toHaveBeenCalledWith('user1', visitDetails.reference)
          expect(visitRequestsService.rejectVisitRequest).not.toHaveBeenCalled()
          expect(visitService.getVisitDetailed).toHaveBeenCalledWith({
            username: 'user1',
            reference: visitDetails.reference,
          })
        })
    })

    it('should handle 400 Bad Request from API, set failure message and redirect to visits page when coming from visits page', () => {
      visitDetails.visitSubStatus = 'APPROVED'
      visitRequestsService.approveVisitRequest.mockRejectedValue(new BadRequest())

      return request(app)
        .post('/visit/ab-cd-ef-gh/request/approve')
        .send({ fromVisits: 'true' })
        .expect(302)
        .expect('location', '/visits')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('messages', {
            variant: 'information',
            title: 'The visit to John Smith has already been approved',
            showTitleAsHeading: true,
            html: 'The main contact has been notified. You can <a href="/visit/ab-cd-ef-gh">view this visit again</a>.',
          })

          expect(visitRequestsService.approveVisitRequest).toHaveBeenCalledWith('user1', visitDetails.reference)
          expect(visitRequestsService.rejectVisitRequest).not.toHaveBeenCalled()
          expect(visitService.getVisitDetailed).toHaveBeenCalledWith({
            username: 'user1',
            reference: visitDetails.reference,
          })
        })
    })

    it('should propagate other API errors', () => {
      visitRequestsService.approveVisitRequest.mockRejectedValue(new InternalServerError())
      return request(app).post('/visit/ab-cd-ef-gh/request/approve').expect(500)
    })

    it('should return 400 Bad Request error for invalid visit reference', () => {
      return request(app).post('/visit/12-34-56-78/request/approve/update').expect(400)
    })
  })

  describe('POST /visit/:reference/request/reject', () => {
    it('should reject visit request, set success message and redirect to requests listing page', () => {
      return request(app)
        .post('/visit/ab-cd-ef-gh/request/reject')
        .expect(302)
        .expect('location', '/requested-visits')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('messages', {
            variant: 'success',
            title: 'You rejected the request to visit John Smith',
            showTitleAsHeading: true,
            html: 'The main contact has been notified. You can <a href="/visit/ab-cd-ef-gh">view this visit again</a>.',
          })

          expect(visitRequestsService.approveVisitRequest).not.toHaveBeenCalled()
          expect(visitRequestsService.rejectVisitRequest).toHaveBeenCalledWith('user1', visitDetails.reference)
          expect(visitService.getVisitDetailed).not.toHaveBeenCalled()
        })
    })

    it('should handle 400 Bad Request from API, set failure message and redirect to requests listing page', () => {
      visitDetails.visitSubStatus = 'REJECTED'
      visitRequestsService.rejectVisitRequest.mockRejectedValue(new BadRequest())

      return request(app)
        .post('/visit/ab-cd-ef-gh/request/reject')
        .expect(302)
        .expect('location', '/requested-visits')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('messages', {
            variant: 'information',
            title: 'The visit to John Smith has already been rejected',
            showTitleAsHeading: true,
            html: 'The main contact has been notified. You can <a href="/visit/ab-cd-ef-gh">view this visit again</a>.',
          })

          expect(visitRequestsService.approveVisitRequest).not.toHaveBeenCalled()
          expect(visitRequestsService.rejectVisitRequest).toHaveBeenCalledWith('user1', visitDetails.reference)
          expect(visitService.getVisitDetailed).toHaveBeenCalledWith({
            username: 'user1',
            reference: visitDetails.reference,
          })
        })
    })

    it('should propagate other API errors', () => {
      visitRequestsService.rejectVisitRequest.mockRejectedValue(new InternalServerError())
      return request(app).post('/visit/ab-cd-ef-gh/request/reject').expect(500)
    })

    it('should return 400 Bad Request error for invalid visit reference', () => {
      return request(app).post('/visit/12-34-56-78/request/approve/reject').expect(400)
    })
  })
})
