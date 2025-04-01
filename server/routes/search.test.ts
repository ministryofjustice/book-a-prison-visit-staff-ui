import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import createError from 'http-errors'
import { SessionData } from 'express-session'
import { appWithAllRoutes, user } from './testutils/appSetup'
import { PrisonerDetailsItem, VisitInformation } from '../@types/bapv'
import TestData from './testutils/testData'
import {
  createMockAuditService,
  createMockPrisonerSearchService,
  createMockVisitService,
} from '../services/testutils/mocks'

let app: Express

const auditService = createMockAuditService()
const prisonerSearchService = createMockPrisonerSearchService()
const visitService = createMockVisitService()

const prisonId = 'HEI'

let getPrisonersReturnData: {
  results: Array<PrisonerDetailsItem[]>
  numberOfResults: number
  numberOfPages: number
  next: number
  previous: number
} = {
  results: [],
  numberOfResults: 0,
  numberOfPages: 0,
  next: 0,
  previous: 0,
}

const getPrisonerReturnData = TestData.prisoner()
let getVisit: VisitInformation

beforeEach(() => {
  app = appWithAllRoutes({ services: { auditService, prisonerSearchService, visitService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Prisoner search page', () => {
  describe('for prisoner', () => {
    describe('GET /search/prisoner', () => {
      it('should render prisoner search page', () => {
        return request(app)
          .get('/search/prisoner')
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('.govuk-breadcrumbs li').length).toBe(2)
            expect(res.text).toContain('Search for a prisoner')
            expect($('[data-test=search-by-reference]').length).toBe(1)
          })
      })
    })

    describe('GET /search/prisoner/results?search=<search-term>', () => {
      getPrisonersReturnData = {
        results: [],
        numberOfResults: 0,
        numberOfPages: 0,
        next: 0,
        previous: 0,
      }

      it('should render prisoner results page with no results and custom message for prison number search', () => {
        prisonerSearchService.getPrisoners.mockResolvedValue(getPrisonersReturnData)
        prisonerSearchService.getPrisonerNotFoundMessage.mockResolvedValue('custom not found message')

        return request(app)
          .get('/search/prisoner/results?search=A1234BC')
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect($('.govuk-breadcrumbs li').length).toBe(2)
            expect(res.text).toContain('Search for a prisoner')
            expect($('#search-results-none').text()).toBe('custom not found message')
            expect($('[data-test=search-by-reference]').length).toBe(1)
            expect(auditService.prisonerSearch).toHaveBeenCalledWith({
              searchTerms: 'A1234BC',
              prisonId,
              username: 'user1',
              operationId: undefined,
            })
            expect(prisonerSearchService.getPrisoners).toHaveBeenCalledTimes(1)
          })
      })

      it('should render prisoner results page with no results and default message for prisoner name search', () => {
        prisonerSearchService.getPrisoners.mockResolvedValue(getPrisonersReturnData)

        return request(app)
          .get('/search/prisoner/results?search=prisoner-name')
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect(res.text).toContain('Search for a prisoner')
            expect($('#search-results-none').text()).toBe(
              'There are no results for this name or number at Hewell (HMP).',
            )
            expect($('[data-test=search-by-reference]').length).toBe(1)
            expect(auditService.prisonerSearch).toHaveBeenCalledWith({
              searchTerms: 'prisoner-name',
              prisonId,
              username: 'user1',
              operationId: undefined,
            })
            expect(prisonerSearchService.getPrisoners).toHaveBeenCalledTimes(1)
            expect(prisonerSearchService.getPrisonerNotFoundMessage).not.toHaveBeenCalled()
          })
      })
    })

    describe('GET /search/prisoner/results?search=', () => {
      it('should render prisoner results page with no results with no search term', () => {
        getPrisonersReturnData = {
          results: [],
          numberOfResults: 0,
          numberOfPages: 0,
          next: 0,
          previous: 0,
        }

        prisonerSearchService.getPrisoners.mockResolvedValue(getPrisonersReturnData)

        return request(app)
          .get('/search/prisoner/results?search=')
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('You must enter at least 2 characters')
            expect($('[data-test=search-by-reference]').length).toBe(1)
            expect(auditService.prisonerSearch).not.toHaveBeenCalled()
            expect(prisonerSearchService.getPrisoners).not.toHaveBeenCalled()
          })
      })
    })

    describe('GET /search/prisoner/results?search=A1234BC', () => {
      it('should render prisoner results page with results and no next/prev when there are less than 11 results', () => {
        getPrisonersReturnData = {
          results: [
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
          ],
          numberOfPages: 1,
          numberOfResults: 1,
          next: 1,
          previous: 1,
        }

        prisonerSearchService.getPrisoners.mockResolvedValue(getPrisonersReturnData)

        return request(app)
          .get('/search/prisoner/results?search=A1234BC')
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('id="search-results-true"')
            expect($('[data-test=search-by-reference]').length).toBe(0)
            expect(auditService.prisonerSearch).toHaveBeenCalledWith({
              searchTerms: 'A1234BC',
              prisonId,
              username: 'user1',
              operationId: undefined,
            })
            expect(prisonerSearchService.getPrisoners).toHaveBeenCalledTimes(1)
          })
      })

      it('should render prisoner results page with results and prev/next when there are more than 10 results', () => {
        getPrisonersReturnData = {
          results: [
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
            [{ html: '<a href="/prisoner/A1234BC">Smith, John</a>' }, { html: 'A1234BC' }, { html: '2 April 1975' }],
          ],
          numberOfPages: 12,
          numberOfResults: 11,
          next: 2,
          previous: 1,
        }

        prisonerSearchService.getPrisoners.mockResolvedValue(getPrisonersReturnData)

        return request(app)
          .get('/search/prisoner/results?search=A1234BC')
          .expect('Content-Type', /html/)
          .expect(res => {
            const $ = cheerio.load(res.text)
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('id="search-results-true"')
            expect(res.text).toContain('<p class="moj-pagination__results">')
            expect($('[data-test=search-by-reference]').length).toBe(0)
            expect(auditService.prisonerSearch).toHaveBeenCalledWith({
              searchTerms: 'A1234BC',
              prisonId,
              username: 'user1',
              operationId: undefined,
            })
            expect(prisonerSearchService.getPrisoners).toHaveBeenCalledTimes(1)
          })
      })
    })

    describe('POST /search/prisoner', () => {
      it('should redirect to search results page with search query when no search term entered', () => {
        return request(app).post('/search/prisoner').expect(302).expect('location', '/search/prisoner/results')
      })

      it('should redirect to search results page with trimmed query param when search term entered', () => {
        return request(app)
          .post('/search/prisoner')
          .send('search= john smith ')
          .expect(302)
          .expect('location', '/search/prisoner/results?search=john%20smith')
      })

      it('should remove trailing full stop and whitespace', () => {
        // Given
        const dataToSend = {
          search: 'A1234BC. ',
        }

        // When
        const result = request(app).post('/search/prisoner').send(dataToSend)

        // Then
        return result.expect(302).expect('location', '/search/prisoner/results?search=A1234BC')
      })
    })
  })
})

