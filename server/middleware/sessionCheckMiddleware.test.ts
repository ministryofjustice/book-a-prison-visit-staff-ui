import { Request, Response } from 'express'
import { Cookie } from 'express-session'
import { VisitSessionData, VisitSlot } from '../@types/bapv'
import sessionCheckMiddleware from './sessionCheckMiddleware'

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
const visit: VisitSessionData['visit'] = {
  id: '1',
  startTimestamp: '123',
  endTimestamp: '123',
  availableTables: 1,
  visitRoomName: 'visitRoom',
}
const visitRestriction: VisitSessionData['visitRestriction'] = 'OPEN'

describe('sessionCheckMiddleware', () => {
  let mockResponse: Partial<Response>
  let req: Partial<Request>
  const next = jest.fn()

  beforeEach(() => {
    req = {
      session: {
        regenerate: jest.fn(),
        destroy: jest.fn(),
        reload: jest.fn(),
        id: 'sessionId',
        resetMaxAge: jest.fn(),
        save: jest.fn(),
        touch: jest.fn(),
        cookie: new Cookie(),
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
  })

  describe('visit reference', () => {
    it('should redirect to the prisoner profile if visit booking reference not set', () => {
      const testData: VisitSessionData = {
        prisoner: prisonerData,
        visitRestriction,
        visit,
        visitors: visitorsData,
      }

      req.session.visitSessionData = testData

      sessionCheckMiddleware({ stage: 3 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-visit-reference')
    })
  })

  describe('main contact data missing', () => {
    ;[
      {
        prisoner: prisonerData,
        visitRestriction,
        visit,
        visitors: visitorsData,
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'RESERVED',
      } as VisitSessionData,
      {
        prisoner: prisonerData,
        visitRestriction,
        visit,
        visitors: visitorsData,
        mainContact: {
          phoneNumber: '',
        },
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'RESERVED',
      } as VisitSessionData,
    ].forEach((testData: VisitSessionData) => {
      it('should redirect to the prisoner profile when there is missing main contact data', () => {
        req.session.visitSessionData = testData

        sessionCheckMiddleware({ stage: 5 })(req as Request, mockResponse as Response, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-main-contact')
      })
    })
  })

  describe('check visit status', () => {
    beforeEach(() => {
      const testData: VisitSessionData = {
        prisoner: prisonerData,
        visitRestriction,
        visit,
        visitors: visitorsData,
        mainContact: {
          phoneNumber: '01234567899',
          contactName: 'abc',
        },
      }

      req.session.visitSessionData = testData
    })

    it('should not redirect if visit status missing prior to selecting a visit slot', () => {
      sessionCheckMiddleware({ stage: 2 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).not.toHaveBeenCalled()
    })

    it('should not redirect if visit status is RESERVED during booking journey', () => {
      req.session.visitSessionData.visitReference = 'ab-cd-ef-gh'
      req.session.visitSessionData.visitStatus = 'RESERVED'

      sessionCheckMiddleware({ stage: 3 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).not.toHaveBeenCalled()
    })

    it('should redirect to the prisoner profile if visit status is not RESERVED during booking journey', () => {
      req.session.visitSessionData.visitReference = 'ab-cd-ef-gh'
      req.session.visitSessionData.visitStatus = 'BOOKED'

      sessionCheckMiddleware({ stage: 3 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=visit-already-booked')
    })

    it('should not redirect if visit status is BOOKED at end of booking journey', () => {
      req.session.visitSessionData.visitReference = 'ab-cd-ef-gh'
      req.session.visitSessionData.visitStatus = 'BOOKED'

      sessionCheckMiddleware({ stage: 6 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).not.toHaveBeenCalled()
    })

    it('should redirect to the prisoner profile if visit status is not BOOKED at end of booking journey', () => {
      req.session.visitSessionData.visitReference = 'ab-cd-ef-gh'
      req.session.visitSessionData.visitStatus = 'RESERVED'

      sessionCheckMiddleware({ stage: 6 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=visit-not-booked')
    })
  })
})
