import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import nock from 'nock'
import config from '../config'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import TestData from '../routes/testutils/testData'

describe('prisonerContactRegistryApiClient', () => {
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>
  let fakePrisonerContactRegistryApi: nock.Scope
  let prisonerContactRegistryApiClient: PrisonerContactRegistryApiClient
  const token = 'token-1'

  beforeEach(() => {
    // nock.disableNetConnect()

    // nock.emitter.on('no match', req => {
    //   // eslint-disable-next-line no-console
    //   console.error('NO MATCH', req)
    // })
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue(token),
    } as unknown as jest.Mocked<AuthenticationClient>
    fakePrisonerContactRegistryApi = nock(config.apis.prisonerContactRegistry.url)
    prisonerContactRegistryApiClient = new PrisonerContactRegistryApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    const pending = nock.pendingMocks()

    if (pending.length) {
      // eslint-disable-next-line no-console
      console.error('Pending mocks:', pending)
    }

    expect(pending).toHaveLength(0)

    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getPrisonersApprovedSocialContacts', () => {
    it('should return an array of Contacts from the Prisoner Contact Registry API', async () => {
      const offenderNo = 'A1234BC'
      const contact = [TestData.contact()]

      fakePrisonerContactRegistryApi
        .get(`/v2/prisoners/${offenderNo}/contacts/social/approved`)
        .query({
          hasDateOfBirth: 'false',
          withRestrictions: 'true',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, contact)

      const output = await prisonerContactRegistryApiClient.getPrisonersApprovedSocialContacts(offenderNo)

      expect(output).toStrictEqual(contact)
    })

    it('should return an empty array if prisoner not found', async () => {
      const offenderNo = 'A1234BC'

      fakePrisonerContactRegistryApi
        .get(`/v2/prisoners/${offenderNo}/contacts/social/approved`)
        .query({
          hasDateOfBirth: 'false',
          withRestrictions: 'true',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404)

      const output = await prisonerContactRegistryApiClient.getPrisonersApprovedSocialContacts(offenderNo)

      expect(output).toStrictEqual([])
    })
  })
})
