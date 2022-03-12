import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { Restriction, VisitorListItem, VisitSessionData, VisitSlotList } from '../@types/bapv'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import VisitSessionsService from '../services/visitSessionsService'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'

jest.mock('../services/prisonerVisitorsService')
jest.mock('../services/visitSessionsService')

let sessionApp: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let visitSessionData: VisitSessionData

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    return flashData[key]
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visit/select-visitors', () => {
  const prisonerVisitorsService = new PrisonerVisitorsService(
    null,
    null,
    systemToken
  ) as jest.Mocked<PrisonerVisitorsService>

  let returnData: { prisonerName: string; visitorList: VisitorListItem[] }

  beforeAll(() => {
    returnData = {
      prisonerName: 'John Smith',
      visitorList: [
        {
          personId: 4321,
          name: 'Jeanette Smith',
          dateOfBirth: '1986-07-28',
          adult: true,
          relationshipDescription: 'Sister',
          address:
            'Premises,<br>Flat 23B,<br>123 The Street,<br>Springfield,<br>Coventry,<br>West Midlands,<br>C1 2AB,<br>England',
          restrictions: [
            {
              restrictionType: 'BAN',
              restrictionTypeDescription: 'Banned',
              startDate: '2022-01-01',
              expiryDate: '2022-07-31',
              comment: 'Ban details',
            },
            {
              restrictionType: 'RESTRICTED',
              restrictionTypeDescription: 'Restricted',
              startDate: '2022-01-02',
            },
            {
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-01-03',
            },
            {
              restrictionType: 'NONCON',
              restrictionTypeDescription: 'Non-Contact Visit',
              startDate: '2022-01-04',
            },
          ] as Restriction[],
        },
        {
          personId: 4322,
          name: 'Bob Smith',
          dateOfBirth: undefined,
          adult: undefined,
          relationshipDescription: 'Brother',
          address: '1st listed address',
          restrictions: [],
        },
        {
          personId: 4324,
          name: 'Anne Smith',
          dateOfBirth: '2018-03-02',
          adult: false,
          relationshipDescription: 'Niece',
          address: 'Not entered',
          restrictions: [],
        },
      ],
    }
  })

  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'John Smith',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
    }

    prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

    sessionApp = appWithAllRoutes(null, null, prisonerVisitorsService, null, systemToken, false, {
      visitSessionData,
    } as SessionData)
  })

  it('should render the approved visitor list for offender number A1234BC with none selected', () => {
    return request(sessionApp)
      .get('/visit/select-visitors')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')

        expect($('#visitor-4321').length).toBe(1)
        expect($('[data-test="visitor-name-4321"]').text()).toBe('Jeanette Smith')
        expect($('[data-test="visitor-dob-4321"]').text()).toMatch(/28 July 1986.*Adult/)
        expect($('[data-test="visitor-relation-4321"]').text()).toContain('Sister')
        expect($('[data-test="visitor-address-4321"]').text()).toContain('123 The Street')
        const restrictions = $('[data-test="visitor-restrictions-4321"] .visitor-restriction')
        expect(restrictions.eq(0).text()).toContain('Banned until 31 July 2022')
        expect(restrictions.eq(0).text()).toContain('Ban details')
        expect(restrictions.eq(1).text()).toContain('Restricted End date not entered')
        expect(restrictions.eq(2).text()).toContain('Closed End date not entered')
        expect(restrictions.eq(3).text()).toContain('Non-Contact Visit End date not entered')

        expect($('[data-test="visitor-name-4322"]').text()).toBe('Bob Smith')
        expect($('[data-test="visitor-restrictions-4322"]').text()).toBe('None')

        expect($('[data-test="visitor-name-4324"]').text()).toBe('Anne Smith')
        expect($('[data-test="visitor-dob-4324"]').text()).toMatch(/2 March 2018.*Child/)

        expect($('input[name="visitors"]:checked').length).toBe(0)
        expect($('[data-test="submit"]').text().trim()).toBe('Continue')
      })
  })

  it('should render the approved visitor list for offender number A1234BC with those in session (single) selected', () => {
    visitSessionData.visitors = [
      {
        address: '1st listed address',
        adult: undefined,
        dateOfBirth: undefined,
        name: 'Bob Smith',
        personId: 4322,
        relationshipDescription: 'Brother',
        restrictions: [],
        selected: true,
      },
    ]

    return request(sessionApp)
      .get('/visit/select-visitors')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('input[name="visitors"]').length).toBe(3)
        expect($('#visitor-4321').prop('checked')).toBe(false)
        expect($('#visitor-4322').prop('checked')).toBe(true)
        expect($('#visitor-4324').prop('checked')).toBe(false)
        expect($('[data-test="submit"]').text().trim()).toBe('Continue')
      })
  })

  it('should render the approved visitor list for offender number A1234BC with those in session (multiple) selected', () => {
    visitSessionData.visitors = [
      {
        address: '1st listed address',
        adult: undefined,
        dateOfBirth: undefined,
        name: 'Bob Smith',
        personId: 4322,
        relationshipDescription: 'Brother',
        restrictions: [],
        selected: true,
      },
      {
        address: 'Not entered',
        adult: false,
        dateOfBirth: '2018-03-02',
        name: 'Anne Smith',
        personId: 4324,
        relationshipDescription: 'Niece',
        restrictions: [],
        selected: true,
      },
    ]

    return request(sessionApp)
      .get('/visit/select-visitors')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('input[name="visitors"]').length).toBe(3)
        expect($('#visitor-4321').prop('checked')).toBe(false)
        expect($('#visitor-4322').prop('checked')).toBe(true)
        expect($('#visitor-4324').prop('checked')).toBe(true)
        expect($('[data-test="submit"]').text().trim()).toBe('Continue')
      })
  })

  it('should render validation errors from flash data for invalid input', () => {
    flashData.errors = [{ location: 'body', msg: 'No visitors selected', param: 'visitors', value: undefined }]

    return request(sessionApp)
      .get('/visit/select-visitors')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('.govuk-error-summary__body').text()).toContain('No visitors selected')
        expect($('#visitors-error').text()).toContain('No visitors selected')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })

  it('should show message and no Continue button for prisoner with no approved visitors', () => {
    returnData = { prisonerName: 'John Smith', visitorList: [] }
    prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

    return request(sessionApp)
      .get('/visit/select-visitors')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
        expect($('input[name="visitors"]').length).toBe(0)
        expect($('#main-content').text()).toContain('The prisoner has no approved visitors.')
        expect($('[data-test="submit"]').length).toBe(0)
      })
  })
})

