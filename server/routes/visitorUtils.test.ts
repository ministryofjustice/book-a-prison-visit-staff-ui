import { Response } from 'express'
import { VisitSessionData } from '../@types/bapv'
import { checkSession } from './visitorUtils'

describe('checkSession', () => {
  let mockResponse: Partial<Response>

  beforeEach(() => {
    mockResponse = {
      redirect: jest.fn(),
    }
  })

  it('should redirect to the search page when there is no session', () => {
    checkSession({ stage: 1, visitData: undefined, res: mockResponse as Response })

    expect(mockResponse.redirect).toHaveBeenCalledWith('/search/')
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

        expect(mockResponse.redirect).toHaveBeenCalledWith('/search/')
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

    it('should should redirect to the prisoner profile when there are no bits of missing prisoner data after stage 1', () => {
      checkSession({
        stage: 2,
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

      expect(mockResponse.redirect).toHaveBeenCalledWith('/prisoner/A1234BC')
    })
  })
})
