import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { format } from 'date-fns'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import AuditService from '../services/auditService'
import { appWithAllRoutes, flashProvider } from './testutils/appSetup'
import { ExtendedVisitInformation, PrisonerDetailsItem, VisitsPageSlot } from '../@types/bapv'
import { getParsedDateFromQueryString } from './visitsUtils'

jest.mock('../services/prisonerSearchService')
jest.mock('../services/visitSessionsService')
jest.mock('../services/auditService')

let app: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`
let flashData: Record<string, string[] | Record<string, string>[]>

const prisonerSearchService = new PrisonerSearchService(null, systemToken) as jest.Mocked<PrisonerSearchService>
const visitSessionsService = new VisitSessionsService(
  null,
  null,
  null,
  systemToken,
) as jest.Mocked<VisitSessionsService>
const auditService = new AuditService() as jest.Mocked<AuditService>

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation(key => {
    return flashData[key]
  })
  app = appWithAllRoutes({
    prisonerSearchServiceOverride: prisonerSearchService,
    visitSessionsServiceOverride: visitSessionsService,
    auditServiceOverride: auditService,
    systemTokenOverride: systemToken,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /visits', () => {
  const prisonId = 'HEI'
  let visits: {
    extendedVisitsInfo: ExtendedVisitInformation[]
    slots: {
      openSlots: VisitsPageSlot[]
      closedSlots: VisitsPageSlot[]
      unknownSlots: VisitsPageSlot[]
      firstSlotTime: string
    }
  }
  let prisoners: {
    results: Array<PrisonerDetailsItem[]>
    numberOfResults: number
    numberOfPages: number
    next: number
    previous: number
  }

  const todayDate = format(new Date(), 'yyyy-MM-dd')

  beforeEach(() => {
    visits = {
      extendedVisitsInfo: [
        {
          reference: 'ob-cw-lx-na',
          prisonNumber: 'A8709DY',
          prisonerName: '',
          mainContact: 'UNKNOWN',
          startTimestamp: '2022-05-23T09:00:00',
          visitDate: '23 May 2022',
          visitTime: '9am to 9:29am',
          visitRestriction: 'OPEN',
          visitors: [
            {
              personId: 4729510,
              name: 'James Smith',
              dateOfBirth: '1983-06-17',
              adult: true,
              relationshipDescription: 'Brother',
              address: 'Warren way,<br>Bootle,<br>DN5 9SD,<br>England',
              restrictions: [],
              banned: false,
            },
          ],
        },
        {
          reference: 'lb-co-bn-oe',
          prisonNumber: 'A8709DY',
          prisonerName: '',
          mainContact: 'Tess Bennett',
          startTimestamp: '2022-05-23T10:00:00',
          visitDate: '23 May 2022',
          visitTime: '10am to 11am',
          visitRestriction: 'OPEN',
          visitors: [
            {
              personId: 4729510,
              name: 'James Smith',
              dateOfBirth: '1983-06-17',
              adult: true,
              relationshipDescription: 'Brother',
              address: 'Warren way,<br>Bootle,<br>DN5 9SD,<br>England',
              restrictions: [],
              banned: false,
            },
            {
              personId: 4729570,
              name: 'Tess Bennett',
              relationshipDescription: 'Aunt',
              address: 'Not entered',
              restrictions: [],
              banned: false,
            },
          ],
        },
        {
          reference: 'lb-co-bn-un',
          prisonNumber: 'A8709DY',
          prisonerName: '',
          mainContact: 'Tess Bennett',
          startTimestamp: '2022-05-23T10:00:00',
          visitDate: '23 May 2022',
          visitTime: '10am to 11am',
          visitRestriction: 'UNKNOWN',
          visitors: [
            {
              personId: 4729510,
              name: 'James Smith',
              dateOfBirth: '1983-06-17',
              adult: true,
              relationshipDescription: 'Brother',
              address: 'Warren way,<br>Bootle,<br>DN5 9SD,<br>England',
              restrictions: [],
              banned: false,
            },
            {
              personId: 4729570,
              name: 'Tess Bennett',
              relationshipDescription: 'Aunt',
              address: 'Not entered',
              restrictions: [],
              banned: false,
            },
          ],
        },
      ],
      slots: {
        openSlots: [
          {
            visitTime: '9am to 9:29am',
            visitType: 'OPEN',
            sortField: '2022-05-23T09:00:00',
            adults: 1,
            children: 0,
          },
          {
            visitTime: '10am to 11am',
            visitType: 'OPEN',
            sortField: '2022-05-23T10:00:00',
            adults: 1,
            children: 1,
          },
        ],
        closedSlots: [],
        unknownSlots: [
          {
            visitTime: '10am to 11am',
            visitType: 'UNKNOWN',
            sortField: '2022-05-23T10:00:00',
            adults: 1,
            children: 1,
          },
        ],
        firstSlotTime: '9am to 9:29am',
      },
    }

    prisoners = {
      results: [
        [
          {
            text: 'Rocky, Asap',
            attributes: {
              'data-test': 'prisoner-name',
            },
          },
          {
            text: 'A8709DY',
            attributes: {
              'data-test': 'prisoner-number',
            },
          },
          {
            html: '<a href="" class="bapv-result-row">View</a>',
            classes: 'govuk-!-text-align-right',
          },
        ],
      ],
      numberOfResults: 1,
      numberOfPages: 1,
      next: 1,
      previous: 1,
    }
  })

  it('should render visit slot summary page with prisoner list, slot details and menu for choosing other slots, with the first slot chosen by default ', () => {
    prisonerSearchService.getPrisonersByPrisonerNumbers.mockResolvedValue(prisoners)
    visitSessionsService.getVisitsByDate.mockResolvedValue(visits)

    return request(app)
      .get('/visits')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('View visits by date')
        expect($('.govuk-back-link').attr('href')).toBe('/')
        expect($('[data-test="visit-room"]').text()).toBe('Open')
        expect($('[data-test="visit-time"]').text()).toBe('9am to 9:29am')
        expect($('[data-test="visit-tables-booked"]').text()).toBe('1 of 30')
        expect($('[data-test="visit-visitors-total"]').text()).toBe('1')
        expect($('[data-test="visit-adults"]').text()).toBe('1')
        expect($('[data-test="visit-children"]').text()).toBe('0')
        expect($('[data-test="prisoner-number"]').text()).toBe('A8709DY')
        expect($('[data-test="prisoner-name"]').text()).toBe('Rocky, Asap')
        expect($('.moj-side-navigation__title').text()).toContain('Open visits')
        expect($('.moj-side-navigation__item--active').text()).toContain('9am to 9:29am')
        expect(auditService.viewedVisits).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisits).toHaveBeenCalledWith({
          viewDate: todayDate,
          prisonId,
          username: undefined,
          operationId: undefined,
        })
      })
  })

  it('should render visit slot summary page with prisoner list, slot details and menu for choosing other slots, with the chosen slot shown for OPEN', () => {
    prisonerSearchService.getPrisonersByPrisonerNumbers.mockResolvedValue(prisoners)
    visitSessionsService.getVisitsByDate.mockResolvedValue(visits)

    return request(app)
      .get('/visits?selectedDate=2022-05-23&time=10am%20to%2011am&type=OPEN')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('View visits by date')
        expect($('.govuk-back-link').attr('href')).toBe('/')
        expect($('[data-test="visit-room"]').text()).toBe('Open')
        expect($('[data-test="visit-time"]').text()).toBe('10am to 11am')
        expect($('[data-test="visit-tables-booked"]').text()).toBe('1 of 30')
        expect($('[data-test="visit-visitors-total"]').text()).toBe('2')
        expect($('[data-test="visit-adults"]').text()).toBe('1')
        expect($('[data-test="visit-children"]').text()).toBe('1')
        expect($('[data-test="prisoner-number"]').text()).toBe('A8709DY')
        expect($('[data-test="prisoner-name"]').text()).toBe('Rocky, Asap')
        expect($('.moj-side-navigation__title').text()).toContain('Open visits')
        expect($('.moj-side-navigation__item--active').text()).toContain('10am to 11am')
        expect(auditService.viewedVisits).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisits).toHaveBeenCalledWith({
          viewDate: '2022-05-23',
          prisonId,
          username: undefined,
          operationId: undefined,
        })
      })
  })

  it('should render visit slot summary page with prisoner list, slot details and menu for choosing other slots, with the chosen slot shown for UNKNOWN', () => {
    prisonerSearchService.getPrisonersByPrisonerNumbers.mockResolvedValue(prisoners)
    visitSessionsService.getVisitsByDate.mockResolvedValue(visits)

    return request(app)
      .get('/visits?selectedDate=2022-05-23&time=10am+to+11am&type=UNKNOWN')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('View visits by date')
        expect($('.govuk-back-link').attr('href')).toBe('/')
        expect($('[data-test="visit-room"]').text()).toBe('Visit type unknown')
        expect($('[data-test="visit-time"]').text()).toBe('10am to 11am')
        expect($('[data-test="visit-tables-booked"]').text()).toBe('1 of 30')
        expect($('[data-test="visit-visitors-total"]').text()).toBe('2')
        expect($('[data-test="visit-adults"]').text()).toBe('1')
        expect($('[data-test="visit-children"]').text()).toBe('1')
        expect($('[data-test="prisoner-number"]').text()).toBe('A8709DY')
        expect($('[data-test="prisoner-name"]').text()).toBe('Rocky, Asap')
        expect($('.moj-side-navigation__title').text()).toContain('Visit type unknown')
        expect($('.moj-side-navigation__item--active').text()).toContain('10am to 11am')
        expect(auditService.viewedVisits).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisits).toHaveBeenCalledWith({
          viewDate: '2022-05-23',
          prisonId,
          username: undefined,
          operationId: undefined,
        })
      })
  })

  it('should render visit slot summary page with prisoner list, slot details and menu for choosing other slots, with the chosen slot shown, bad date defaults to today', () => {
    prisonerSearchService.getPrisonersByPrisonerNumbers.mockResolvedValue(prisoners)
    visitSessionsService.getVisitsByDate.mockResolvedValue(visits)

    return request(app)
      .get('/visits?selectedDate=2022-77-23&time=10am%20to%2011am&type=OPEN')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('View visits by date')
        expect($('.govuk-back-link').attr('href')).toBe('/')
        expect($('[data-test="visit-room"]').text()).toBe('Open')
        expect($('[data-test="visit-time"]').text()).toBe('10am to 11am')
        expect($('[data-test="visit-tables-booked"]').text()).toBe('1 of 30')
        expect($('[data-test="visit-visitors-total"]').text()).toBe('2')
        expect($('[data-test="visit-adults"]').text()).toBe('1')
        expect($('[data-test="visit-children"]').text()).toBe('1')
        expect($('[data-test="prisoner-number"]').text()).toBe('A8709DY')
        expect($('[data-test="prisoner-name"]').text()).toBe('Rocky, Asap')
        expect($('.moj-side-navigation__title').text()).toContain('Open visits')
        expect($('.moj-side-navigation__item--active').text()).toContain('10am to 11am')
        expect(auditService.viewedVisits).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisits).toHaveBeenCalledWith({
          viewDate: todayDate,
          prisonId,
          username: undefined,
          operationId: undefined,
        })
      })
  })

  it('should render no slots message when there are no slots for a particular day', () => {
    prisonerSearchService.getPrisonersByPrisonerNumbers.mockResolvedValue({
      results: [],
      numberOfResults: 0,
      numberOfPages: 0,
      next: 0,
      previous: 0,
    })
    visitSessionsService.getVisitsByDate.mockResolvedValue({
      extendedVisitsInfo: [],
      slots: {
        openSlots: [],
        closedSlots: [],
        unknownSlots: [],
        firstSlotTime: '',
      },
    })

    return request(app)
      .get('/visits')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('View visits by date')
        expect($('.govuk-back-link').attr('href')).toBe('/')
        expect($('#search-results-none').text()).toContain('No visit sessions on this day.')
        expect(auditService.viewedVisits).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisits).toHaveBeenCalledWith({
          viewDate: todayDate,
          prisonId,
          username: undefined,
          operationId: undefined,
        })
      })
  })

  it('should render no slots message when bad slot', () => {
    prisonerSearchService.getPrisonersByPrisonerNumbers.mockResolvedValue(prisoners)
    visitSessionsService.getVisitsByDate.mockResolvedValue(visits)

    return request(app)
      .get('/visits?selectedDate=2022-05-23&time=11am%20to%2011am&type=OPEN')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text()).toBe('View visits by date')
        expect($('.govuk-back-link').attr('href')).toBe('/')
        expect($('#search-results-none').text()).toContain('No visit sessions on this day.')
        expect(auditService.viewedVisits).toHaveBeenCalledTimes(1)
        expect(auditService.viewedVisits).toHaveBeenCalledWith({
          viewDate: '2022-05-23',
          prisonId,
          username: undefined,
          operationId: undefined,
        })
      })
  })
})

describe('POST /visits', () => {
  it('should redirect to the selected date on the visits page for a valid date', () => {
    const day = '1'
    const month = '1'
    const year = '2022'
    const selectedDateString = getParsedDateFromQueryString(`${year}-${month}-${day}`)

    return request(app)
      .post('/visits')
      .send(`date-picker-day=${day}`)
      .send(`date-picker-month=${month}`)
      .send(`date-picker-year=${year}`)
      .expect(302)
      .expect('location', `/visits?selectedDate=${selectedDateString}&firstTabDate=${selectedDateString}`)
  })

  it('should redirect to the current date on the visits page for an invalid date', () => {
    const day = 'X'
    const month = 'Y'
    const year = '20D2'
    const selectedDateString = getParsedDateFromQueryString(`${year}-${month}-${day}`)

    return request(app)
      .post('/visits')
      .send(`date-picker-day=${day}`)
      .send(`date-picker-month=${month}`)
      .send(`date-picker-year=${year}`)
      .expect(302)
      .expect('location', `/visits?selectedDate=${selectedDateString}&firstTabDate=${selectedDateString}`)
  })
})
