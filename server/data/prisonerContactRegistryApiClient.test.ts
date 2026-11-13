import nock from 'nock'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import TestData from '../routes/testutils/testData'

describe('PrisonerContactRegistryApiClient', () => {
  let prisonerContactRegistryApiClient: PrisonerContactRegistryApiClient
  let mockAuthenticationClient: jest.Mocked<AuthenticationClient>

  beforeEach(() => {
    mockAuthenticationClient = {
      getToken: jest.fn().mockResolvedValue('test-system-token'),
    } as unknown as jest.Mocked<AuthenticationClient>

    prisonerContactRegistryApiClient = new PrisonerContactRegistryApiClient(mockAuthenticationClient)
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('getPrisonersApprovedSocialContacts', () => {
    it('should return an array of Contacts from the Prisoner Contact Registry API', async () => {
      const offenderNo = 'A1234BC'
      const contact = [TestData.contact()]

      nock(config.apis.prisonerContactRegistry.url)
        .get(`/v2/prisoners/${offenderNo}/contacts/social/approved`)
        .query({
          hasDateOfBirth: 'false',
          withRestrictions: 'true',
        })
        .matchHeader('authorization', 'Bearer test-system-token')
        .reply(200, contact)

      const response = await prisonerContactRegistryApiClient.getPrisonersApprovedSocialContacts(offenderNo)

      expect(response).toStrictEqual(contact)
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
    })

    it('should return an empty array if prisoner not found', async () => {
      const offenderNo = 'A1234BC'

      nock(config.apis.prisonerContactRegistry.url)
        .get(`/v2/prisoners/${offenderNo}/contacts/social/approved`)
        .query({
          hasDateOfBirth: 'false',
          withRestrictions: 'true',
        })
        .matchHeader('authorization', 'Bearer test-system-token')
        .reply(404)

      const output = await prisonerContactRegistryApiClient.getPrisonersApprovedSocialContacts(offenderNo)

      expect(output).toStrictEqual([])
      expect(mockAuthenticationClient.getToken).toHaveBeenCalledTimes(1)
    })
  })
})
