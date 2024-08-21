import nock from 'nock'
import config from '../config'
import PrisonerContactRegistryApiClient from './prisonerContactRegistryApiClient'
import { Contact } from './prisonerContactRegistryApiTypes'

describe('prisonerContactRegistryApiClient', () => {
  let fakePrisonerContactRegistryApi: nock.Scope
  let prisonerContactRegistryApiClient: PrisonerContactRegistryApiClient
  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerContactRegistryApi = nock(config.apis.prisonerContactRegistry.url)
    prisonerContactRegistryApiClient = new PrisonerContactRegistryApiClient(token)
  })

  afterEach(() => {
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  describe('getPrisonerSocialContacts', () => {
    it('should return an array of Contact from the Prisoner Contact Registry API', async () => {
      const offenderNo = 'A1234BC'
      const results: Contact[] = [
        {
          personId: 5871791,
          firstName: 'John',
          middleName: 'Mark',
          lastName: 'Smith',
          dateOfBirth: '1980-01-28',
          relationshipCode: 'RO',
          relationshipDescription: 'Responsible Officer',
          contactType: 'O',
          contactTypeDescription: 'Official',
          approvedVisitor: true,
          emergencyContact: true,
          nextOfKin: true,
          restrictions: [
            {
              restrictionType: '123',
              restrictionTypeDescription: '123',
              startDate: '2000-10-31',
              expiryDate: '2000-10-31',
              globalRestriction: true,
              comment: 'This is a comment text',
            },
          ],
          addresses: [
            {
              addressType: 'BUS',
              flat: '3B',
              premise: 'Liverpool Prison',
              street: 'Slinn Street',
              locality: 'Brincliffe',
              town: 'Liverpool',
              postalCode: 'LI1 5TH',
              county: 'HEREFORD',
              country: 'ENG',
              comment: 'This is a comment text',
              primary: false,
              noFixedAddress: false,
              startDate: '2000-10-31',
              endDate: '2000-10-31',
              phones: [
                {
                  number: '0114 2345678',
                  type: 'TEL',
                  ext: '123',
                },
              ],
              addressUsages: [
                {
                  addressUsage: 'HDC',
                  addressUsageDescription: 'HDC Address',
                  activeFlag: true,
                },
              ],
            },
          ],
          commentText: 'This is a comment text',
        },
      ]

      fakePrisonerContactRegistryApi
        .get(`/prisoners/${offenderNo}/contacts/social`)
        .query({
          approvedVisitorsOnly: 'true',
          hasDateOfBirth: 'false',
          withAddress: 'true',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(true, offenderNo)

      expect(output).toEqual(results)
    })

    it('should return an empty array if prisoner not found', async () => {
      const offenderNo = 'A1234BC'

      fakePrisonerContactRegistryApi
        .get(`/prisoners/${offenderNo}/contacts/social`)
        .query({
          approvedVisitorsOnly: 'true',
          hasDateOfBirth: 'false',
          withAddress: 'true',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(404, {
          status: 404,
          errorCode: 0,
          userMessage: 'string',
          developerMessage: 'string',
        })

      const output = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(true, offenderNo)

      expect(output).toEqual([])
    })
  })
})
