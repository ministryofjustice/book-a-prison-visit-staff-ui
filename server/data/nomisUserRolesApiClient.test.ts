import nock from 'nock'

import config from '../config'
import NomisUserRolesApiClient from './nomisUserRolesApiClient'

const token = { access_token: 'token-1', expires_in: 300 }

describe('nomisUserRolesApiClient', () => {
  let fakeNomisUserRolesApiClient: nock.Scope
  let nomisUserRolesApiClient: NomisUserRolesApiClient

  beforeEach(() => {
    fakeNomisUserRolesApiClient = nock(config.apis.nomisUserRolesApi.url)
    nomisUserRolesApiClient = new NomisUserRolesApiClient()
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getUser', () => {
    it('should return data from api', async () => {
      const response = { username: 'user1', activeCaseLoadId: 'HEI' }

      fakeNomisUserRolesApiClient
        .get('/me')
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, response)

      const output = await nomisUserRolesApiClient.getUser(token.access_token)
      expect(output).toEqual(response)
    })
  })
})
