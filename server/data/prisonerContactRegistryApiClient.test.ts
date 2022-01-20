import nock from 'nock'
import config from '../config'
import PrisonerContactRegistryApiClient, {
  prisonerContactRegistryApiClientBuilder,
} from './prisonerContactRegistryApiClient'

describe('prisonerContactRegistryApiClient', () => {
  let fakePrisonerContactRegistryApi: nock.Scope
  let client: PrisonerContactRegistryApiClient
  const token = 'token-1'

  beforeEach(() => {
    fakePrisonerContactRegistryApi = nock(config.apis.prisonerContactRegistry.url)
    client = prisonerContactRegistryApiClientBuilder(token)
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('getPrisonerSocialContacts', () => {
    it('should return an array of Contact from the Prisoner Contact Registry API', async () => {
      const offenderNo = 'A1234BC'
      const results = [
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
        .get(`/prisoners/${offenderNo}/contacts`)
        .query({
          type: 'S',
        })
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, results)

      const output = await client.getPrisonerSocialContacts(offenderNo)

      expect(output).toEqual(results)
    })
  })
})