describe('POST /visit/select-visitors', () => {
  beforeEach(() => {
    const visitorList: VisitorListItem[] = [
      {
        personId: 4321,
        name: 'Jeanette Smith',
        dateOfBirth: '1986-07-28',
        adult: true,
        relationshipDescription: 'Sister',
        address:
          'Premises,<br>Flat 23B,<br>123 The Street,<br>Springfield,<br>Coventry,<br>West Midlands,<br>C1 2AB,<br>England',
        restrictions: [],
      },
      {
        personId: 4322,
        name: 'Bob Smith',
        dateOfBirth: '1986-07-28',
        adult: true,
        relationshipDescription: 'Brother',
        address: '1st listed address',
        restrictions: [],
      },
      {
        personId: 4323,
        name: 'Ted Smith',
        dateOfBirth: '1968-07-28',
        adult: true,
        relationshipDescription: 'Father',
        address: '1st listed address',
        restrictions: [],
      },
      {
        personId: 4324,
        name: 'Anne Smith',
        dateOfBirth: '2018-03-02',
        adult: false,
        relationshipDescription: 'Niece',
        address: 'Not entered',
        restrictions: [],
      },
      {
        personId: 4325,
        name: 'Bill Smith',
        dateOfBirth: '2018-03-02',
        adult: false,
        relationshipDescription: 'Nephew',
        address: 'Not entered',
        restrictions: [],
      },
    ]

    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
    }

    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
      visitorList,
      visitSessionData,
    } as SessionData)
  })

  it('should save to session and redirect to the select date and time page if an adult is selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .send('visitors=4322')
      .expect(302)
      .expect('location', '/visit/select-date-and-time')
      .expect(() => {
        expect(visitSessionData.visitors).toEqual([
          {
            address: '1st listed address',
            adult: true,
            dateOfBirth: '1986-07-28',
            name: 'Bob Smith',
            personId: 4322,
            relationshipDescription: 'Brother',
            restrictions: [],
            selected: true,
          },
        ])
      })
  })

  it('should save to session and redirect to the select date and time page if an adult and a child are selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .send('visitors=4322&visitors=4324')
      .expect(302)
      .expect('location', '/visit/select-date-and-time')
      .expect(() => {
        expect(visitSessionData.visitors).toEqual([
          {
            address: '1st listed address',
            adult: true,
            dateOfBirth: '1986-07-28',
            name: 'Bob Smith',
            personId: 4322,
            relationshipDescription: 'Brother',
            restrictions: [],
            selected: true,
          },
          {
            address: 'Not entered',
            adult: false,
            dateOfBirth: '2018-03-02',
            name: 'Anne Smith',
            personId: 4324,
            relationshipDescription: 'Niece',
            restrictions: [],
            selected: true,
          },
        ])
      })
  })

  it('should save new choice to session and redirect to select date and time page if existing session data present', () => {
    visitSessionData.visitors = [
      {
        address: '1st listed address',
        adult: true,
        dateOfBirth: '1986-07-28',
        name: 'Bob Smith',
        personId: 4322,
        relationshipDescription: 'Brother',
        restrictions: [],
        selected: true,
      },
    ]

    return request(sessionApp)
      .post('/visit/select-visitors')
      .send('visitors=4323')
      .expect(302)
      .expect('location', '/visit/select-date-and-time')
      .expect(() => {
        expect(visitSessionData.visitors).toEqual([
          {
            personId: 4323,
            name: 'Ted Smith',
            dateOfBirth: '1968-07-28',
            adult: true,
            relationshipDescription: 'Father',
            address: '1st listed address',
            restrictions: [],
            selected: true,
          },
        ])
      })
  })

  it('should should set validation errors in flash and redirect if invalid visitor selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .send('visitors=1234')
      .expect(302)
      .expect('location', '/visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Add an adult to the visit', param: 'visitors', value: '1234' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '1234' })
      })
  })

  it('should set validation errors in flash and redirect if no visitors are selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .expect(302)
      .expect('location', '/visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No visitors selected', param: 'visitors', value: undefined },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {})
      })
  })

  it('should set validation errors in flash and redirect if no adults are selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .send('visitors=4324')
      .expect(302)
      .expect('location', '/visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Add an adult to the visit', param: 'visitors', value: '4324' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '4324' })
      })
  })

  it('should set validation errors in flash and redirect if more than 2 adults are selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .send('visitors=4321&visitors=4322&visitors=4323')
      .expect(302)
      .expect('location', '/visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Select no more than 2 adults',
            param: 'visitors',
            value: ['4321', '4322', '4323'],
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: ['4321', '4322', '4323'] })
      })
  })

  it('should set validation errors in flash and redirect if more than 3 visitors are selected', () => {
    return request(sessionApp)
      .post('/visit/select-visitors')
      .send('visitors=4321&visitors=4322&visitors=4323&visitors=4324')
      .expect(302)
      .expect('location', '/visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Select no more than 3 visitors with a maximum of 2 adults',
            param: 'visitors',
            value: ['4321', '4322', '4323', '4324'],
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: ['4321', '4322', '4323', '4324'] })
      })
  })
})

