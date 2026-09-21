import { addDays, format } from 'date-fns'
import { Address, Contact, Restriction } from '../data/prisonerContactRegistryApiTypes'
import TestData from '../routes/testutils/testData'
import { buildVisitorListItem, getBanStatus, getFormattedAddress } from './visitorUtils'

describe('buildVisitorListItem', () => {
  const fakeDate = new Date('2020-02-01T09:00:00')
  const policyNoticeDaysMax = 28
  const restrictions = [TestData.restriction()]
  let contact: Contact

  beforeEach(() => {
    jest.useFakeTimers({ now: fakeDate })

    contact = TestData.contact({ restrictions })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should build a visitor list item from a contact', () => {
    const visitorListItem = buildVisitorListItem(contact, policyNoticeDaysMax)

    expect(visitorListItem).toStrictEqual({
      address: 'Premises,\nFlat 23B,\n123 The Street,\nSpringfield,\nCoventry,\nWest Midlands,\nC1 2AB,\nEngland',
      adult: true,
      banned: false,
      dateOfBirth: '1986-07-28',
      age: 33,
      name: 'Jeanette Smith',
      personId: 4321,
      relationshipDescription: 'Wife',
      restrictions,
    })
  })

  it('should handle a child visitor', () => {
    contact.dateOfBirth = '2018-07-28'
    const visitorListItem = buildVisitorListItem(contact, policyNoticeDaysMax)

    expect(visitorListItem.age).toBe(1)
    expect(visitorListItem.adult).toBe(false)
  })

  it('should handle a visitor with no date of birth', () => {
    delete contact.dateOfBirth
    const visitorListItem = buildVisitorListItem(contact, policyNoticeDaysMax)

    expect(visitorListItem.age).toBe(undefined)
    expect(visitorListItem.adult).toBe(true)
  })
})

describe('getFormattedAddress', () => {
  it.each([
    [
      'Full address',
      TestData.address(),
      'Premises,\nFlat 23B,\n123 The Street,\nSpringfield,\nCoventry,\nWest Midlands,\nC1 2AB,\nEngland',
    ],
    [
      'Partial address',
      {
        street: '123 The Street',
        town: 'Coventry',
        postalCode: 'C1 2AB',
      },
      '123 The Street,\nCoventry,\nC1 2AB',
    ],
    ['Empty address', {}, 'Not entered'],
    ['null address', null, 'Not entered'],
    ['undefined address', undefined, 'Not entered'],
  ])('%s', (_: string, address: Address, expected: string) => {
    const formattedAddress = getFormattedAddress(address)
    expect(formattedAddress).toStrictEqual(expected)
  })
})

describe('getBanStatus - based on max booking window', () => {
  const policyNoticeDaysMax = 28
  const dateWithinBookingLimit = format(addDays(new Date(), 2), 'yyyy-MM-dd')
  const dateAtBookingLimit = format(addDays(new Date(), policyNoticeDaysMax), 'yyyy-MM-dd')
  const dateBeyondBookingLimit = format(addDays(new Date(), policyNoticeDaysMax + 1), 'yyyy-MM-dd')
  it.each([
    ['No restrictions', [], { isBanned: false }],
    ['No BAN restrictions', [TestData.restriction({ restrictionType: 'CLOSED' })], { isBanned: false }],
    [
      'Single ban with no end date (null)',
      [TestData.restriction({ restrictionType: 'BAN', expiryDate: null })],
      { isBanned: true },
    ],
    [
      'Single ban with no end date (undefined)',
      [TestData.restriction({ restrictionType: 'BAN', expiryDate: undefined })],
      { isBanned: true },
    ],
    [
      'Single ban with future end date within booking limit',
      [TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit })],
      { isBanned: false, numDays: 2 },
    ],
    [
      'Single ban with future end date at booking limit',
      [TestData.restriction({ restrictionType: 'BAN', expiryDate: dateAtBookingLimit })],
      { isBanned: false, numDays: policyNoticeDaysMax },
    ],
    [
      'Single ban with future end date beyond booking limit',
      [TestData.restriction({ restrictionType: 'BAN', expiryDate: dateBeyondBookingLimit })],
      { isBanned: true, numDays: policyNoticeDaysMax + 1 },
    ],
    [
      'Multiple bans (not banned) - short and long ban',
      [
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateAtBookingLimit }),
      ],
      { isBanned: false, numDays: policyNoticeDaysMax },
    ],
    [
      'Multiple bans (not banned) - long and short ban',
      [
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateAtBookingLimit }),
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
      ],
      { isBanned: false, numDays: policyNoticeDaysMax },
    ],
    [
      'Multiple bans (banned) - short and limit-exceeding long ban',
      [
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateBeyondBookingLimit }),
      ],
      { isBanned: true, numDays: policyNoticeDaysMax + 1 },
    ],
    [
      'Multiple bans (banned) - limit-exceeding long and short ban',
      [
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateBeyondBookingLimit }),
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
      ],
      { isBanned: true, numDays: policyNoticeDaysMax + 1 },
    ],
    [
      'Multiple bans (banned) - short and indefinite',
      [
        TestData.restriction({ restrictionType: 'BAN', expiryDate: null }),
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
      ],
      { isBanned: true },
    ],
    [
      'Multiple bans (banned) - indefinite and short',
      [
        TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
        TestData.restriction({ restrictionType: 'BAN', expiryDate: null }),
      ],
      { isBanned: true },
    ],
  ])('%s', (_: string, restrictions: Restriction[], expected: { isBanned: boolean; numDays?: number }) => {
    const banStatus = getBanStatus(restrictions, policyNoticeDaysMax)
    expect(banStatus).toStrictEqual(expected)
  })
})
