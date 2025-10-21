import { Request } from 'express'
import { Session, SessionData } from 'express-session'
import { FlashFormValues } from '../@types/bapv'
import { clearSession, getFlashFormValues } from './visitorUtils'
import TestData from './testutils/testData'

describe('getFlashFormValues', () => {
  let returnValue: FlashFormValues[]

  const req = {
    flash: jest.fn(() => {
      return returnValue
    }),
  } as unknown as Request

  it('should return formValues if present in request flash data', () => {
    returnValue = [{ formField: 'value', anotherField: '123' }]

    expect(getFlashFormValues(req)).toEqual({ formField: 'value', anotherField: '123' })
    expect(req.flash).toHaveBeenNthCalledWith(1, 'formValues')
  })

  it('should return empty object if formValues not present in request flash data', () => {
    returnValue = []

    expect(getFlashFormValues(req)).toEqual({})
    expect(req.flash).toHaveBeenNthCalledWith(1, 'formValues')
  })
})

describe('clearSession', () => {
  const req: Partial<Request> = {}
  const sessionData: SessionData = {
    returnTo: '/url',
    nowInMinutes: 123456,
    cookie: undefined,
    visitorList: { visitors: [] },
    adultVisitors: { adults: [] },
    visitSessionData: { allowOverBooking: false, prisoner: undefined, prisonId: '' },
    selectedEstablishment: TestData.prison(),
    cancelledVisitInfo: {
      startTimestamp: '',
      endTimestamp: '',
      hasEmailAddress: undefined,
      hasMobileNumber: undefined,
    },
  }

  req.session = sessionData as Session & SessionData

  it('should clear specified booking data from the session', () => {
    clearSession(req as Request)

    expect(req.session).toStrictEqual(<Session & Partial<SessionData>>{
      returnTo: '/url',
      nowInMinutes: 123456,
      cookie: undefined,
      selectedEstablishment: TestData.prison(),
    })
  })
})