describe('/visit/select-date-and-time', () => {
  const slotsList: VisitSlotList = {
    'February 2022': [
      {
        date: 'Monday 14 February',
        slots: {
          morning: [
            {
              id: '1',
              startTimestamp: '2022-02-14T10:00:00',
              endTimestamp: '2022-02-14T11:00:00',
              availableTables: 15,
              visitRoomName: 'room name',
            },
            {
              id: '2',
              startTimestamp: '2022-02-14T11:59:00',
              endTimestamp: '2022-02-14T12:59:00',
              availableTables: 1,
              visitRoomName: 'room name',
            },
          ],
          afternoon: [
            {
              id: '3',
              startTimestamp: '2022-02-14T12:00:00',
              endTimestamp: '2022-02-14T13:05:00',
              availableTables: 5,
              visitRoomName: 'room name',
            },
          ],
        },
      },
      {
        date: 'Tuesday 15 February',
        slots: {
          morning: [],
          afternoon: [
            {
              id: '4',
              startTimestamp: '2022-02-15T16:00:00',
              endTimestamp: '2022-02-15T17:00:00',
              availableTables: 12,
              visitRoomName: 'room name',
            },
          ],
        },
      },
    ],
    'March 2022': [
      {
        date: 'Tuesday 1 March',
        slots: {
          morning: [
            {
              id: '5',
              startTimestamp: '2022-03-01T09:30:00',
              endTimestamp: '2022-03-01T10:30:00',
              availableTables: 0,
              visitRoomName: 'room name',
            },
          ],
          afternoon: [],
        },
      },
    ],
  }

  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'John Smith',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitors: [
        {
          personId: 4323,
          name: 'Ted Smith',
          dateOfBirth: '1968-07-28',
          adult: true,
          relationshipDescription: 'Father',
          address: '1st listed address',
          restrictions: [],
          selected: true,
        },
      ],
    }
  })

  describe('GET /visit/select-date-and-time', () => {
    const visitSessionsService = new VisitSessionsService(null, systemToken) as jest.Mocked<VisitSessionsService>

    beforeEach(() => {
      visitSessionsService.getVisitSessions.mockResolvedValue(slotsList)

      sessionApp = appWithAllRoutes(null, null, null, visitSessionsService, systemToken, false, {
        visitSessionData,
      } as SessionData)
    })

    it('should render the available sessions list with none selected', () => {
      return request(sessionApp)
        .get('/visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('input[name="visit-date-and-time"]').length).toBe(5)
          expect($('input[name="visit-date-and-time"]:checked').length).toBe(0)
          expect($('[data-test="submit"]').text().trim()).toBe('Continue')
        })
    })

    it('should show message if no sessions are available', () => {
      visitSessionsService.getVisitSessions.mockResolvedValue({})

      sessionApp = appWithAllRoutes(null, null, null, visitSessionsService, systemToken, false, {
        visitSessionData,
      } as SessionData)

      return request(sessionApp)
        .get('/visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('#main-content').text()).toContain('There are no visit time slots for the next 28 days.')
          expect($('input[name="visit-date-and-time"]').length).toBe(0)
          expect($('[data-test="submit"]').length).toBe(0)
        })
    })

    it('should render the available sessions list with the slot in the session selected', () => {
      visitSessionData.visit = {
        id: '3',
        startTimestamp: '2022-02-14T12:00:00',
        endTimestamp: '2022-02-14T13:05:00',
        availableTables: 5,
        visitRoomName: 'room name',
      }

      return request(sessionApp)
        .get('/visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('input[name="visit-date-and-time"]').length).toBe(5)
          expect($('input#3').prop('checked')).toBe(true)
          expect($('[data-test="submit"]').text().trim()).toBe('Continue')
        })
    })

    it('should render validation errors from flash data for invalid input', () => {
      flashData.errors = [{ location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time' }]

      return request(sessionApp)
        .get('/visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('.govuk-error-summary__body').text()).toContain('No time slot selected')
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
          expect(flashProvider).toHaveBeenCalledTimes(2)
        })
    })
  })

  describe('POST /visit/select-date-and-time', () => {
    beforeEach(() => {
      sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
        slotsList,
        visitSessionData,
      } as SessionData)
    })

    it('should save to session and redirect to additional support page if slot selected', () => {
      return request(sessionApp)
        .post('/visit/select-date-and-time')
        .send('visit-date-and-time=2')
        .expect(302)
        .expect('location', '/visit/additional-support')
        .expect(() => {
          expect(visitSessionData.visit).toEqual({
            id: '2',
            startTimestamp: '2022-02-14T11:59:00',
            endTimestamp: '2022-02-14T12:59:00',
            availableTables: 1,
            visitRoomName: 'room name',
          })
        })
    })

    it('should save new choice to session and redirect to additional support page if existing session data present', () => {
      visitSessionData.visit = {
        id: '1',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        availableTables: 15,
        visitRoomName: 'room name',
      }

      return request(sessionApp)
        .post('/visit/select-date-and-time')
        .send('visit-date-and-time=3')
        .expect(302)
        .expect('location', '/visit/additional-support')
        .expect(() => {
          expect(visitSessionData.visit).toEqual({
            id: '3',
            startTimestamp: '2022-02-14T12:00:00',
            endTimestamp: '2022-02-14T13:05:00',
            availableTables: 5,
            visitRoomName: 'room name',
          })
        })
    })

    it('should should set validation errors in flash and redirect if no slot selected', () => {
      return request(sessionApp)
        .post('/visit/select-date-and-time')
        .expect(302)
        .expect('location', '/visit/select-date-and-time')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: undefined },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {})
        })
    })

    it('should should set validation errors in flash and redirect, preserving filter settings, if no slot selected', () => {
      sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
        timeOfDay: 'afternoon',
        dayOfTheWeek: '3',
        slotsList,
        visitSessionData,
      } as SessionData)

      return request(sessionApp)
        .post('/visit/select-date-and-time')
        .expect(302)
        .expect('location', '/visit/select-date-and-time?timeOfDay=afternoon&dayOfTheWeek=3')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: undefined },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {})
        })
    })

    it('should should set validation errors in flash and redirect if invalid slot selected', () => {
      return request(sessionApp)
        .post('/visit/select-date-and-time')
        .send('visit-date-and-time=100')
        .expect(302)
        .expect('location', '/visit/select-date-and-time')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: '100' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { 'visit-date-and-time': '100' })
        })
    })

    it('should should set validation errors in flash and redirect if fully booked slot selected', () => {
      return request(sessionApp)
        .post('/visit/select-date-and-time')
        .send('visit-date-and-time=5')
        .expect(302)
        .expect('location', '/visit/select-date-and-time')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: '5' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { 'visit-date-and-time': '5' })
        })
    })
  })
})

