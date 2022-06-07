import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { VisitorListItem, VisitSessionData, VisitSlotList } from '../@types/bapv'
import { OffenderRestriction } from '../data/prisonApiTypes'
import PrisonerVisitorsService from '../services/prisonerVisitorsService'
import PrisonerProfileService from '../services/prisonerProfileService'
import VisitSessionsService from '../services/visitSessionsService'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import { Restriction } from '../data/prisonerContactRegistryApiTypes'
import { SupportType, Visit, VisitorSupport } from '../data/visitSchedulerApiTypes'
import * as visitorUtils from './visitorUtils'

jest.mock('../services/prisonerProfileService')
jest.mock('../services/prisonerVisitorsService')
jest.mock('../services/visitSessionsService')

let sessionApp: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`

let flashData: Record<'errors' | 'formValues', Record<string, string | string[]>[]>
let visitSessionData: VisitSessionData

const availableSupportTypes: SupportType[] = [
  {
    type: 'WHEELCHAIR',
    description: 'Wheelchair ramp',
  },
  {
    type: 'INDUCTION_LOOP',
    description: 'Portable induction loop for people with hearing aids',
  },
  {
    type: 'BSL_INTERPRETER',
    description: 'British Sign Language (BSL) Interpreter',
  },
  {
    type: 'MASK_EXEMPT',
    description: 'Face covering exemption',
  },
  {
    type: 'OTHER',
    description: 'Other',
  },
]

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    return flashData[key]
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /book-a-visit/select-visitors', () => {
  const visitorList: { visitors: VisitorListItem[] } = { visitors: [] }

  const prisonerVisitorsService = new PrisonerVisitorsService(null, systemToken) as jest.Mocked<PrisonerVisitorsService>

  const prisonerProfileService = new PrisonerProfileService(
    null,
    null,
    null,
    systemToken
  ) as jest.Mocked<PrisonerProfileService>

  let returnData: VisitorListItem[]
  let restrictions: OffenderRestriction[]

  beforeAll(() => {
    returnData = [
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
        banned: true,
      },
      {
        personId: 4322,
        name: 'Bob Smith',
        dateOfBirth: undefined,
        adult: undefined,
        relationshipDescription: 'Brother',
        address: '1st listed address',
        restrictions: [],
        banned: false,
      },
      {
        personId: 4324,
        name: 'Anne Smith',
        dateOfBirth: '2018-03-02',
        adult: false,
        relationshipDescription: 'Niece',
        address: 'Not entered',
        restrictions: [],
        banned: false,
      },
    ]

    restrictions = [
      {
        restrictionId: 0,
        comment: 'string',
        restrictionType: 'BAN',
        restrictionTypeDescription: 'Banned',
        startDate: '2022-03-15',
        expiryDate: '2022-03-15',
        active: true,
      },
    ]
  })

  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'John Smith',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
    }

    prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)
    prisonerProfileService.getRestrictions.mockResolvedValue(restrictions)

    sessionApp = appWithAllRoutes(null, prisonerProfileService, prisonerVisitorsService, null, systemToken, false, {
      visitorList,
      visitSessionData,
    } as SessionData)
  })

  it('should render the prisoner restrictions when they are present', () => {
    return request(sessionApp)
      .get('/book-a-visit/select-visitors')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.test-restrictions-type1').text().trim()).toBe('Banned')
        expect($('.test-restrictions-comment1').text().trim()).toBe('string')
        expect($('.test-restrictions-start-date1').text().trim()).toBe('15 March 2022')
        expect($('.test-restrictions-end-date1').text().trim()).toBe('15 March 2022')
      })
  })

  it('should render the prisoner restrictions when they are present, displaying a message if dates are not set', () => {
    restrictions = [
      {
        restrictionId: 0,
        comment: 'string',
        restrictionType: 'BAN',
        restrictionTypeDescription: 'Banned',
        startDate: '',
        expiryDate: '',
        active: true,
      },
    ]
    prisonerProfileService.getRestrictions.mockResolvedValue(restrictions)

    sessionApp = appWithAllRoutes(null, prisonerProfileService, prisonerVisitorsService, null, systemToken, false, {
      visitorList,
      visitSessionData,
    } as SessionData)

    return request(sessionApp)
      .get('/book-a-visit/select-visitors')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.test-restrictions-type1').text().trim()).toBe('Banned')
        expect($('.test-restrictions-comment1').text().trim()).toBe('string')
        expect($('.test-restrictions-start-date1').text().trim()).toBe('Not entered')
        expect($('.test-restrictions-end-date1').text().trim()).toBe('Not entered')
      })
  })

  it('should display a message when there are no prisoner restrictions', () => {
    prisonerProfileService.getRestrictions.mockResolvedValue([])

    sessionApp = appWithAllRoutes(null, prisonerProfileService, prisonerVisitorsService, null, systemToken, false, {
      visitorList,
      visitSessionData,
    } as SessionData)

    return request(sessionApp)
      .get('/book-a-visit/select-visitors')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('.test-no-prisoner-restrictions').text()).toBe('')
        expect($('.test-restrictions-type1').text()).toBe('')
        expect($('.test-restrictions-comment1').text().trim()).toBe('')
        expect($('.test-restrictions-start-date1').text().trim()).toBe('')
        expect($('.test-restrictions-end-date1').text().trim()).toBe('')
      })
  })

  it('should render the approved visitor list for offender number A1234BC with none selected and store visitorList in session', () => {
    return request(sessionApp)
      .get('/book-a-visit/select-visitors')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
        expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')

        expect($('#visitor-4321').length).toBe(1)
        expect($('#visitor-4321').prop('disabled')).toBe(true)
        expect($('[data-test="visitor-name-4321"]').text()).toBe('Jeanette Smith')
        expect($('[data-test="visitor-dob-4321"]').text()).toMatch(/28 July 1986.*Adult/)
        expect($('[data-test="visitor-relation-4321"]').text()).toContain('Sister')
        expect($('[data-test="visitor-address-4321"]').text()).toContain('123 The Street')
        const visitorRestrictions = $('[data-test="visitor-restrictions-4321"] .visitor-restriction')
        expect(visitorRestrictions.eq(0).text()).toContain('Banned until 31 July 2022')
        expect(visitorRestrictions.eq(0).text()).toContain('Ban details')
        expect(visitorRestrictions.eq(1).text()).toContain('Restricted End date not entered')
        expect(visitorRestrictions.eq(2).text()).toContain('Closed End date not entered')
        expect(visitorRestrictions.eq(3).text()).toContain('Non-Contact Visit End date not entered')

        expect($('#visitor-4322').prop('disabled')).toBe(false)
        expect($('[data-test="visitor-name-4322"]').text()).toBe('Bob Smith')
        expect($('[data-test="visitor-restrictions-4322"]').text()).toBe('None')

        expect($('#visitor-4324').prop('disabled')).toBe(false)
        expect($('[data-test="visitor-name-4324"]').text()).toBe('Anne Smith')
        expect($('[data-test="visitor-dob-4324"]').text()).toMatch(/2 March 2018.*Child/)

        expect($('input[name="visitors"]:checked').length).toBe(0)
        expect($('[data-test="submit"]').text().trim()).toBe('Continue')

        expect(visitorList.visitors).toEqual(returnData)
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
        banned: false,
      },
    ]

    return request(sessionApp)
      .get('/book-a-visit/select-visitors')
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
        banned: false,
      },
      {
        address: 'Not entered',
        adult: false,
        dateOfBirth: '2018-03-02',
        name: 'Anne Smith',
        personId: 4324,
        relationshipDescription: 'Niece',
        restrictions: [],
        banned: false,
      },
    ]

    return request(sessionApp)
      .get('/book-a-visit/select-visitors')
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
      .get('/book-a-visit/select-visitors')
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
    returnData = []
    prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

    return request(sessionApp)
      .get('/book-a-visit/select-visitors')
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

describe('POST /book-a-visit/select-visitors', () => {
  const adultVisitors: { adults: VisitorListItem[] } = { adults: [] }

  beforeEach(() => {
    const visitorList: { visitors: VisitorListItem[] } = {
      visitors: [
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
          ],
          banned: true,
        },
        {
          personId: 4322,
          name: 'Bob Smith',
          dateOfBirth: '1986-07-28',
          adult: true,
          relationshipDescription: 'Brother',
          address: '1st listed address',
          restrictions: [],
          banned: false,
        },
        {
          personId: 4323,
          name: 'Ted Smith',
          dateOfBirth: '1968-07-28',
          adult: true,
          relationshipDescription: 'Father',
          address: '1st listed address',
          restrictions: [],
          banned: false,
        },
        {
          personId: 4324,
          name: 'Anne Smith',
          dateOfBirth: '2018-03-02',
          adult: false,
          relationshipDescription: 'Niece',
          address: 'Not entered',
          restrictions: [],
          banned: false,
        },
        {
          personId: 4325,
          name: 'Bill Smith',
          dateOfBirth: '2018-03-02',
          adult: false,
          relationshipDescription: 'Nephew',
          address: 'Not entered',
          restrictions: [],
          banned: false,
        },
        {
          personId: 4326,
          name: 'John Jones',
          dateOfBirth: '1978-05-25',
          adult: true,
          relationshipDescription: 'Friend',
          address: 'Not entered',
          restrictions: [
            {
              restrictionType: 'CLOSED',
              restrictionTypeDescription: 'Closed',
              startDate: '2022-01-01',
            },
          ],
          banned: false,
        },
      ],
    }

    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
    }

    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
      adultVisitors,
      visitorList,
      visitSessionData,
    } as SessionData)
  })

  it('should save to session and redirect to the select date and time page if an adult is selected (OPEN visit)', () => {
    const returnAdult: VisitorListItem[] = [
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
    ]

    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .send('visitors=4322')
      .expect(302)
      .expect('location', '/book-a-visit/select-date-and-time')
      .expect(() => {
        expect(adultVisitors.adults).toEqual(returnAdult)
        expect(visitSessionData.visitors).toEqual(returnAdult)
        expect(visitSessionData.visitRestriction).toBe('OPEN')
        expect(visitSessionData.closedVisitReason).toBe(undefined)
      })
  })

  it('should save to session and redirect to the select date and time page if an adult with CLOSED restriction is selected (CLOSED visit)', () => {
    const returnAdult: VisitorListItem[] = [
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
      {
        address: 'Not entered',
        adult: true,
        dateOfBirth: '1978-05-25',
        name: 'John Jones',
        personId: 4326,
        relationshipDescription: 'Friend',
        restrictions: [
          {
            restrictionType: 'CLOSED',
            restrictionTypeDescription: 'Closed',
            startDate: '2022-01-01',
          },
        ],
        banned: false,
      },
    ]

    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .send('visitors=4322')
      .send('visitors=4326')
      .expect(302)
      .expect('location', '/book-a-visit/select-date-and-time')
      .expect(() => {
        expect(adultVisitors.adults).toEqual(returnAdult)
        expect(visitSessionData.visitors).toEqual(returnAdult)
        expect(visitSessionData.visitRestriction).toBe('CLOSED')
        expect(visitSessionData.closedVisitReason).toBe('visitor')
      })
  })

  it('should save to session and redirect to the select date and time page if an adult and a child are selected', () => {
    const returnAdult: VisitorListItem = {
      address: '1st listed address',
      adult: true,
      dateOfBirth: '1986-07-28',
      name: 'Bob Smith',
      personId: 4322,
      relationshipDescription: 'Brother',
      restrictions: [],
      banned: false,
    }

    const returnChild: VisitorListItem = {
      address: 'Not entered',
      adult: false,
      dateOfBirth: '2018-03-02',
      name: 'Anne Smith',
      personId: 4324,
      relationshipDescription: 'Niece',
      restrictions: [],
      banned: false,
    }

    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .send('visitors=4322&visitors=4324')
      .expect(302)
      .expect('location', '/book-a-visit/select-date-and-time')
      .expect(() => {
        expect(adultVisitors.adults).toEqual([returnAdult])
        expect(visitSessionData.visitors).toEqual([returnAdult, returnChild])
        expect(visitSessionData.visitRestriction).toBe('OPEN')
      })
  })

  it('should save new choice to session and redirect to select date and time page if existing session data present', () => {
    adultVisitors.adults = [
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
    ]

    visitSessionData.visitors = [
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
    ]

    const returnAdult: VisitorListItem = {
      personId: 4323,
      name: 'Ted Smith',
      dateOfBirth: '1968-07-28',
      adult: true,
      relationshipDescription: 'Father',
      address: '1st listed address',
      restrictions: [],
      banned: false,
    }

    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .send('visitors=4323')
      .expect(302)
      .expect('location', '/book-a-visit/select-date-and-time')
      .expect(() => {
        expect(adultVisitors.adults).toEqual([returnAdult])
        expect(visitSessionData.visitors).toEqual([returnAdult])
        expect(visitSessionData.visitRestriction).toBe('OPEN')
      })
  })

  it('should should set validation errors in flash and redirect if invalid visitor selected', () => {
    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .send('visitors=1234')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Add an adult to the visit', param: 'visitors', value: '1234' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '1234' })
      })
  })

  it('should should set validation errors in flash and redirect if banned is visitor selected', () => {
    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .send('visitors=4321')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Invalid selection', param: 'visitors', value: '4321' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '4321' })
      })
  })

  it('should set validation errors in flash and redirect if no visitors are selected', () => {
    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No visitors selected', param: 'visitors', value: undefined },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {})
      })
  })

  it('should set validation errors in flash and redirect if no adults are selected', () => {
    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .send('visitors=4324')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Add an adult to the visit', param: 'visitors', value: '4324' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '4324' })
      })
  })

  it('should set validation errors in flash and redirect if more than 2 adults are selected', () => {
    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .send('visitors=4322&visitors=4323&visitors=4326')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Select no more than 2 adults',
            param: 'visitors',
            value: ['4322', '4323', '4326'],
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: ['4322', '4323', '4326'] })
      })
  })

  it('should set validation errors in flash and redirect if more than 3 visitors are selected', () => {
    return request(sessionApp)
      .post('/book-a-visit/select-visitors')
      .send('visitors=4322&visitors=4323&visitors=4324&visitors=4325')
      .expect(302)
      .expect('location', '/book-a-visit/select-visitors')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          {
            location: 'body',
            msg: 'Select no more than 3 visitors with a maximum of 2 adults',
            param: 'visitors',
            value: ['4322', '4323', '4324', '4325'],
          },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: ['4322', '4323', '4324', '4325'] })
      })
  })
})

describe('/book-a-visit/select-date-and-time', () => {
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
      visitRestriction: 'OPEN',
      visitors: [
        {
          personId: 4323,
          name: 'Ted Smith',
          dateOfBirth: '1968-07-28',
          adult: true,
          relationshipDescription: 'Father',
          address: '1st listed address',
          restrictions: [],
          banned: false,
        },
      ],
    }
  })

  describe('GET /book-a-visit/select-date-and-time', () => {
    const visitSessionsService = new VisitSessionsService(
      null,
      null,
      null,
      systemToken
    ) as jest.Mocked<VisitSessionsService>

    beforeEach(() => {
      visitSessionsService.getVisitSessions.mockResolvedValue(slotsList)

      sessionApp = appWithAllRoutes(null, null, null, visitSessionsService, systemToken, false, {
        visitSessionData,
      } as SessionData)
    })

    it('should render the available sessions list with none selected', () => {
      return request(sessionApp)
        .get('/book-a-visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('[data-test="visit-restriction"]').text()).toBe('Open')
          expect($('[data-test="closed-visit-reason"]').length).toBe(0)
          expect($('input[name="visit-date-and-time"]').length).toBe(5)
          expect($('input[name="visit-date-and-time"]:checked').length).toBe(0)
          expect($('.govuk-accordion__section--expanded').length).toBe(0)
          expect($('[data-test="submit"]').text().trim()).toBe('Continue')
        })
    })

    it('should show message if no sessions are available', () => {
      visitSessionsService.getVisitSessions.mockResolvedValue({})

      sessionApp = appWithAllRoutes(null, null, null, visitSessionsService, systemToken, false, {
        visitSessionData,
      } as SessionData)

      return request(sessionApp)
        .get('/book-a-visit/select-date-and-time')
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
        .get('/book-a-visit/select-date-and-time')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select date and time of visit')
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('input[name="visit-date-and-time"]').length).toBe(5)
          expect($('.govuk-accordion__section--expanded').length).toBe(1)
          expect($('.govuk-accordion__section--expanded #3').length).toBe(1)
          expect($('input#3').prop('checked')).toBe(true)
          expect($('[data-test="submit"]').text().trim()).toBe('Continue')
        })
    })

    it('should render validation errors from flash data for invalid input', () => {
      flashData.errors = [{ location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time' }]

      return request(sessionApp)
        .get('/book-a-visit/select-date-and-time')
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

  describe('POST /book-a-visit/select-date-and-time', () => {
    const visitSessionsService = new VisitSessionsService(
      null,
      null,
      null,
      systemToken
    ) as jest.Mocked<VisitSessionsService>

    const createdVisit: Partial<Visit> = { reference: '2a-bc-3d-ef', visitStatus: 'RESERVED' }

    beforeEach(() => {
      visitSessionsService.createVisit = jest.fn().mockResolvedValue(createdVisit)
      visitSessionsService.updateVisit = jest.fn()

      sessionApp = appWithAllRoutes(null, null, null, visitSessionsService, systemToken, false, {
        slotsList,
        visitSessionData,
      } as SessionData)
    })

    it('should save to session, create visit and redirect to additional support page if slot selected', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-date-and-time')
        .send('visit-date-and-time=2')
        .expect(302)
        .expect('location', '/book-a-visit/additional-support')
        .expect(() => {
          expect(visitSessionData.visit).toEqual({
            id: '2',
            startTimestamp: '2022-02-14T11:59:00',
            endTimestamp: '2022-02-14T12:59:00',
            availableTables: 1,
            visitRoomName: 'room name',
          })
          expect(visitSessionsService.createVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.updateVisit).not.toHaveBeenCalled()
          expect(visitSessionData.visitReference).toEqual('2a-bc-3d-ef')
          expect(visitSessionData.visitStatus).toEqual('RESERVED')
        })
    })

    it('should save new choice to session, update visit reservation and redirect to additional support page if existing session data present', () => {
      visitSessionData.visit = {
        id: '1',
        startTimestamp: '2022-02-14T10:00:00',
        endTimestamp: '2022-02-14T11:00:00',
        availableTables: 15,
        visitRoomName: 'room name',
      }

      visitSessionData.visitReference = '3b-cd-4f-fg'

      return request(sessionApp)
        .post('/book-a-visit/select-date-and-time')
        .send('visit-date-and-time=3')
        .expect(302)
        .expect('location', '/book-a-visit/additional-support')
        .expect(() => {
          expect(visitSessionData.visit).toEqual({
            id: '3',
            startTimestamp: '2022-02-14T12:00:00',
            endTimestamp: '2022-02-14T13:05:00',
            availableTables: 5,
            visitRoomName: 'room name',
          })
          expect(visitSessionsService.createVisit).not.toHaveBeenCalled()
          expect(visitSessionsService.updateVisit).toHaveBeenCalledTimes(1)
          expect(visitSessionsService.updateVisit.mock.calls[0][0].visitData.visitReference).toBe('3b-cd-4f-fg')
        })
    })

    it('should should set validation errors in flash and redirect if no slot selected', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-date-and-time')
        .expect(302)
        .expect('location', '/book-a-visit/select-date-and-time')
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
        .post('/book-a-visit/select-date-and-time')
        .expect(302)
        .expect('location', '/book-a-visit/select-date-and-time?timeOfDay=afternoon&dayOfTheWeek=3')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: undefined },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {})
        })
    })

    it('should should set validation errors in flash and redirect if invalid slot selected', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-date-and-time')
        .send('visit-date-and-time=100')
        .expect(302)
        .expect('location', '/book-a-visit/select-date-and-time')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: '100' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { 'visit-date-and-time': '100' })
        })
    })

    it('should should set validation errors in flash and redirect if fully booked slot selected', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-date-and-time')
        .send('visit-date-and-time=5')
        .expect(302)
        .expect('location', '/book-a-visit/select-date-and-time')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No time slot selected', param: 'visit-date-and-time', value: '5' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { 'visit-date-and-time': '5' })
        })
    })
  })
})

describe('GET /book-a-visit/additional-support', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
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
          restrictions: [],
          banned: false,
        },
      ],
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }

    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
      availableSupportTypes,
      visitSessionData,
    } as SessionData)
  })

  it('should render the additional support page with no options selected', () => {
    return request(sessionApp)
      .get('/book-a-visit/additional-support')
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
    visitSessionData.visitorSupport = []

    return request(sessionApp)
      .get('/book-a-visit/additional-support')
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
    visitSessionData.visitorSupport = [
      { type: 'WHEELCHAIR' },
      { type: 'MASK_EXEMPT' },
      { type: 'OTHER', text: 'custom request' },
    ]

    return request(sessionApp)
      .get('/book-a-visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('[data-test="support-required-no"]').prop('checked')).toBe(false)
        expect($('[data-test="WHEELCHAIR"]').prop('checked')).toBe(true)
        expect($('[data-test="INDUCTION_LOOP"]').prop('checked')).toBe(false)
        expect($('[data-test="BSL_INTERPRETER"]').prop('checked')).toBe(false)
        expect($('[data-test="MASK_EXEMPT"]').prop('checked')).toBe(true)
        expect($('[data-test="OTHER"]').prop('checked')).toBe(true)
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
      .get('/book-a-visit/additional-support')
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
      .get('/book-a-visit/additional-support')
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

    flashData.formValues = [{ additionalSupportRequired: 'yes', additionalSupport: ['WHEELCHAIR', 'OTHER'] }]

    return request(sessionApp)
      .get('/book-a-visit/additional-support')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Is additional support needed for any of the visitors?')
        expect($('.govuk-error-summary__body').text()).toContain('Enter details of the request')
        expect($('[data-test="support-required-yes"]').prop('checked')).toBe(true)
        expect($('[data-test="WHEELCHAIR"]').prop('checked')).toBe(true)
        expect($('[data-test="OTHER"]').prop('checked')).toBe(true)
        expect($('#otherSupportDetails-error').text()).toContain('Enter details of the request')
        expect(flashProvider).toHaveBeenCalledWith('errors')
        expect(flashProvider).toHaveBeenCalledWith('formValues')
        expect(flashProvider).toHaveBeenCalledTimes(2)
      })
  })
})

describe('POST /book-a-visit/additional-support', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
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
          banned: false,
        },
      ],
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }
    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
      availableSupportTypes,
      visitSessionData,
    } as SessionData)
  })

  it('should set validation errors in flash and redirect if additional support question not answered', () => {
    return request(sessionApp)
      .post('/book-a-visit/additional-support')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
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
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=xyz')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
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
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
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
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=xyz')
      .send('additionalSupport=WHEELCHAIR')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'No request selected', param: 'additionalSupport', value: ['xyz', 'WHEELCHAIR'] },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: ['xyz', 'WHEELCHAIR'],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect if other support requested but not specified', () => {
    return request(sessionApp)
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=OTHER')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
      .expect(() => {
        expect(flashProvider).toHaveBeenCalledWith('errors', [
          { location: 'body', msg: 'Enter details of the request', param: 'otherSupportDetails', value: '' },
        ])
        expect(flashProvider).toHaveBeenCalledWith('formValues', {
          additionalSupportRequired: 'yes',
          additionalSupport: ['OTHER'],
          otherSupportDetails: '',
        })
      })
  })

  it('should set validation errors in flash and redirect, overriding values set in session', () => {
    visitSessionData.visitorSupport = []

    return request(sessionApp)
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .expect(302)
      .expect('location', '/book-a-visit/additional-support')
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
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=no')
      .expect(302)
      .expect('location', '/book-a-visit/select-main-contact')
      .expect(() => {
        expect(visitSessionData.visitorSupport.length).toBe(0)
      })
  })

  it('should redirect to the select main contact page when support requests chosen and store in session', () => {
    return request(sessionApp)
      .post('/book-a-visit/additional-support')
      .send('additionalSupportRequired=yes')
      .send('additionalSupport=WHEELCHAIR')
      .send('additionalSupport=INDUCTION_LOOP')
      .send('additionalSupport=BSL_INTERPRETER')
      .send('additionalSupport=MASK_EXEMPT')
      .send('additionalSupport=OTHER')
      .send('otherSupportDetails=custom-request')
      .expect(302)
      .expect('location', '/book-a-visit/select-main-contact')
      .expect(() => {
        expect(visitSessionData.visitorSupport).toEqual(<VisitorSupport[]>[
          { type: 'WHEELCHAIR' },
          { type: 'INDUCTION_LOOP' },
          { type: 'BSL_INTERPRETER' },
          { type: 'MASK_EXEMPT' },
          {
            type: 'OTHER',
            text: 'custom-request',
          },
        ])
      })
  })
})

describe('/book-a-visit/select-main-contact', () => {
  const adultVisitors: { adults: VisitorListItem[] } = {
    adults: [
      {
        personId: 123,
        name: 'name last',
        relationshipDescription: 'relate',
        restrictions: [],
        banned: false,
      },
    ],
  }

  const visitorList: { visitors: VisitorListItem[] } = {
    visitors: [
      {
        personId: 122,
        name: 'first last',
        relationshipDescription: 'cousin',
        restrictions: [],
        banned: false,
      },
      {
        personId: 123,
        name: 'name last',
        relationshipDescription: 'relate',
        restrictions: [],
        banned: false,
      },
    ],
  }

  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
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
          restrictions: [],
          banned: false,
        },
      ],
      visitorSupport: [],
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }

    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
      adultVisitors,
      visitorList,
      visitSessionData,
    } as SessionData)
  })

  describe('GET /book-a-visit/select-main-contact', () => {
    it('should render the main contact page with all fields empty', () => {
      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('input[name="contact"]').length).toBe(2)
          expect($('input[name="contact"]:checked').length).toBe(0)
          expect($('input[name="contact"]').eq(0).prop('value')).toBe('123')
          expect($('input[name="contact"]').eq(1).prop('value')).toBe('someoneElse')
          expect($('#someoneElseName').prop('value')).toBeFalsy()
          expect($('#phoneNumber').prop('value')).toBeFalsy()
        })
    })

    it('should render the main contact page, pre-populated with session data for contact choice and phone number', () => {
      visitSessionData.mainContact = {
        contact: {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [],
          banned: false,
        },
        phoneNumber: '0114 1234 567',
      }

      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('input[name="contact"]').length).toBe(2)
          expect($('input[name="contact"]:checked').length).toBe(1)
          expect($('input[value="123"]').prop('checked')).toBe(true)
          expect($('#someoneElseName').prop('value')).toBeFalsy()
          expect($('#phoneNumber').prop('value')).toBe('0114 1234 567')
        })
    })

    it('should render the main contact page, pre-populated with session data for custom contact name and phone number', () => {
      visitSessionData.mainContact = {
        contact: undefined,
        contactName: 'another person',
        phoneNumber: '0114 1122 333',
      }

      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('input[name="contact"]').length).toBe(2)
          expect($('input[name="contact"]:checked').length).toBe(1)
          expect($('input[value="someoneElse"]').prop('checked')).toBe(true)
          expect($('#someoneElseName').prop('value')).toBe('another person')
          expect($('#phoneNumber').prop('value')).toBe('0114 1122 333')
        })
    })

    it('should render validation errors from flash data for when no data entered', () => {
      flashData.errors = [
        { location: 'body', msg: 'No main contact selected', param: 'contact', value: undefined },
        { location: 'body', msg: 'Enter a phone number', param: 'phoneNumber', value: undefined },
      ]

      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('.govuk-error-summary__body').text()).toContain('No main contact selected')
          expect($('.govuk-error-summary__body').text()).toContain('Enter a phone number')
          expect($('#contact-error').text()).toContain('No main contact selected')
          expect($('#phoneNumber-error').text()).toContain('Enter a phone number')
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
          expect(flashProvider).toHaveBeenCalledTimes(2)
        })
    })

    it('should render validation errors from flash data for when no data entered', () => {
      flashData.errors = [
        { location: 'body', msg: 'Enter the name of the main contact', param: 'someoneElseName', value: '' },
        { location: 'body', msg: 'Enter a phone number', param: 'phoneNumber', value: '' },
      ]

      flashData.formValues = [{ contact: 'someoneElse' }]

      return request(sessionApp)
        .get('/book-a-visit/select-main-contact')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Who is the main contact for this booking?')
          expect($('.govuk-error-summary__body').text()).toContain('Enter the name of the main contact')
          expect($('.govuk-error-summary__body').text()).toContain('Enter a phone number')
          expect($('#someoneElseName-error').text()).toContain('Enter the name of the main contact')
          expect($('#phoneNumber-error').text()).toContain('Enter a phone number')
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
          expect(flashProvider).toHaveBeenCalledTimes(2)
        })
    })
  })

  describe('POST /book-a-visit/select-main-contact', () => {
    it('should redirect to check answers page and store in session if contact selected and phone number entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=123')
        .send('phoneNumber=0114+1234+567')
        .expect(302)
        .expect('location', '/book-a-visit/check-your-booking')
        .expect(() => {
          expect(visitSessionData.mainContact.contact).toEqual({
            personId: 123,
            name: 'name last',
            relationshipDescription: 'relate',
            restrictions: [],
            banned: false,
          })
          expect(visitSessionData.mainContact.phoneNumber).toBe('0114 1234 567')
          expect(visitSessionData.mainContact.contactName).toBe(undefined)
        })
    })

    it('should redirect to check answers page and store in session if other contact named and phone number entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=someoneElse')
        .send('someoneElseName=another+person')
        .send('phoneNumber=0114+7654+321')
        .expect(302)
        .expect('location', '/book-a-visit/check-your-booking')
        .expect(() => {
          expect(visitSessionData.mainContact.contact).toBe(undefined)
          expect(visitSessionData.mainContact.contactName).toBe('another person')
          expect(visitSessionData.mainContact.phoneNumber).toBe('0114 7654 321')
        })
    })

    it('should save new choice to session and redirect to check answers page if existing session data present', () => {
      visitSessionData.mainContact = {
        contact: {
          personId: 123,
          name: 'name last',
          relationshipDescription: 'relate',
          restrictions: [],
          banned: false,
        },
        phoneNumber: '0114 1234 567',
        contactName: undefined,
      }
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=someoneElse')
        .send('someoneElseName=another+person')
        .send('phoneNumber=0114+7654+321')
        .expect(302)
        .expect('location', '/book-a-visit/check-your-booking')
        .expect(() => {
          expect(visitSessionData.mainContact.contact).toBe(undefined)
          expect(visitSessionData.mainContact.contactName).toBe('another person')
          expect(visitSessionData.mainContact.phoneNumber).toBe('0114 7654 321')
        })
    })

    it('should set validation errors in flash and redirect if no main contact selected and no number entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .expect(302)
        .expect('location', '/book-a-visit/select-main-contact')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No main contact selected', param: 'contact', value: undefined },
            { location: 'body', msg: 'Enter a phone number', param: 'phoneNumber', value: undefined },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {})
        })
    })

    it('should set validation errors in flash and redirect if someone else selected but no name entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=someoneElse')
        .send('someoneElseName=')
        .send('phoneNumber=')
        .expect(302)
        .expect('location', '/book-a-visit/select-main-contact')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'Enter the name of the main contact', param: 'someoneElseName', value: '' },
            { location: 'body', msg: 'Enter a phone number', param: 'phoneNumber', value: '' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {
            contact: 'someoneElse',
            someoneElseName: '',
            phoneNumber: '',
          })
        })
    })

    it('should set validation errors in flash and redirect if invalid data entered', () => {
      return request(sessionApp)
        .post('/book-a-visit/select-main-contact')
        .send('contact=non-existant')
        .send('phoneNumber=abc123')
        .expect(302)
        .expect('location', '/book-a-visit/select-main-contact')
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'Enter a valid UK phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192',
              param: 'phoneNumber',
              value: 'abc123',
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {
            contact: 'non-existant',
            phoneNumber: 'abc123',
          })
        })
    })
  })
})

describe('GET /book-a-visit/check-your-booking', () => {
  beforeEach(() => {
    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
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
          banned: false,
        },
      ],
      visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'INDUCTION_LOOP' }],
      mainContact: {
        phoneNumber: '123',
        contactName: 'abc',
      },
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'RESERVED',
    }
    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
      availableSupportTypes,
      visitSessionData,
    } as SessionData)
  })

  it('should render all data from the session', () => {
    return request(sessionApp)
      .get('/book-a-visit/check-your-booking')
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
        expect($('.test-visit-type').text()).toContain('Open')
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
        visitRestriction: 'OPEN',
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
            banned: false,
          },
        ],
        visitorSupport: [],
        mainContact: {
          phoneNumber: '123',
          contactName: 'abc',
        },
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'RESERVED',
      }
      sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, { visitSessionData } as SessionData)
    })

    it('should render all data from the session with a message for no selected additional support options', () => {
      return request(sessionApp)
        .get('/book-a-visit/check-your-booking')
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
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('.test-visitor-address1').text()).toContain('123 Street, Test Town, S1 2QZ')
          expect($('.test-additional-support1').text()).toContain('None')
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('123')
        })
    })
  })
})

describe('GET /book-a-visit/confirmation', () => {
  beforeEach(() => {
    jest.spyOn(visitorUtils, 'clearSession')

    visitSessionData = {
      prisoner: {
        name: 'prisoner name',
        offenderNo: 'A1234BC',
        dateOfBirth: '25 May 1988',
        location: 'location place',
      },
      visitRestriction: 'OPEN',
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
          banned: false,
        },
      ],
      visitorSupport: [{ type: 'WHEELCHAIR' }, { type: 'INDUCTION_LOOP' }],
      mainContact: {
        phoneNumber: '123',
        contactName: 'abc',
      },
      visitReference: 'ab-cd-ef-gh',
      visitStatus: 'BOOKED',
    }
    sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
      availableSupportTypes,
      visitSessionData,
    } as SessionData)
  })

  it('should render all data from the session', () => {
    return request(sessionApp)
      .get('/book-a-visit/confirmation')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toBe('Booking confirmed')
        expect($('.test-prisoner-name').text()).toContain('prisoner name')
        expect($('.test-prisoner-location').text()).toContain('location place')
        expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
        expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
        expect($('.test-visit-type').text()).toContain('Open')
        expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
        expect($('.test-additional-support1').text()).toContain('Wheelchair ramp')
        expect($('.test-additional-support2').text()).toContain('Portable induction loop for people with hearing aids')
        expect($('.test-main-contact-name').text()).toContain('abc')
        expect($('.test-main-contact-number').text()).toContain('123')
        expect($('.test-booking-reference').text()).toContain('ab-cd-ef-gh')

        expect(visitorUtils.clearSession).toBeCalledTimes(1)
      })
  })

  describe('when no additional support options are chosen', () => {
    beforeEach(() => {
      jest.spyOn(visitorUtils, 'clearSession')

      visitSessionData = {
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
        },
        visitRestriction: 'OPEN',
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
            banned: false,
          },
        ],
        visitorSupport: [],
        mainContact: {
          phoneNumber: '123',
          contactName: 'abc',
        },
        visitReference: 'ab-cd-ef-gh',
        visitStatus: 'BOOKED',
      }
      sessionApp = appWithAllRoutes(null, null, null, null, systemToken, false, {
        availableSupportTypes,
        visitSessionData,
      } as SessionData)
    })

    it('should render all data from the session with a message for no selected additional support options', () => {
      return request(sessionApp)
        .get('/book-a-visit/confirmation')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Booking confirmed')
          expect($('.test-prisoner-name').text()).toContain('prisoner name')
          expect($('.test-prisoner-location').text()).toContain('location place')
          expect($('.test-visit-date').text()).toContain('Saturday 12 March 2022')
          expect($('.test-visit-time').text()).toContain('9:30am to 10:30am')
          expect($('.test-visit-type').text()).toContain('Open')
          expect($('.test-visitor-name1').text()).toContain('name last (relate of the prisoner)')
          expect($('[data-test="no-addition-support-chosen"]').text()).toContain('None.')
          expect($('.test-main-contact-name').text()).toContain('abc')
          expect($('.test-main-contact-number').text()).toContain('123')
          expect($('.test-booking-reference').text()).toContain('ab-cd-ef-gh')

          expect(visitorUtils.clearSession).toBeCalledTimes(1)
        })
    })
  })
})