describe('Booking search page', () => {
  getVisit = {
    reference: 'as-sd-df-fg',
    prisonNumber: 'A1234BC',
    prisonerName: 'Ted Smith',
    mainContact: 'Jon Smith',
    visitDate: '12 Nov 2021',
    visitTime: '1pm -2pm',
    visitStatus: 'BOOKED',
  }

  describe('GET /search/visit', () => {
    it('should render booking search page', () => {
      return request(app)
        .get('/search/visit')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect(res.text).toContain('Search for a booking')
          expect($('[data-test=search-by-prisoner]').length).toBe(1)
        })
    })
  })

  describe('GET /search/visit/results?searchBlock1=ab&searchBlock2=bc&searchBlock3=cd&searchBlock4=de', () => {
    it('should not render visit results page when no result', () => {
      prisonerSearchService.getPrisonerById.mockResolvedValue(getPrisonerReturnData)
      visitService.getVisit.mockImplementation(() => {
        throw createError(404, 'Not found')
      })

      return request(app)
        .get('/search/visit/results?searchBlock1=ab&searchBlock2=bc&searchBlock3=cd&searchBlock4=de')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(res.text).toContain('Search for a booking')
          expect(res.text).toContain('id="search-results-none"')
          expect($('[data-test=search-by-prisoner]').length).toBe(1)
          expect(visitService.getVisit).toHaveBeenCalledWith({
            reference: 'ab-bc-cd-de',
            username: 'user1',
            prisonId: 'HEI',
          })
          expect(auditService.visitSearch).toHaveBeenCalledTimes(1)
          expect(auditService.visitSearch).toHaveBeenCalledWith({
            searchTerms: 'ab-bc-cd-de',
            username: 'user1',
            operationId: undefined,
          })
        })
    })
  })

  describe('GET /search/visit/results?searchBlock1=ab&searchBlock2=bc&searchBlock3=cd&searchBlock4=de', () => {
    it('should render visit results page with a single visit', () => {
      prisonerSearchService.getPrisonerById.mockResolvedValue(getPrisonerReturnData)
      visitService.getVisit.mockResolvedValue(getVisit)

      return request(app)
        .get('/search/visit/results?searchBlock1=ab&searchBlock2=bc&searchBlock3=cd&searchBlock4=de')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect($('.govuk-breadcrumbs li').length).toBe(2)
          expect(res.text).toContain('Search for a booking')
          expect(res.text).toContain('id="search-results-true"')
          expect($('[data-test=search-by-prisoner]').length).toBe(0)
          expect($('[data-test=prisoner-name]').text()).toBe('John Smith')
          expect(visitService.getVisit).toHaveBeenCalledWith({
            reference: 'ab-bc-cd-de',
            username: 'user1',
            prisonId: 'HEI',
          })
          expect(auditService.visitSearch).toHaveBeenCalledTimes(1)
          expect(auditService.visitSearch).toHaveBeenCalledWith({
            searchTerms: 'ab-bc-cd-de',
            username: 'user1',
            operationId: undefined,
          })
        })
    })

    it('should not render visit results page when selected establishment does not equal visit prisonId', () => {
      prisonerSearchService.getPrisonerById.mockResolvedValue(getPrisonerReturnData)
      visitService.getVisit.mockImplementation(() => {
        throw createError(404, 'Not found')
      })

      app = appWithAllRoutes({
        userSupplier: () => ({ ...user, activeCaseLoadId: 'XYZ' }),
        services: { auditService, prisonerSearchService, visitService },
        sessionData: { selectedEstablishment: { prisonId: 'XYZ' } } as SessionData,
      })

      return request(app)
        .get('/search/visit/results?searchBlock1=ab&searchBlock2=bc&searchBlock3=cd&searchBlock4=de')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          expect(res.text).toContain('Search for a booking')
          expect(res.text).toContain('id="search-results-none"')
          expect($('[data-test=search-by-prisoner]').length).toBe(1)
          expect(visitService.getVisit).toHaveBeenCalledWith({
            reference: 'ab-bc-cd-de',
            username: 'user1',
            prisonId: 'XYZ',
          })
          expect(auditService.visitSearch).toHaveBeenCalledTimes(1)
          expect(auditService.visitSearch).toHaveBeenCalledWith({
            searchTerms: 'ab-bc-cd-de',
            username: 'user1',
            operationId: undefined,
          })
        })
    })
  })
})
