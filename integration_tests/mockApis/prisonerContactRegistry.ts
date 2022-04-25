import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubGetPrisonerContacts: (): SuperAgentRequest => {
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

    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/prisoners/*/contacts?type=S',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: results,
      },
    })
  },
}
