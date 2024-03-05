import { Request, Response } from 'express'
import { Cookie } from 'express-session'
import { VisitSessionData, VisitSlot } from '../@types/bapv'
import sessionCheckMiddleware from './sessionCheckMiddleware'
import TestData from '../routes/testutils/testData'

const prisonId = 'HEI'
const supportedPrisons = TestData.supportedPrisons()

const prisonerData: VisitSessionData['prisoner'] = {
  name: 'abc',
  offenderNo: 'A1234BC',
  dateOfBirth: '12 May 1977',
  location: 'abc',
}
const visitorsData: VisitSessionData['visitors'] = [
  {
    personId: 123,
    name: 'abc',
    adult: true,
    relationshipDescription: 'abc',
    restrictions: [
      {
        restrictionType: 'abc',
        restrictionTypeDescription: 'abc',
        startDate: '123',
        expiryDate: '123',
        globalRestriction: true,
        comment: 'abc',
      },
    ],
    banned: false,
  },
]
const visitSlot: VisitSessionData['visitSlot'] = {
  id: '1',
  sessionTemplateReference: 'v9d.7ed.7u',
  prisonId,
  startTimestamp: '123',
  endTimestamp: '123',
  availableTables: 1,
  capacity: 30,
  visitRoom: 'visitRoom',
  visitRestriction: 'OPEN',
}
const visitRestriction: VisitSessionData['visitRestriction'] = 'OPEN'

