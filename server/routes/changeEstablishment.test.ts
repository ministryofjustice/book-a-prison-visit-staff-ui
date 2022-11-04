import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

// const enabledPrisons = [
//   { prisonId: 'HEI', name: 'Hewell (HMP)' },
//   { prisonId: 'BLI', name: 'Bristol (HMP)' },
// ]
// const selectedEstablishment = {
//   name: 'Bristol (HMP',
//   prisonId: 'BLI',
// }

describe('GET /change-establishment', () => {
  it('should render select establishment page', () => {
    app = appWithAllRoutes({})

    return request(app)
      .get('/change-establishment')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Manage prison visits - Select Establishment')
        expect(res.text).toContain('Hewell (HMP)')
        expect(res.text).toContain('Bristol (HMP)')
      })
  })
})
