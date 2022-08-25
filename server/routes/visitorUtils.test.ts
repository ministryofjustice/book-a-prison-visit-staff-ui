import { Request } from 'express'
import { Session, SessionData } from 'express-session'
import { VisitSessionData, VisitSlotList } from '../@types/bapv'
import { clearSession, getFlashFormValues, getSelectedSlot } from './visitorUtils'

const slotsList: VisitSlotList = {
  'February 2022': [
    {
      date: 'Monday 14 February',
      prisonerEvents: {
        morning: [],
        afternoon: [],
      },
      slots: {
        morning: [
          {
            id: '1',
            startTimestamp: '2022-02-14T10:00:00',
            endTimestamp: '2022-02-14T11:00:00',
            availableTables: 15,
            visitRoomName: 'room name',
            visitRestriction: 'OPEN',
          },
          {
            id: '2',
            startTimestamp: '2022-02-14T11:59:00',
            endTimestamp: '2022-02-14T12:59:00',
            availableTables: 1,
            visitRoomName: 'room name',
            visitRestriction: 'OPEN',
          },
        ],
        afternoon: [
          {
            id: '3',
            startTimestamp: '2022-02-14T12:00:00',
            endTimestamp: '2022-02-14T13:05:00',
            availableTables: 5,
            visitRoomName: 'room name',
            visitRestriction: 'OPEN',
          },
        ],
      },
    },
    {
      date: 'Tuesday 15 February',
      prisonerEvents: {
        morning: [],
        afternoon: [],
      },
      slots: {
        morning: [],
        afternoon: [
          {
            id: '4',
            startTimestamp: '2022-02-15T16:00:00',
            endTimestamp: '2022-02-15T17:00:00',
            availableTables: 12,
            visitRoomName: 'room name',
            visitRestriction: 'OPEN',
          },
        ],
      },
    },
  ],
  'March 2022': [
    {
      date: 'Tuesday 1 March',
      prisonerEvents: {
        morning: [],
        afternoon: [],
      },
      slots: {
        morning: [
          {
            id: '5',
            startTimestamp: '2022-03-01T09:30:00',
            endTimestamp: '2022-03-01T10:30:00',
            availableTables: 0,
            visitRoomName: 'room name',
            visitRestriction: 'OPEN',
          },
        ],
        afternoon: [],
      },
    },
  ],
}

describe('getSelectedSlot', () => {
  it('should return the selected slot if it exists in the slotsList', () => {
    expect(getSelectedSlot(slotsList, '4')).toEqual({
      id: '4',
      startTimestamp: '2022-02-15T16:00:00',
      endTimestamp: '2022-02-15T17:00:00',
      availableTables: 12,
      visitRoomName: 'room name',
      visitRestriction: 'OPEN',
    })
  })

  it('should return undefined if selected slot not present in slotsList', () => {
    expect(getSelectedSlot(slotsList, '0')).toBe(undefined)
    expect(getSelectedSlot(slotsList, '6')).toBe(undefined)
  })
})

describe('getFlashFormValues', () => {
  let returnValue: Record<string, string | string[]>[]

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
    availableSupportTypes: [{ type: 'WHEELCHAIR', description: 'Wheelchair ramp' }],
    visitorList: { visitors: [] },
    adultVisitors: { adults: [] },
    slotsList: {},
    timeOfDay: 'morning',
    dayOfTheWeek: '1',
    visitSessionData: { prisoner: undefined },
    updateVisitSessionData: {} as VisitSessionData,
  }

  req.session = sessionData as Session & SessionData

  it('should clear only booking journey related data from the session', () => {
    clearSession(req as Request)

    expect(req.session).toStrictEqual(<Session & Partial<SessionData>>{
      returnTo: '/url',
      nowInMinutes: 123456,
      cookie: undefined,
    })
  })
})
