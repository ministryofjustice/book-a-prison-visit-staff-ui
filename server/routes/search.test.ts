import type { Express } from 'express'
import request from 'supertest'
import createError from 'http-errors'
import PrisonerSearchService from '../services/prisonerSearchService'
import VisitSessionsService from '../services/visitSessionsService'
import { appWithAllRoutes } from './testutils/appSetup'
import { PrisonerDetailsItem, VisitInformation } from '../@types/bapv'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import AuditService from '../services/auditService'

jest.mock('../services/prisonerSearchService')
jest.mock('../services/visitSessionsService')
jest.mock('../services/auditService')

let app: Express
const systemToken = async (user: string): Promise<string> => `${user}-token-1`
const prisonerSearchService = new PrisonerSearchService(null, systemToken) as jest.Mocked<PrisonerSearchService>
const auditService = new AuditService() as jest.Mocked<AuditService>
const visitSessionsService = new VisitSessionsService(
  null,
  null,
  null,
  systemToken,
) as jest.Mocked<VisitSessionsService>

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

let getPrisonerReturnData: Prisoner
let getVisit: VisitInformation

beforeEach(() => {
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

describe('Prisoner search page', () => {
  describe('for prisoner', () => {
    describe('GET /search/prisoner', () => {
      it('should render prisoner search page', () => {
        return request(app)
          .get('/search/prisoner')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Search for a prisoner')
          })
      })
    })

    describe('GET /search/prisoner/results?search=A1234BC', () => {
      it('should render prisoner results page with no results', () => {
        getPrisonersReturnData = {
          results: [],
          numberOfResults: 0,
          numberOfPages: 0,
          next: 0,
          previous: 0,
        }

        prisonerSearchService.getPrisoners.mockResolvedValue(getPrisonersReturnData)

        return request(app)
          .get('/search/prisoner/results?search=A1234BC')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('id="search-results-none"')
            expect(auditService.prisonerSearch).toBeCalledTimes(1)
            expect(auditService.prisonerSearch).toBeCalledWith('A1234BC', 'HEI', undefined, undefined)
            expect(prisonerSearchService.getPrisoners).toBeCalledTimes(1)
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
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('You must enter at least 2 characters')
            expect(auditService.prisonerSearch).not.toHaveBeenCalled()
            expect(prisonerSearchService.getPrisoners).not.toBeCalled()
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
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('id="search-results-true"')
            expect(auditService.prisonerSearch).toBeCalledTimes(1)
            expect(auditService.prisonerSearch).toBeCalledWith('A1234BC', 'HEI', undefined, undefined)
            expect(prisonerSearchService.getPrisoners).toBeCalledTimes(1)
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
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('id="search-results-true"')
            expect(res.text).toContain('<p class="moj-pagination__results">')
            expect(auditService.prisonerSearch).toBeCalledTimes(1)
            expect(auditService.prisonerSearch).toBeCalledWith('A1234BC', 'HEI', undefined, undefined)
            expect(prisonerSearchService.getPrisoners).toBeCalledTimes(1)
          })
      })
    })
  })

  describe('for visit', () => {
    describe('GET /search/prisoner-visit', () => {
      it('should render prisoner search page', () => {
        return request(app)
          .get('/search/prisoner-visit')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Search for a prisoner')
          })
      })
    })

    describe('GET /search/prisoner-visit/results?search=A1234BC', () => {
      it('should render prisoner results page with no results', () => {
        getPrisonersReturnData = {
          results: [],
          numberOfResults: 0,
          numberOfPages: 0,
          next: 0,
          previous: 0,
        }

        prisonerSearchService.getPrisoners.mockResolvedValue(getPrisonersReturnData)

        return request(app)
          .get('/search/prisoner-visit/results?search=A1234BC')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('id="search-results-none"')
          })
      })
    })

    describe('GET /search/prisoner-visit/results?search=A1234BC', () => {
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
          .get('/search/prisoner-visit/results?search=A1234BC')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('id="search-results-true"')
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
          .get('/search/prisoner-visit/results?search=A1234BC')
          .expect('Content-Type', /html/)
          .expect(res => {
            expect(res.text).toContain('Search for a prisoner')
            expect(res.text).toContain('id="search-results-true"')
            expect(res.text).toContain('<p class="moj-pagination__results">')
          })
      })

      describe('GET /search/prisoner-visit/results?search=', () => {
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
            .get('/search/prisoner-visit/results?search=')
            .expect('Content-Type', /html/)
            .expect(res => {
              expect(res.text).toContain('Search for a prisoner')
              expect(res.text).toContain('You must enter at least 2 characters')
              expect(auditService.prisonerSearch).not.toHaveBeenCalled()
              expect(prisonerSearchService.getPrisoners).not.toBeCalled()
            })
        })
      })
    })
  })
})

describe('Booking search page', () => {
  describe('GET /search/visit', () => {
    it('should render booking search page', () => {
      return request(app)
        .get('/search/visit')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Search for a booking')
        })
    })
  })

  describe('GET /search/visit/results?searchBlock1=ab&searchBlock2=bc&searchBlock3=cd&searchBlock4=de', () => {
    it('should not render visit results page when no result', () => {
      getPrisonerReturnData = {
        firstName: 'Geoff',
        lastName: 'Smith',
        restrictedPatient: false,
      }

      prisonerSearchService.getPrisonerById.mockResolvedValue(getPrisonerReturnData)
      visitSessionsService.getVisit.mockImplementation(() => {
        throw createError(404, 'Not found')
      })

      return request(app)
        .get('/search/visit/results?searchBlock1=ab&searchBlock2=bc&searchBlock3=cd&searchBlock4=de')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Search for a booking')
          expect(res.text).toContain('id="search-results-none"')
          expect(auditService.visitSearch).toBeCalledTimes(1)
          expect(auditService.visitSearch).toBeCalledWith('ab-bc-cd-de', undefined, undefined)
        })
    })
  })

  describe('GET /search/visit/results?searchBlock1=ab&searchBlock2=bc&searchBlock3=cd&searchBlock4=de', () => {
    it('should render visit results page with a single visit', () => {
      getPrisonerReturnData = {
        firstName: 'Geoff',
        lastName: 'Smith',
        restrictedPatient: false,
      }
      getVisit = {
        reference: 'as-sd-df-fg',
        prisonNumber: 'A1234BC',
        prisonerName: 'Smith, Ted',
        mainContact: 'Jon Smith',
        visitDate: '12 Nov 2021',
        visitTime: '1pm -2pm',
      }

      prisonerSearchService.getPrisonerById.mockResolvedValue(getPrisonerReturnData)
      visitSessionsService.getVisit.mockResolvedValue(getVisit)

      return request(app)
        .get('/search/visit/results?searchBlock1=ab&searchBlock2=bc&searchBlock3=cd&searchBlock4=de')
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Search for a booking')
          expect(res.text).toContain('id="search-results-true"')
          expect(auditService.visitSearch).toBeCalledTimes(1)
          expect(auditService.visitSearch).toBeCalledWith('ab-bc-cd-de', undefined, undefined)
        })
    })
  })
})
