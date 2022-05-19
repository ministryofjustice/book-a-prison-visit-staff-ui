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
  id: 'ab-cd-ef-gh',
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

  it('should redirect to the search page when there is no session', () => {
    sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

    expect(mockResponse.redirect).toHaveBeenCalledWith('/search/?error=missing-session')
  })

  describe('prisoner or default visitRestriction data missing', () => {
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
          location: 'abc',
        },
      },
    ].forEach((testData: VisitSessionData) => {
      it('should redirect to the search page when there are missing bits of prisoner or visitRestriction data', () => {
        req.session.visitSessionData = testData

        sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith('/search/?error=missing-prisoner')
      })
    })

    it('should not redirect when there are no bits of missing prisoner and visitRestriction data at stage 1', () => {
      req.session.visitSessionData = {
        prisoner: {
          name: 'abc',
          offenderNo: 'A1234BC',
          dateOfBirth: '12 May 1977',
          location: 'abc',
        },
        visitRestriction: 'OPEN',
      }

      sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

      expect(mockResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('visitors data missing', () => {
    ;[
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
      it('should redirect to the prisoner profile when there is missing visitor data', () => {
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
          id: 'ab-cd-ef-gh',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
        visit: {
          id: 'ab-cd-ef-gh',
          startTimestamp: '123',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
        visit: {
          id: 'ab-cd-ef-gh',
          startTimestamp: '123',
          endTimestamp: '123',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
        visitors: visitorsData,
        visit: {
          id: 'ab-cd-ef-gh',
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

  describe('main contact data missing', () => {
    ;[
      {
        prisoner: prisonerData,
        visitRestriction,
        visit,
        visitors: visitorsData,
      },
      {
        prisoner: prisonerData,
        visitRestriction,
        visit,
        visitors: visitorsData,
        mainContact: {
          phoneNumber: '',
        },
      },
    ].forEach((testData: VisitSessionData) => {
      it('should redirect to the prisoner profile when there is missing main contact data', () => {
        req.session.visitSessionData = testData

        sessionCheckMiddleware({ stage: 5 })(req as Request, mockResponse as Response, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-main-contact')
      })
    })
  })
})