describe('sessionCheckMiddleware', () => {
  let mockResponse: Partial<Response>
  let req: Partial<Request>
  const next = jest.fn()

  beforeEach(() => {
    req = {
      params: {},
      session: {
        regenerate: jest.fn(),
        destroy: jest.fn(),
        reload: jest.fn(),
        id: 'sessionId',
        resetMaxAge: jest.fn(),
        save: jest.fn(),
        touch: jest.fn(),
        cookie: new Cookie(),
        selectedEstablishment: { prisonId, prisonName: supportedPrisons[prisonId], policyNoticeDaysMin: 2 },
      },
    }
    mockResponse = {
      redirect: jest.fn(),
    }
  })

  it('should redirect to the prisoner search page when there is no session', () => {
    sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

    expect(mockResponse.redirect).toHaveBeenCalledWith('/search/prisoner/?error=missing-session')
  })

  it('should redirect to the start page if prisonId in originalVisitSlot (set for update journey) does not match selected establishment', () => {
    req.session.selectedEstablishment = { prisonId: 'BLI', prisonName: supportedPrisons.BLI, policyNoticeDaysMin: 2 }
    req.session.visitSessionData = { originalVisitSlot: visitSlot } as VisitSessionData

    sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

    expect(mockResponse.redirect).toHaveBeenCalledWith('/?error=establishment-mismatch')
  })

  describe('visit reference in URL (e.g. /visit/:reference/update/select-visitors)', () => {
    it('should redirect to start page if visit reference in URL does not match that in visitSessionData', () => {
      req.params.reference = 'ab-cd-ef-gh'
      req.session.visitSessionData = { visitReference: 'bb-cc-dd-ee-ff' } as VisitSessionData

      sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).toHaveBeenCalledWith('/?error=reference-mismatch')
    })

    it('should not redirect if visit reference in URL matches that in visitSessionData', () => {
      req.params.reference = 'ab-cd-ef-gh'
      req.session.visitSessionData = {
        prisoner: {
          name: 'abc',
          offenderNo: 'A1234BC',
          dateOfBirth: '12 May 1977',
          location: 'abc',
        },
        visitReference: 'ab-cd-ef-gh',
      } as VisitSessionData

      sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('prisoner data missing', () => {
    ;[
      {
        prisoner: {},
      },
      {
        prisoner: {
          name: 'abc',
        },
      },
      {
        prisoner: {
          name: 'abc',
          offenderNo: 'A1234BC',
        },
      },
      {
        prisoner: {
          name: 'abc',
          offenderNo: 'A1234BC',
          dateOfBirth: '12 May 1977',
        },
      },
    ].forEach((testData: VisitSessionData) => {
      it('should redirect to the prisoner search page when there are missing bits of prisoner data', () => {
        req.session.visitSessionData = testData

        sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith('/search/prisoner/?error=missing-prisoner')
      })
    })

    it('should not redirect when there are no bits of missing prisoner data at stage 1', () => {
      req.session.visitSessionData = {
        prisoner: {
          name: 'abc',
          offenderNo: 'A1234BC',
          dateOfBirth: '12 May 1977',
          location: 'abc',
        },
      }

      sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('visitors and visit restriction data missing', () => {
    ;[
      {
        prisoner: prisonerData,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
        visitors: [],
      },
    ].forEach((testData: VisitSessionData) => {
      it('should redirect to the prisoner profile when there is missing visitor or visit restriction data', () => {
        req.session.visitSessionData = testData

        sessionCheckMiddleware({ stage: 2 })(req as Request, mockResponse as Response, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-visitors')
      })
    })
  })

  describe('visit data missing', () => {
    ;[
      {
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
        visit: {
          id: '1',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
        visit: {
          id: '1',
          startTimestamp: '123',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
        visit: {
          id: '1',
          startTimestamp: '123',
          endTimestamp: '123',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
        visit: {
          id: '1',
          startTimestamp: '123',
          endTimestamp: '123',
        } as VisitSlot,
      },
    ].forEach((testData: VisitSessionData) => {
      it('should redirect to the prisoner profile when there is missing visit data', () => {
        req.session.visitSessionData = testData

        sessionCheckMiddleware({ stage: 3 })(req as Request, mockResponse as Response, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-visit')
      })
    })

    it('should redirect to the start page if prisonId in visitSlot does not match selected establishment', () => {
      req.session.selectedEstablishment = { prisonId: 'BLI', prisonName: supportedPrisons.BLI, policyNoticeDaysMin: 2 }
      req.session.visitSessionData = {
        applicationReference: 'aaa-bbb-ccc',
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
        visitReference: 'ab-cd-ef-gh',
        visitSlot: {
          id: '1',
          prisonId,
          availableTables: 0,
          startTimestamp: '123',
          endTimestamp: '123',
        } as VisitSlot,
      }

      sessionCheckMiddleware({ stage: 3 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).toHaveBeenCalledWith('/?error=establishment-mismatch')
    })

    it('should not reject a fully booked (zero capacity) visit', () => {
      req.session.visitSessionData = {
        applicationReference: 'aaa-bbb-ccc',
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
        visitReference: 'ab-cd-ef-gh',
        visitSlot: {
          id: '1',
          prisonId,
          availableTables: 0,
          startTimestamp: '123',
          endTimestamp: '123',
        } as VisitSlot,
      }

      sessionCheckMiddleware({ stage: 3 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('application reference', () => {
    it('should redirect to the prisoner profile if visit application reference not set', () => {
      const testData: VisitSessionData = {
        prisoner: prisonerData,
        visitRestriction,
        visitSlot,
        visitors: visitorsData,
      }

      req.session.visitSessionData = testData

      sessionCheckMiddleware({ stage: 3 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-application-reference')
    })
  })

  describe('additional support', () => {
    it('should redirect to the prisoner profile if additional support is not set', () => {
      const testData: VisitSessionData = {
        applicationReference: 'aaa-bbb-ccc',
        prisoner: prisonerData,
        visitRestriction,
        visitSlot,
        visitors: visitorsData,
        visitReference: 'ab-cd-ef-gh',
      }

      req.session.visitSessionData = testData

      sessionCheckMiddleware({ stage: 4 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-additional-support')
    })
  })

  describe('main contact data missing', () => {
    ;[
      {
        applicationReference: 'aaa-bbb-ccc',
        prisoner: prisonerData,
        visitRestriction,
        visitSlot,
        visitors: visitorsData,
        visitorSupport: { description: '' },
        visitReference: 'ab-cd-ef-gh',
      } as VisitSessionData,
      {
        applicationReference: 'aaa-bbb-ccc',
        prisoner: prisonerData,
        visitRestriction,
        visitSlot,
        visitors: visitorsData,
        visitorSupport: { description: '' },
        mainContact: {
          phoneNumber: '',
        },
        visitReference: 'ab-cd-ef-gh',
      } as VisitSessionData,
    ].forEach((testData: VisitSessionData) => {
      it('should redirect to the prisoner profile when there is missing main contact data', () => {
        req.session.visitSessionData = testData

        sessionCheckMiddleware({ stage: 5 })(req as Request, mockResponse as Response, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-main-contact')
      })
    })
  })

  describe('request method', () => {
    beforeEach(() => {
      const testData: VisitSessionData = {
        applicationReference: 'aaa-bbb-ccc',
        prisoner: prisonerData,
        visitRestriction,
        visitSlot,
        visitors: visitorsData,
        visitorSupport: { description: '' },
        mainContact: {
          phoneNumber: '01234567899',
          contactName: 'abc',
        },
      }
      req.session.visitSessionData = testData
    })

    it('should redirect if request method is empty', () => {
      req.session.visitSessionData.requestMethod = undefined

      sessionCheckMiddleware({ stage: 6 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-request-method')
    })

    it('should not redirect if request method is populated', () => {
      req.session.visitSessionData.requestMethod = 'PHONE'

      sessionCheckMiddleware({ stage: 6 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('check visit status', () => {
    beforeEach(() => {
      const testData: VisitSessionData = {
        prisoner: prisonerData,
        visitRestriction,
        visitSlot,
        visitors: visitorsData,
        visitorSupport: { description: '' },
        mainContact: {
          phoneNumber: '01234567899',
          contactName: 'abc',
        },
        requestMethod: 'PHONE',
        applicationReference: 'aaa-bbb-ccc',
        visitReference: 'ab-cd-ef-gh',
      }

      req.session.visitSessionData = testData
    })

    it('should not redirect if visit status is BOOKED at end of booking journey', () => {
      req.session.visitSessionData.visitStatus = 'BOOKED'

      sessionCheckMiddleware({ stage: 7 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).not.toHaveBeenCalled()
    })

    it('should redirect to the prisoner profile if visit status is not BOOKED at end of booking journey', () => {
      sessionCheckMiddleware({ stage: 7 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=visit-not-booked')
    })
  })
})
