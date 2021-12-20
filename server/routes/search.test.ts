import type { Express } from 'express'
import request from 'supertest'
import PrisonerSearchService from '../services/prisonerSearchService'
import appWithAllRoutes from './testutils/appSetup'

let app: Express
let prisonerSearchService: PrisonerSearchService
let systemToken

interface PrisonerDetailsRow {
  text: string
}

let returnData: Array<PrisonerDetailsRow[]> = []

class MockPrisonerSearchService extends PrisonerSearchService {
  constructor() {
    super(undefined, undefined)
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  getPrisoners = (search: string, username: string): Promise<Array<PrisonerDetailsRow[]>> => {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    return Promise.resolve(returnData)
  }
}

beforeEach(() => {
  systemToken = async (user: string): Promise<string> => `${user}-token-1`
  prisonerSearchService = new MockPrisonerSearchService()
  app = appWithAllRoutes(prisonerSearchService, systemToken)
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
    returnData = []

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
    returnData = [[{ text: 'Smith, John' }, { text: 'A1234BC' }, { text: '2 April 1975' }]]

    return request(app)
      .get('/search/results?search=A1234BC')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Search for a prisoner')
        expect(res.text).toContain('id="search-results-true"')
      })
  })
})
