import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { FlashData, VisitorListItem, VisitSessionData } from '../../@types/bapv'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { Restriction } from '../../data/prisonerContactRegistryApiTypes'
import { createMockPrisonerVisitorsService, createMockSupportedPrisonsService } from '../../services/testutils/mocks'
import TestData from '../testutils/testData'

let sessionApp: Express

let flashData: FlashData

const prisonerVisitorsService = createMockPrisonerVisitorsService()
const supportedPrisonsService = createMockSupportedPrisonsService()

let visitSessionData: VisitSessionData

// run tests for booking and update journeys
const testJourneys = [
  { urlPrefix: '/book-a-visit', isUpdate: false },
  { urlPrefix: '/visit/ab-cd-ef-gh/update', isUpdate: true },
]

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => {
    return flashData[key]
  })
})

afterEach(() => {
  jest.resetAllMocks()
  jest.useRealTimers()
})

testJourneys.forEach(journey => {
  describe(`GET ${journey.urlPrefix}/select-visitors`, () => {
    const visitorList: { visitors: VisitorListItem[] } = { visitors: [] }

    let returnData: VisitorListItem[]
    const restrictions = [TestData.offenderRestriction({ expiryDate: '2022-03-15' })]
    const alerts = [TestData.alert({ dateExpires: '2022-03-15' })]

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
          adult: true,
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
    })

    beforeEach(() => {
      visitSessionData = {
        allowOverBooking: false,
        prisoner: {
          name: 'John Smith',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
          activeAlerts: [],
          restrictions: [],
        },
        visitRestriction: 'OPEN',
        visitReference: 'ab-cd-ef-gh',
      }

      prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

      sessionApp = appWithAllRoutes({
        services: { prisonerVisitorsService },
        sessionData: {
          visitorList,
          visitSessionData,
        } as SessionData,
      })
    })

    it('should render the prisoner restrictions and alerts when they are present', () => {
      visitSessionData.prisoner.restrictions = restrictions
      visitSessionData.prisoner.activeAlerts = alerts
      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=restrictions-type1]').text().trim()).toBe('Restricted')
          expect($('[data-test=restrictions-comment1]').text().trim()).toBe('Details about this restriction')
          expect($('[data-test=restrictions-end-date1]').text().trim()).toBe('15 March 2022')
          expect($('[data-test=alert-type1]').text().trim()).toBe('Protective Isolation Unit')
          expect($('[data-test=alert-comment1]').text().trim()).toBe('Alert comment')
          expect($('[data-test=alert-end-date1]').text().trim()).toBe('15 March 2022')
        })
    })

    it('should render the prisoner restrictions and alerts when they are present, displaying a message if dates are not set', () => {
      visitSessionData.prisoner.restrictions = [TestData.offenderRestriction()]
      visitSessionData.prisoner.activeAlerts = [TestData.alert()]

      sessionApp = appWithAllRoutes({
        services: { prisonerVisitorsService },
        sessionData: {
          visitorList,
          visitSessionData,
        } as SessionData,
      })

      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=restrictions-type1]').text().trim()).toBe('Restricted')
          expect($('[data-test=restrictions-comment1]').text().trim()).toBe('Details about this restriction')
          expect($('[data-test=restrictions-end-date1]').text().trim()).toBe('No end date')
          expect($('[data-test=alert-type1]').text().trim()).toBe('Protective Isolation Unit')
          expect($('[data-test=alert-comment1]').text().trim()).toBe('Alert comment')
          expect($('[data-test=alert-end-date1]').text().trim()).toBe('No end date')
        })
    })

    it('should display a message when there are no prisoner restrictions or alerts', () => {
      sessionApp = appWithAllRoutes({
        services: { prisonerVisitorsService },
        sessionData: {
          visitorList,
          visitSessionData,
        } as SessionData,
      })

      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=no-prisoner-restrictions]').text()).toBe('')
          expect($('[data-test=restrictions-type1]').text()).toBe('')
          expect($('[data-test=restrictions-comment1]').text().trim()).toBe('')
          expect($('[data-test=restrictions-end-date1]').text().trim()).toBe('')
          expect($('[data-test=alert-type1]').text()).toBe('')
          expect($('[data-test=alert-comment1]').text().trim()).toBe('')
          expect($('[data-test=alert-end-date1]').text().trim()).toBe('')
        })
    })

    it('should render the approved visitor list for offender number A1234BC with none selected and store visitorList in session', () => {
      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')

          expect($('#visitor-4321').length).toBe(1)
          expect($('#visitor-4321').prop('disabled')).toBe(true)
          expect($('[data-test="visitor-name-4321"]').text()).toBe('Jeanette Smith')
          expect($('[data-test="visitor-dob-4321"]').text()).toContain('28 July 1986')
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
          expect($('[data-test="visitor-dob-4324"]').text()).toContain('2 March 2018')

          expect($('input[name="visitors"]:checked').length).toBe(0)
          expect($('[data-test="submit"]').text().trim()).toBe('Continue')

          expect(visitorList.visitors).toEqual(returnData)
        })
    })

    it('should render the approved visitor list for offender number A1234BC with those in session (single) selected', () => {
      visitSessionData.visitors = [
        {
          address: '1st listed address',
          dateOfBirth: undefined,
          adult: true,
          name: 'Bob Smith',
          personId: 4322,
          relationshipDescription: 'Brother',
          restrictions: [],
          banned: false,
        },
      ]

      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
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
          dateOfBirth: undefined,
          adult: true,
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
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
          expect($('input[name="visitors"]').length).toBe(3)
          expect($('#visitor-4321').prop('checked')).toBe(false)
          expect($('#visitor-4322').prop('checked')).toBe(true)
          expect($('#visitor-4324').prop('checked')).toBe(true)
          expect($('[data-test="submit"]').text().trim()).toBe('Continue')
        })
    })

    it('should render validation errors from flash data for invalid input', () => {
      flashData.errors = [
        { location: 'body', msg: 'No visitors selected', path: 'visitors', type: 'field', value: undefined },
      ]

      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
          expect($('.govuk-error-summary__body').text()).toContain('No visitors selected')
          expect($('.govuk-error-summary__body a').attr('href')).toBe('#visitors-error')
          expect($('#visitors-error').text()).toContain('No visitors selected')
          expect(flashProvider).toHaveBeenCalledWith('errors')
          expect(flashProvider).toHaveBeenCalledWith('formValues')
          expect(flashProvider).toHaveBeenCalledTimes(2)
        })
    })

    it('should show message and back to start button for prisoner with no approved visitors', () => {
      returnData = []
      prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
          expect($('input[name="visitors"]').length).toBe(0)
          expect($('#main-content').text()).toContain('There are no approved visitors for this prisoner.')
          expect($('[data-test="submit"]').length).toBe(0)
          expect($('[data-test="back-to-start"]').length).toBe(1)
        })
    })

    it('should show back to start button and warning message if only child visitors listed', () => {
      returnData = [
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
      prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
          expect($('input[name="visitors"]').length).toBe(1)
          expect($('[data-test="submit"]').length).toBe(0)
          expect($('[data-test="back-to-start"]').length).toBe(1)
          expect($('#visitor-4324').attr('disabled')).toBe('disabled')
          expect($('.govuk-warning-text__text').text().replace(/\s+/g, ' ')).toContain(
            'There are no approved visitors over 18 for this prisoner. A booking cannot be made at this time.',
          )
        })
    })

    it('should show not disable child visitors if an unbanned adult visitor is also present', () => {
      returnData = [
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
          personId: 4322,
          name: 'Bob Smith',
          dateOfBirth: undefined,
          adult: true,
          relationshipDescription: 'Brother',
          address: '1st listed address',
          restrictions: [],
          banned: false,
        },
      ]
      prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
          expect($('input[name="visitors"]').length).toBe(2)
          expect($('[data-test="submit"]').length).toBe(1)
          expect($('[data-test="back-to-start"]').length).toBe(0)
          expect($('#visitor-4324').attr('disabled')).toBe(undefined)
          expect($('#visitor-4322').attr('disabled')).toBe(undefined)
        })
    })

    it('should show back to start button and warning message if only banned visitors listed', () => {
      returnData = [
        {
          personId: 3984,
          name: 'John Smith',
          dateOfBirth: '2000-03-02',
          adult: true,
          relationshipDescription: 'Uncle',
          address: 'Not entered',
          restrictions: [],
          banned: true,
        },
      ]
      prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)

      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('h1').text().trim()).toBe('Select visitors from the prisoner’s approved visitor list')
          expect($('input[name="visitors"]').length).toBe(1)
          expect($('[data-test="submit"]').length).toBe(0)
          expect($('[data-test="back-to-start"]').length).toBe(1)
          expect($('#visitor-3984').attr('disabled')).toBe('disabled')
          expect($('.govuk-warning-text__text').text().replace(/\s+/g, ' ')).toContain(
            'There are no permitted visitors over 18 for this prisoner. A booking cannot be made at this time.',
          )
        })
    })

    it('should display prison specific visitor allowances for the selected establishment', () => {
      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('[data-test=visitors-max-total]').text()).toBe('6 people')
          expect($('[data-test=prison-name]').text()).toBe('Hewell (HMP)')
          expect($('[data-test=visitors-max-adults]').text()).toBe('3 people')
          expect($('[data-test=visitors-max-children]').text()).toBe('4 people')
          expect($('[data-test=visitors-adult-age]').eq(0).text()).toBe('18 years')
          expect($('[data-test=visitors-adult-age]').eq(1).text()).toBe('18 years')
        })
    })
  })

  describe(`POST ${journey.urlPrefix}/select-visitors`, () => {
    const adultVisitors: { adults: VisitorListItem[] } = { adults: [] }
    const visitReference = 'ab-cd-ef-gh'

    const visitorList: { visitors: VisitorListItem[] } = {
      visitors: [
        {
          personId: 4000,
          name: 'Keith Daniels',
          dateOfBirth: '1980-02-28',
          adult: true,
          relationshipDescription: 'Brother',
          address: 'Not entered',
          restrictions: [
            {
              restrictionType: 'BAN',
              restrictionTypeDescription: 'Banned',
              startDate: '2022-01-01',
              expiryDate: '2023-12-14',
              comment: 'Ban details',
            },
          ],
          banned: false,
        },
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

    beforeEach(() => {
      adultVisitors.adults = []

      visitSessionData = {
        allowOverBooking: false,
        prisoner: {
          name: 'prisoner name',
          offenderNo: 'A1234BC',
          dateOfBirth: '25 May 1988',
          location: 'location place',
          restrictions: [],
        },
        visitRestriction: 'OPEN',
        visitReference,
      }

      sessionApp = appWithAllRoutes({
        sessionData: {
          adultVisitors,
          visitorList,
          visitSessionData,
        } as SessionData,
      })
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
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=4322')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-date-and-time`)
        .expect(() => {
          expect(adultVisitors.adults).toEqual(returnAdult)
          expect(visitSessionData.visitors).toEqual(returnAdult)
          expect(visitSessionData.visitRestriction).toBe('OPEN')
        })
    })

    it('should save to session and redirect to the select date and time page if VISITOR with CLOSED restriction is selected (CLOSED visit)', () => {
      const returnAdult: VisitorListItem[] = [
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
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=4326')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-date-and-time`)
        .expect(() => {
          expect(adultVisitors.adults).toEqual(returnAdult)
          expect(visitSessionData.visitors).toEqual(returnAdult)
          expect(visitSessionData.visitRestriction).toBe('CLOSED')
        })
    })

    it('should save to session and redirect to the select date and time page if prisoner and visitor both have CLOSED restriction (CLOSED visit)', () => {
      visitSessionData.prisoner.restrictions = [
        {
          restrictionId: 12345,
          restrictionType: 'CLOSED',
          restrictionTypeDescription: 'Closed',
          startDate: '2022-05-16',
          active: true,
        },
      ]

      const returnAdult: VisitorListItem[] = [
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
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=4326')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-date-and-time`)
        .expect(() => {
          expect(adultVisitors.adults).toEqual(returnAdult)
          expect(visitSessionData.visitors).toEqual(returnAdult)
          expect(visitSessionData.visitRestriction).toBe('CLOSED')
        })
    })

    it('should save to session and redirect to open/closed visit choice if prisoner has CLOSED restriction and visitor not CLOSED', () => {
      visitSessionData.prisoner.restrictions = [
        {
          restrictionId: 12345,
          restrictionType: 'CLOSED',
          restrictionTypeDescription: 'Closed',
          startDate: '2022-05-16',
          active: true,
        },
      ]

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
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=4322')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/visit-type`)
        .expect(() => {
          expect(adultVisitors.adults).toEqual(returnAdult)
          expect(visitSessionData.visitors).toEqual(returnAdult)
          expect(visitSessionData.visitRestriction).toBe('OPEN')
        })
    })

    it('should save to session and add earliestDate to visitSessionData', () => {
      const fakeDateTime = new Date('2023-12-01T09:00')
      jest.useFakeTimers({ advanceTimers: true, now: new Date(fakeDateTime) })

      const returnAdult: VisitorListItem = {
        personId: 4000,
        name: 'Keith Daniels',
        dateOfBirth: '1980-02-28',
        adult: true,
        relationshipDescription: 'Brother',
        address: 'Not entered',
        restrictions: [
          {
            restrictionType: 'BAN',
            restrictionTypeDescription: 'Banned',
            startDate: '2022-01-01',
            expiryDate: '2023-12-14',
            comment: 'Ban details',
          },
        ],
        banned: false,
      }

      const returnChild: VisitorListItem = {
        personId: 4324,
        name: 'Anne Smith',
        dateOfBirth: '2018-03-02',
        adult: false,
        relationshipDescription: 'Niece',
        address: 'Not entered',
        restrictions: [],
        banned: false,
      }

      return request(sessionApp)
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=4324&visitors=4000')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-date-and-time`)
        .expect(() => {
          expect(adultVisitors.adults).toEqual([returnAdult])
          expect(visitSessionData.visitors).toEqual([returnAdult, returnChild])
          expect(visitSessionData.daysUntilBanExpiry).toBe(13)
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
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=4322&visitors=4324')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-date-and-time`)
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
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=4323')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-date-and-time`)
        .expect(() => {
          expect(adultVisitors.adults).toEqual([returnAdult])
          expect(visitSessionData.visitors).toEqual([returnAdult])
          expect(visitSessionData.visitRestriction).toBe('OPEN')
        })
    })

    it('should should set validation errors in flash and redirect if invalid visitor selected', () => {
      return request(sessionApp)
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=1234')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-visitors`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'Add an adult to the visit', path: 'visitors', type: 'field', value: '1234' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '1234' })
        })
    })

    it('should should set validation errors in flash and redirect if banned is visitor selected', () => {
      return request(sessionApp)
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=4321')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-visitors`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'Invalid selection', path: 'visitors', type: 'field', value: '4321' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '4321' })
        })
    })

    it('should set validation errors in flash and redirect if no visitors are selected', () => {
      return request(sessionApp)
        .post(`${journey.urlPrefix}/select-visitors`)
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-visitors`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'No visitors selected', path: 'visitors', type: 'field', value: undefined },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', {})
        })
    })

    it('should set validation errors in flash and redirect if no adults are selected', () => {
      return request(sessionApp)
        .post(`${journey.urlPrefix}/select-visitors`)
        .send('visitors=4324')
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-visitors`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            { location: 'body', msg: 'Add an adult to the visit', path: 'visitors', type: 'field', value: '4324' },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: '4324' })
        })
    })

    describe('Maximum total number of visitors', () => {
      it('should allow up to the maximum configured number of visitors', () => {
        const maxTotalVisitors = 2
        const visitors = ['4322', '4323']

        supportedPrisonsService.getPrison.mockResolvedValue(TestData.prison({ maxTotalVisitors }))
        supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)

        sessionApp = appWithAllRoutes({
          services: { prisonerVisitorsService, supportedPrisonsService },
          sessionData: {
            adultVisitors,
            visitorList,
            visitSessionData,
          } as SessionData,
        })

        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-visitors`)
          .send({ visitors })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-date-and-time`)
          .expect(() => {
            expect(visitSessionData.visitors.length).toEqual(2)
          })
      })

      it('should set validation errors in flash and redirect if more than the maximum configured visitors are selected', () => {
        const maxTotalVisitors = 2
        const visitors = ['4322', '4323', '4324']

        supportedPrisonsService.getPrison.mockResolvedValue(TestData.prison({ maxTotalVisitors }))
        supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)

        sessionApp = appWithAllRoutes({
          services: { prisonerVisitorsService, supportedPrisonsService },
          sessionData: {
            adultVisitors,
            visitorList,
            visitSessionData,
          } as SessionData,
        })
        return request(sessionApp)
          .post(`${journey.urlPrefix}/select-visitors`)
          .send({ visitors })
          .expect(302)
          .expect('location', `${journey.urlPrefix}/select-visitors`)
          .expect(() => {
            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: `Select no more than ${maxTotalVisitors} visitors`,
                path: 'visitors',
                type: 'field',
                value: visitors,
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors })
          })
      })
    })
  })
})