describe('GET /visit/additional-support', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visit: {
        id: 'visitId',
        startTimestamp: '123',
        endTimestamp: '456',
        availableTables: 1,
        visitRoomName: 'room name',
      },
      visitors: [
        {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [
            {
              restrictionType: 'AVS',
              restrictionTypeDescription: 'AVS desc',
              startDate: '123',
              expiryDate: '456',
              globalRestriction: false,
              comment: 'comment',
            },
          ],
        },
      ],
    }

    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, { visitSessionData } as SessionData)
  })

  it('should render the additional support page with no options selected', () => {
    return request(sessionApp)
      .get('/visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(false)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(false)
      })
  })

  it('should render the additional support page, pre-populated with session data (for no requests)', () => {
    visitSessionData.additionalSupport = { required: false }

    return request(sessionApp)
      .get('/visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(false)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(true)
      })
  })

  it('should render the additional support page, pre-populated with session data (multiple requests)', () => {
    visitSessionData.additionalSupport = {
      required: true,
      keys: ['wheelchair', 'maskExempt', 'other'],
      other: 'custom request',
    }

    return request(sessionApp)
      .get('/visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(false)
        expect($('[data-test="wheelchair"]').prop('checked')).toBe(true)
        expect($('[data-test="inductionLoop"]').prop('checked')).toBe(false)
        expect($('[data-test="bslInterpreter"]').prop('checked')).toBe(false)
        expect($('[data-test="maskExempt"]').prop('checked')).toBe(true)
        expect($('[data-test="other"]').prop('checked')).toBe(true)
        expect($('#otherSupportDetails').val()).toBe('custom request')
      })
  })

  it('should render validation errors from flash data for no answer selected', () => {
    flashData.errors = [
      {
        msg: 'No answer selected',
        param: 'additionalSupportRequired',
        location: 'body',
      },
    ]

    return request(sessionApp)
      .get('/visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('.govuk-error-summary__body').text()).toContain('No answer selected')
        expect($('#additionalSupportRequired-error').text()).toContain('No answer selected')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })

  it('should render validation errors from flash data for support requested but none selected', () => {
    flashData.errors = [
      {
        value: [],
        msg: 'No request selected',
        param: 'additionalSupport',
        location: 'body',
      },
    ]

    flashData.formValues = [{ additionalSupportRequired: 'yes' }]

    return request(sessionApp)
      .get('/visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('.govuk-error-summary__body').text()).toContain('No request selected')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('#additionalSupport-error').text()).toContain('No request selected')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })

  it('should render validation errors from flash data when other support details not provided', () => {
    flashData.errors = [
      {
        value: '',
        msg: 'Enter details of the request',
        param: 'otherSupportDetails',
        location: 'body',
      },
    ]

    flashData.formValues = [{ additionalSupportRequired: 'yes', additionalSupport: ['wheelchair', 'other'] }]

    return request(sessionApp)
      .get('/visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('.govuk-error-summary__body').text()).toContain('Enter details of the request')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('[data-test="wheelchair"]').prop('checked')).toBe(true)
        expect($('[data-test="other"]').prop('checked')).toBe(true)
        expect($('#otherSupportDetails-error').text()).toContain('Enter details of the request')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })
})

describe('POST /visit/additional-support', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visit: {
        id: 'visitId',
        startTimestamp: '123',
        endTimestamp: '456',
        availableTables: 1,
        visitRoomName: 'room name',
      },
      visitors: [
        {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [
            {
              restrictionType: 'AVS',
              restrictionTypeDescription: 'AVS desc',
              startDate: '123',
              expiryDate: '456',
              globalRestriction: false,
              comment: 'comment',
            },
          ],
        },
      ],
    }
    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, { visitSessionData } as SessionData)
  })

  it('should set validation errors in flash and redirect if additional support question not answered', () => {
    return request(sessionApp)
      .post('/visit/additional-support')
      .expect(302)
      .expect('location', '/visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', param: 'additionalSupportRequired', value: undefined },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupport: [],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if invalid data supplied', () => {
    return request(sessionApp)
      .post('/visit/additional-support')
      .send('additionalSupportRequired=xyz')
      .expect(302)
      .expect('location', '/visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No answer selected', param: 'additionalSupportRequired', value: 'xyz' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'xyz',
          additionalSupport: [],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if additional support selected but no request selected', () => {
    return request(sessionApp)
      .post('/visit/additional-support')
      .send('additionalSupportRequired=yes')
      .expect(302)
      .expect('location', '/visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request selected', param: 'additionalSupport', value: [] },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: [],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if additional support selected but invalid request selected', () => {
    return request(sessionApp)
      .post('/visit/additional-support')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=xyz')
      .send('additionalSupport=wheelchair')
      .expect(302)
      .expect('location', '/visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request selected', param: 'additionalSupport', value: ['xyz', 'wheelchair'] },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: ['xyz', 'wheelchair'],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if other support requested but not specified', () => {
    return request(sessionApp)
      .post('/visit/additional-support')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=other')
      .expect(302)
      .expect('location', '/visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Enter details of the request', param: 'otherSupportDetails', value: '' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: ['other'],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect, overriding values set in session', () => {
    visitSessionData.additionalSupport = {
      required: false,
    }

    return request(sessionApp)
      .post('/visit/additional-support')
      .send('additionalSupportRequired=yes')
      .expect(302)
      .expect('location', '/visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request selected', param: 'additionalSupport', value: [] },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: [],
          otherSupportDetails: '',
        })
      })
  })

  it('should redirect to the select main contact page if "no" additional support radio selected and store in session', () => {
    return request(sessionApp)
      .post('/visit/additional-support')
      .send('additionalSupportRequired=no')
      .expect(302)
      .expect('location', '/visit/select-main-contact')
      .expect(() => {
        expect(visitSessionData.additionalSupport?.required).toBe(false)
      })
  })

  it('should redirect to the select main contact page when support requests chosen and store in session', () => {
    return request(sessionApp)
      .post('/visit/additional-support')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=wheelchair')
      .send('additionalSupport=inductionLoop')
      .send('additionalSupport=bslInterpreter')
      .send('additionalSupport=maskExempt')
      .send('additionalSupport=other')
      .send('otherSupportDetails=custom-request')
      .expect(302)
      .expect('location', '/visit/select-main-contact')
      .expect(() => {
        expect(visitSessionData.additionalSupport?.required).toBe(true)
        expect(visitSessionData.additionalSupport?.keys).toEqual([
          'wheelchair',
          'inductionLoop',
          'bslInterpreter',
          'maskExempt',
          'other',
        ])
        expect(visitSessionData.additionalSupport?.other).toBe('custom-request')
      })
  })
})

