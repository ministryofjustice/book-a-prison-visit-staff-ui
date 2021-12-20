import nock from 'nock'
import config from '../config'
import systemToken from './authClient'

describe('authClient', () => {
  let fakeApi: nock.Scope

  beforeEach(() => {
    fakeApi = nock(config.apis.oauth2.url)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('systemToken', () => {
    const tokenObject = { access_token: 'token-1' }
    it('with username', async () => {
      const userName = 'Bob'
      fakeApi
        .post(`/oauth/token`, 'grant_type=client_credentials&username=Bob')
        .basicAuth({ user: config.apis.oauth2.systemClientId, pass: config.apis.oauth2.systemClientSecret })
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, tokenObject)

      const output = await systemToken(userName)
      expect(output).toEqual(tokenObject.access_token)
    })

    it('without username', async () => {
      fakeApi
        .post(`/oauth/token`, 'grant_type=client_credentials')
        .basicAuth({ user: config.apis.oauth2.systemClientId, pass: config.apis.oauth2.systemClientSecret })
        .matchHeader('Content-Type', 'application/x-www-form-urlencoded')
        .reply(200, tokenObject)

      const output = await systemToken()
      expect(output).toEqual(tokenObject.access_token)
    })
  })
})
