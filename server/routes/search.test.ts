import type { Express } from 'express'
import request from 'supertest'
import PrisonerSearchService from '../services/prisonerSearchService'
import appWithAllRoutes from './testutils/appSetup'
import { PrisonerDetailsItem } from '../@types/bapv'

let app: Express
let prisonerSearchService: PrisonerSearchService
let systemToken

let returnData: {
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

class MockPrisonerSearchService extends PrisonerSearchService {
  constructor() {
    super(undefined, undefined)
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  getPrisoners = (
    search: string,
    username: string,
    page: number
  ): Promise<{
    results: Array<PrisonerDetailsItem[]>
    numberOfResults: number
    numberOfPages: number
    next: number
    previous: number
  }> => {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    return Promise.resolve(returnData)
  }
}

beforeEach(() => {
  systemToken = async (user: string): Promise<string> => `${user}-token-1`
  prisonerSearchService = new MockPrisonerSearchService()
  app = appWithAllRoutes(prisonerSearchService, null, systemToken)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /search/', () => {
  it('should render search page', () => {
    return request(app)
      .get('/search/')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
      })
  })
})

describe('GET /search/results?search=A1234BC', () => {
  it('should render results page with no results', () => {
    returnData = {
      results: [],
      numberOfResults: 0,
      numberOfPages: 0,
      next: 0,
      previous: 0,
    }

    return request(app)
      .get('/search/results?search=A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).toContain('id="search-results-none"')
      })
  })
})

describe('GET /search/results?search=A1234BC', () => {
  it('should render results page with results', () => {
    returnData = {
      results: [
        [
          { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
          { text: 'A1234BC', classes: '' },
          { text: '2 April 1975', classes: '' },
        ],
      ],
      numberOfPages: 1,
      numberOfResults: 1,
      next: 1,
      previous: 1,
    }

    return request(app)
      .get('/search/results?search=A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).toContain('id="search-results-true"')
      })
  })
})
