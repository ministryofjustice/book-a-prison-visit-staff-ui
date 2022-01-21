/* eslint @typescript-eslint/no-unused-vars: "off" */
import { URLSearchParams } from 'url'
import RestClient from './restClient'
import { Contact } from '../@types/bapv'
import config from '../config'

export const prisonerContactRegistryApiClientBuilder = (token: string): PrisonerContactRegistryApiClient => {
  const restClient = new RestClient('prisonerContactRegistryApi', config.apis.prisonerContactRegistry, token)
  const prisonerContactRegistryApiClient = new PrisonerContactRegistryApiClient(restClient)

  return prisonerContactRegistryApiClient
}

class PrisonerContactRegistryApiClient {
  constructor(private readonly restclient: RestClient) {}

  getPrisonerSocialContacts(offenderNo: string): Promise<Contact[]> {
    return Promise.resolve([
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
    ])
    // return this.restclient.get({
    //   path: `/prisoners/${offenderNo}/contacts`,
    //   query: new URLSearchParams({
    //     type: 'S',
    //   }).toString(),
    // })
  }
}

export default PrisonerContactRegistryApiClient
