import type { Request, Response } from 'express'
// import * as cheerio from 'cheerio'
import { Cookie } from 'express-session'
import AuditService from '../../services/auditService'
import { VisitorListItem, VisitSessionData, VisitSlotList } from '../../@types/bapv'
import VisitType from './visitType'

jest.mock('../../services/auditService')

const auditService = new AuditService() as jest.Mocked<AuditService>

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visit Journey', () => {
  const visitReference = 'ab-cd-ef-gh'
  const request: Request = {} as Request
  const response: Response = {} as Response
  const flashMock = jest.fn()

  beforeEach(() => {
    request.session = {
      cookie: new Cookie(),
      returnTo: '',
      nowInMinutes: 0,
      visitorList: { visitors: [] as VisitorListItem[] },
      adultVisitors: { adults: [] as VisitorListItem[] },
      slotsList: {} as VisitSlotList,
      timeOfDay: '',
      dayOfTheWeek: '',
      visitSessionData: {} as VisitSessionData,
      amendVisitSessionData: {} as VisitSessionData,
      availableSupportTypes: [],
      regenerate: jest.fn(),
      destroy: jest.fn(),
      reload: jest.fn(),
      id: 'sessionId',
      resetMaxAge: jest.fn(),
      save: jest.fn(),
      touch: jest.fn(),
    }
    request.flash = flashMock

    response.render = jest.fn()
  })

  describe('get()', () => {
    it('should call the render method with the relevant arguments for the update journey', async () => {
      const amendVisitSessionData: VisitSessionData = {
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
          restrictions: [
            {
              restrictionId: 12345,
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-05-16',
              comment: 'some comment text',
              active: true,
            },
          ],
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            address: '1st listed address',
            adult: true,
            dateOfBirth: '1986-07-28',
            name: 'Bob Smith',
            personId: 4322,
            relationshipDescription: 'Brother',
            restrictions: [],
            banned: false,
          },
        ],
        visitReference,
      }

      request.session.amendVisitSessionData = amendVisitSessionData

      const updateVisitType = new VisitType('update', auditService)

      await updateVisitType.get(request, response)

      expect(flashMock).toHaveBeenCalledWith('errors')
      expect(response.render).toHaveBeenCalledWith('pages/visit/visitType', {
        errors: request.flash('errors'),
        restrictions: updateVisitType.getClosedRestrictions(amendVisitSessionData.prisoner.restrictions),
        visitors: amendVisitSessionData.visitors,
        reference: amendVisitSessionData.visitReference,
      })
    })

    it('should call the render method with the relevant arguments for the book journey', async () => {
      const visitSessionData: VisitSessionData = {
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
          restrictions: [
            {
              restrictionId: 12345,
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-05-16',
              comment: 'some comment text',
              active: true,
            },
          ],
        },
        visitRestriction: 'OPEN',
        visitors: [
          {
            address: '1st listed address',
            adult: true,
            dateOfBirth: '1986-07-28',
            name: 'Bob Smith',
            personId: 4322,
            relationshipDescription: 'Brother',
            restrictions: [],
            banned: false,
          },
        ],
        visitReference,
      }

      request.session.visitSessionData = visitSessionData

      const bookVisitType = new VisitType('', auditService)

      await bookVisitType.get(request, response)

      expect(flashMock).toHaveBeenCalledWith('errors')
      expect(response.render).toHaveBeenCalledWith('pages/bookAVisit/visitType', {
        errors: request.flash('errors'),
        restrictions: bookVisitType.getClosedRestrictions(visitSessionData.prisoner.restrictions),
        visitors: visitSessionData.visitors,
        reference: visitSessionData.visitReference,
      })
    })
  })

  // describe.skip('POST /visit/:reference/update/visit-type', () => {
  //   it('should set validation errors in flash and redirect if visit type not selected', () => {
  //     return request(sessionApp)
  //       .post(`/visit/${visitReference}/update/visit-type`)
  //       .expect(302)
  //       .expect('location', `/visit/${visitReference}/update/visit-type`)
  //       .expect(() => {
  //         expect(flashProvider).toHaveBeenCalledWith('errors', [
  //           { location: 'body', msg: 'No visit type selected', param: 'visitType', value: undefined },
  //         ])
  //       })
  //   })

  //   it('should set visit type to OPEN when selected and redirect to select date/time', () => {
  //     return request(sessionApp)
  //       .post(`/visit/${visitReference}/update/visit-type`)
  //       .send('visitType=OPEN')
  //       .expect(302)
  //       .expect('location', `/visit/${visitReference}/update/select-date-and-time`)
  //       .expect(() => {
  //         expect(amendVisitSessionData.visitRestriction).toBe('OPEN')
  //         expect(amendVisitSessionData.closedVisitReason).toBe(undefined)
  //         expect(auditService.visitRestrictionSelected).toHaveBeenCalledTimes(1)
  //         expect(auditService.visitRestrictionSelected).toHaveBeenCalledWith(
  //           amendVisitSessionData.prisoner.offenderNo,
  //           'OPEN',
  //           [amendVisitSessionData.visitors[0].personId.toString()],
  //           undefined,
  //           undefined,
  //         )
  //       })
  //   })

  //   it('should set visit type to CLOSED when selected and redirect to select date/time', () => {
  //     return request(sessionApp)
  //       .post(`/visit/${visitReference}/update/visit-type`)
  //       .send('visitType=CLOSED')
  //       .expect(302)
  //       .expect('location', `/visit/${visitReference}/update/select-date-and-time`)
  //       .expect(() => {
  //         expect(amendVisitSessionData.visitRestriction).toBe('CLOSED')
  //         expect(amendVisitSessionData.closedVisitReason).toBe('prisoner')
  //         expect(auditService.visitRestrictionSelected).toHaveBeenCalledTimes(1)
  //         expect(auditService.visitRestrictionSelected).toHaveBeenCalledWith(
  //           amendVisitSessionData.prisoner.offenderNo,
  //           'CLOSED',
  //           [amendVisitSessionData.visitors[0].personId.toString()],
  //           undefined,
  //           undefined,
  //         )
  //       })
  //   })
  // })
})
