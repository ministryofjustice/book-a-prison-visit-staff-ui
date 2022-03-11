import { Response } from 'express'
import { VisitSessionData, VisitSlot } from '../@types/bapv'
import { checkSession } from './visitorUtils'

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
  id: '123',
  startTimestamp: '123',
  endTimestamp: '123',
  availableTables: 1,
  visitRoomName: 'visitRoom',
}

describe('checkSession', () => {
  let mockResponse: Partial<Response>

  beforeEach(() => {
    mockResponse = {
      redirect: jest.fn(),
    }
  })

  it('should redirect to the search page when there is no session', () => {
    checkSession({ stage: 1, visitData: undefined, res: mockResponse as Response })

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
        checkSession({ stage: 1, visitData: testData, res: mockResponse as Response })

        expect(mockResponse.redirect).toHaveBeenCalledWith('/search/?error=missing-prisoner')
      })
    })

    it('should not redirect when there are no bits of missing prisoner data at stage 1', () => {
      checkSession({
        stage: 1,
        visitData: {
          prisoner: {
            name: 'abc',
            offenderNo: 'A1234BC',
            dateOfBirth: '12 May 1977',
            location: 'abc',
          },
        },
        res: mockResponse as Response,
      })

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
        checkSession({ stage: 2, visitData: testData, res: mockResponse as Response })

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
          id: '123',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitors: visitorsData,
        visit: {
          id: '123',
          startTimestamp: '123',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitors: visitorsData,
        visit: {
          id: '123',
          startTimestamp: '123',
          endTimestamp: '123',
        } as VisitSlot,
      },
      {
        prisoner: prisonerData,
        visitors: visitorsData,
        visit: {
          id: '123',
          startTimestamp: '123',
          endTimestamp: '123',
        } as VisitSlot,
      },
    ].forEach((testData: VisitSessionData) => {
      it('should redirect to the prisoner profile when there is missing visit data', () => {
        checkSession({ stage: 3, visitData: testData, res: mockResponse as Response })

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
        checkSession({ stage: 5, visitData: testData, res: mockResponse as Response })

        expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC?error=missing-main-contact')
      })
    })
  })
})
