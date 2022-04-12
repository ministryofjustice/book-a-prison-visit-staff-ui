import type { Express } from 'express'
import request from 'supertest'
import VisitSessionsService from '../services/visitSessionsService'
import { appWithAllRoutes } from './testutils/appSetup'
import { VisitInformation } from '../@types/bapv'

let app: Express
let visitSessionsService: VisitSessionsService
let systemToken
let returnData: VisitInformation
const visitReference = 'aw-fd-we-vf'

class MockVisitSessionsService extends VisitSessionsService {
  constructor() {
    super(undefined, undefined, undefined)
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  getVisit = ({ username, reference }: { username: string; reference: string }): Promise<VisitInformation> => {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    return Promise.resolve(returnData)
  }
}

beforeEach(() => {
  systemToken = async (user: string): Promise<string> => `${user}-token-1`
  visitSessionsService = new MockVisitSessionsService()
  app = appWithAllRoutes(null, null, null, visitSessionsService, systemToken)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Visit page', () => {
  describe(`GET /visit/${visitReference}`, () => {
    it('should render visit page', () => {
      return request(app)
        .get(`/visit/${visitReference}`)
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Search for a prisoner')
        })
    })
  })
})

//   describe('GET /search/prisoner/results?search=A1234BC', () => {
//     it('should render prisoner results page with no results', () => {
//       returnData = {
//         results: [],
//         numberOfResults: 0,
//         numberOfPages: 0,
//         next: 0,
//         previous: 0,
//       }

//       return request(app)
//         .get('/search/prisoner/results?search=A1234BC')
//         .expect('Content-Type', /html/)
//         .expect(res => {
//           expect(res.text).toContain('Search for a prisoner')
//           expect(res.text).toContain('id="search-results-none"')
//         })
//     })
//   })

//   describe('GET /search/prisoner/results?search=A1234BC', () => {
//     it('should render prisoner results page with results and no next/prev when there are less than 11 results', () => {
//       returnData = {
//         results: [
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//         ],
//         numberOfPages: 1,
//         numberOfResults: 1,
//         next: 1,
//         previous: 1,
//       }

//       return request(app)
//         .get('/search/prisoner/results?search=A1234BC')
//         .expect('Content-Type', /html/)
//         .expect(res => {
//           expect(res.text).toContain('Search for a prisoner')
//           expect(res.text).toContain('id="search-results-true"')
//           expect(res.text).not.toContain('<p class="moj-pagination__results">')
//         })
//     })

//     it('should render prisoner results page with results and prev/next when there are more than 10 results', () => {
//       returnData = {
//         results: [
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//           [
//             { html: '<a href="/prisoner/A1234BC">Smith, John</a>', classes: '' },
//             { html: 'A1234BC', classes: '' },
//             { html: '2 April 1975', classes: '' },
//           ],
//         ],
//         numberOfPages: 12,
//         numberOfResults: 11,
//         next: 2,
//         previous: 1,
//       }

//       return request(app)
//         .get('/search/prisoner/results?search=A1234BC')
//         .expect('Content-Type', /html/)
//         .expect(res => {
//           expect(res.text).toContain('Search for a prisoner')
//           expect(res.text).toContain('id="search-results-true"')
//           expect(res.text).toContain('<p class="moj-pagination__results">')
//         })
//     })
//   })
// })

// describe('Booking search page', () => {
//   describe('GET /search/visit', () => {
//     it('should render booking search page', () => {
//       return request(app)
//         .get('/search/visit')
//         .expect('Content-Type', /html/)
//         .expect(res => {
//           expect(res.text).toContain('Search for a booking')
//         })
//     })
//   })
// })
