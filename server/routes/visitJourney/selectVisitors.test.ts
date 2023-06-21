import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import * as cheerio from 'cheerio'
import { FlashData, VisitorListItem, VisitSessionData } from '../../@types/bapv'
import { OffenderRestriction } from '../../data/prisonApiTypes'
import { appWithAllRoutes, flashProvider } from '../testutils/appSetup'
import { Restriction } from '../../data/prisonerContactRegistryApiTypes'
import { createMockPrisonerProfileService, createMockPrisonerVisitorsService } from '../../services/testutils/mocks'

let sessionApp: Express

let flashData: FlashData

const prisonerVisitorsService = createMockPrisonerVisitorsService()
const prisonerProfileService = createMockPrisonerProfileService()

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
})

testJourneys.forEach(journey => {
  describe(`GET ${journey.urlPrefix}/select-visitors`, () => {
    const visitorList: { visitors: VisitorListItem[] } = { visitors: [] }

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
        visitReference: 'ab-cd-ef-gh',
      }

      prisonerVisitorsService.getVisitors.mockResolvedValue(returnData)
      prisonerProfileService.getRestrictions.mockResolvedValue(restrictions)

      sessionApp = appWithAllRoutes({
        services: { prisonerProfileService, prisonerVisitorsService },
        sessionData: {
          visitorList,
          visitSessionData,
        } as SessionData,
      })
    })

    it('should render the prisoner restrictions when they are present', () => {
      return request(sessionApp)
        .get(`${journey.urlPrefix}/select-visitors`)
        .expect(200)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.test-restrictions-type1').text().trim()).toBe('Banned')
          expect($('.test-restrictions-comment1').text().trim()).toBe('string')
          expect($('.test-restrictions-start-date1').text().trim()).toBe('15 March 2022')
          expect($('.test-restrictions-end-date1').text().trim()).toBe('15 March 2022')
          expect(visitSessionData.prisoner.restrictions).toEqual(restrictions)
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

      sessionApp = appWithAllRoutes({
        services: { prisonerProfileService, prisonerVisitorsService },
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
          expect($('.test-restrictions-type1').text().trim()).toBe('Banned')
          expect($('.test-restrictions-comment1').text().trim()).toBe('string')
          expect($('.test-restrictions-start-date1').text().trim()).toBe('Not entered')
          expect($('.test-restrictions-end-date1').text().trim()).toBe('Not entered')
          expect(visitSessionData.prisoner.restrictions).toEqual(restrictions)
        })
    })

    it('should display a message when there are no prisoner restrictions', () => {
      prisonerProfileService.getRestrictions.mockResolvedValue([])

      sessionApp = appWithAllRoutes({
        services: { prisonerProfileService, prisonerVisitorsService },
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
          expect($('.test-no-prisoner-restrictions').text()).toBe('')
          expect($('.test-restrictions-type1').text()).toBe('')
          expect($('.test-restrictions-comment1').text().trim()).toBe('')
          expect($('.test-restrictions-start-date1').text().trim()).toBe('')
          expect($('.test-restrictions-end-date1').text().trim()).toBe('')
          expect(visitSessionData.prisoner.restrictions).toEqual([])
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
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')

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
          expect(visitSessionData.prisoner.restrictions).toEqual(restrictions)
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
        .get(`${journey.urlPrefix}/select-visitors`)
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
        .get(`${journey.urlPrefix}/select-visitors`)
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
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
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
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
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
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
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
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
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
          expect($('[data-test="prisoner-name"]').text()).toBe('John Smith')
          expect($('input[name="visitors"]').length).toBe(1)
          expect($('[data-test="submit"]').length).toBe(0)
          expect($('[data-test="back-to-start"]').length).toBe(1)
          expect($('#visitor-3984').attr('disabled')).toBe('disabled')
          expect($('.govuk-warning-text__text').text().replace(/\s+/g, ' ')).toContain(
            'There are no permitted visitors over 18 for this prisoner. A booking cannot be made at this time.',
          )
        })
    })

    describe(`Display prison specific content for each prison`, () => {
      it('should display prison specific content for Hewell', () => {
        return request(sessionApp)
          .get(`${journey.urlPrefix}/select-visitors`)
          .expect(200)
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('[data-test="visitor-information-1"]').text()).toContain('Add up to 3 people')
            expect($('[data-test="visitor-information-2"]').text()).toContain('must be 18 or older')
          })
      })

      it('should display prison specific content for Bristol', () => {
        sessionApp = appWithAllRoutes({
          services: { prisonerProfileService, prisonerVisitorsService },
          sessionData: {
            selectedEstablishment: { prisonId: 'BLI', prisonName: '' },
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
            expect($('[data-test="visitor-information-1"]').text()).toContain('Add up to 3 adults')
            expect($('[data-test="visitor-information-2"]').text()).toContain('Contact HMP Bristol')
          })
      })

      it('should display no prison specific content for a prison that is not configured', () => {
        sessionApp = appWithAllRoutes({
          services: { prisonerProfileService, prisonerVisitorsService },
          sessionData: {
            selectedEstablishment: { prisonId: 'XYZ', prisonName: '' },
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
            expect($('[data-test="visitor-information-1"]').length).toBe(0)
            expect($('[data-test="visitor-information-2"]').length).toBe(0)
          })
      })
    })
  })

  describe(`POST ${journey.urlPrefix}/select-visitors`, () => {
    const adultVisitors: { adults: VisitorListItem[] } = { adults: [] }
    const visitReference = 'ab-cd-ef-gh'

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

    it('should set validation errors in flash and redirect if more than 10 visitors are selected', () => {
      const tooManyVisitorIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']

      return request(sessionApp)
        .post(`${journey.urlPrefix}/select-visitors`)
        .send(`visitors=${tooManyVisitorIds.join('&visitors=')}`)
        .expect(302)
        .expect('location', `${journey.urlPrefix}/select-visitors`)
        .expect(() => {
          expect(flashProvider).toHaveBeenCalledWith('errors', [
            {
              location: 'body',
              msg: 'Select no more than 10 visitors',
              path: 'visitors',
              type: 'field',
              value: tooManyVisitorIds,
            },
          ])
          expect(flashProvider).toHaveBeenCalledWith('formValues', { visitors: tooManyVisitorIds })
        })
    })
  })
})
