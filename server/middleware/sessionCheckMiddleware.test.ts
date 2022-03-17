import { Request, Response } from 'express'
import { Cookie } from 'express-session'
import { VisitSessionData, VisitSlot } from '../@types/bapv'
import sessionCheckMiddleware from './sessionCheckMiddleware'

const prisonerData = {
  name: 'abc',
  offenderNo: 'A1234BC',
  dateOfBirth: '12 May 1977',
  location: 'abc',
}
const visitorsData = [
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
  },
]
const visit = {
  id: 'v9-d7-ed-7u',
  startTimestamp: '123',
  endTimestamp: '123',
  availableTables: 1,
  visitRoomName: 'visitRoom',
}

describe('checkSession', () => {
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
      it('should redirect to the search page when there are missing bits of prisoner data', () => {
        req.session.visitSessionData = testData

        sessionCheckMiddleware({ stage: 1 })(req as Request, mockResponse as Response, next)

        expect(mockResponse.redirect).toHaveBeenCalledWith('/search/?error=missing-prisoner')
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

  describe('visitors data missing', () => {
    ;[
      {
        prisoner: prisonerData,
      },
      {
        prisoner: prisonerData,
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
        visitors: visitorsData,
      },
      {
        prisoner: prisonerData,
        visitors: visitorsData,
        visit: {
          id: 'v9-d7-ed-7u',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitors: visitorsData,
        visit: {
          id: 'v9-d7-ed-7u',
          startTimestamp: '123',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitors: visitorsData,
        visit: {
          id: 'v9-d7-ed-7u',
          startTimestamp: '123',
          endTimestamp: '123',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitors: visitorsData,
        visit: {
          id: 'v9-d7-ed-7u',
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
        visit,
        visitors: visitorsData,
      },
      {
        prisoner: prisonerData,
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