describe('GET /visit/check-your-booking', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visit: {
        id: 'visitId',
        startTimestamp: '2022-03-12T09:30:00',
        endTimestamp: '2022-03-12T10:30:00',
        availableTables: 1,
        visitRoomName: 'room name',
      },
      visitors: [
        {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [
            {
              restrictionType: 'AVS',
              restrictionTypeDescription: 'AVS desc',
              startDate: '123',
              expiryDate: '456',
              globalRestriction: false,
              comment: 'comment',
            },
          ],
          address: '123 Street,<br>Test Town,<br>S1 2QZ',
        },
      ],
      additionalSupport: {
        required: true,
        keys: ['wheelchair', 'inductionLoop'],
      },
      mainContact: {
        phoneNumber: '123',
        contactName: 'abc',
      },
    }
    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, { visitSessionData } as SessionData)
  })

  it('should render all data from the session', () => {
    return request(sessionApp)
      .get('/visit/check-your-booking')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Check the visit details before booking')
        expect($('.test-prisoner-name').text()).toContain('prisoner name')
        expect($('.test-prisoner-offenderno').text()).toContain('A1234BC')
        expect($('.test-prisoner-dateofbirth').text()).toContain('25 May 1988')
        expect($('.test-prisoner-location').text()).toContain('location place')
        expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
        expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
        expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
        expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
        expect($('.test-additional-support1').text()).toContain('Wheelchair ramp')
        expect($('.test-additional-support2').text()).toContain('Portable induction loop for people with hearing aids')
        expect($('.test-main-contact-name').text()).toContain('abc')
        expect($('.test-main-contact-number').text()).toContain('123')
      })
  })

  describe('when no additional support options are chosen', () => {
    beforeEach(() => {
      visitSessionData = {
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
        },
        visit: {
          id: 'visitId',
          startTimestamp: '2022-03-12T09:30:00',
          endTimestamp: '2022-03-12T10:30:00',
          availableTables: 1,
          visitRoomName: 'room name',
        },
        visitors: [
          {
            personId: 123,
            name: 'name last',
            relationshipDescription: 'relate',
            restrictions: [
              {
                restrictionType: 'AVS',
                restrictionTypeDescription: 'AVS desc',
                startDate: '123',
                expiryDate: '456',
                globalRestriction: false,
                comment: 'comment',
              },
            ],
            address: '123 Street,<br>Test Town,<br>S1 2QZ',
          },
        ],
        additionalSupport: {
          required: false,
          keys: [],
        },
        mainContact: {
          phoneNumber: '123',
          contactName: 'abc',
        },
      }
      sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, { visitSessionData } as SessionData)
    })

    it('should render all data from the session with a message for no selected additional support options', () => {
      return request(sessionApp)
        .get('/visit/check-your-booking')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Check the visit details before booking')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-prisoner-offenderno').text()).toContain('A1234BC')
          expect($('.test-prisoner-dateofbirth').text()).toContain('25 May 1988')
          expect($('.test-prisoner-location').text()).toContain('location place')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
          expect($('[data-test="no-addition-support-chosen"]').text()).toContain(
            'No additional support options were chosen.'
          )
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('123')
        })
    })
  })
})
