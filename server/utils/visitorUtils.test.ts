import { addDays, format } from 'date-fns'
import { Restriction } from '../data/prisonerContactRegistryApiTypes'
import TestData from '../routes/testutils/testData'
import { buildVisitorListItem, getBanStatus } from './visitorUtils'

describe('visitorUtils', () => {
  describe('buildVisitorListItem', () => {
    it('should build a visitor list item from a contact', () => {
      const restrictions = [TestData.restriction()]
      const contact = TestData.contact({ restrictions })
      const visitorListItem = buildVisitorListItem(contact)

      expect(visitorListItem).toStrictEqual({
        address: 'Premises,\nFlat 23B,\n123 The Street,\nSpringfield,\nCoventry,\nWest Midlands,\nC1 2AB,\nEngland',
        adult: true,
        banned: false,
        dateOfBirth: '1986-07-28',
        name: 'Jeanette Smith',
        personId: 4321,
        relationshipDescription: 'Wife',
        restrictions,
      })
    })
  })

  describe('getBanStatus - based on max booking window', () => {
    const MAX_BOOKING_DAYS_AHEAD = 28
    const dateWithinBookingLimit = format(addDays(new Date(), 2), 'yyyy-MM-dd')
    const dateAtBookingLimit = format(addDays(new Date(), MAX_BOOKING_DAYS_AHEAD), 'yyyy-MM-dd')
    const dateBeyondBookingLimit = format(addDays(new Date(), MAX_BOOKING_DAYS_AHEAD + 1), 'yyyy-MM-dd')
    it.each([
      ['No restrictions', [], { isBanned: false }],
      ['No BAN restrictions', [TestData.restriction({ restrictionType: 'CLOSED' })], { isBanned: false }],
      [
        'Single ban with no end date',
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
        { isBanned: false, numDays: MAX_BOOKING_DAYS_AHEAD },
      ],
      [
        'Single ban with future end date beyond booking limit',
        [TestData.restriction({ restrictionType: 'BAN', expiryDate: dateBeyondBookingLimit })],
        { isBanned: true, numDays: MAX_BOOKING_DAYS_AHEAD + 1 },
      ],
      [
        'Multiple bans (not banned) - short and long ban',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateAtBookingLimit }),
        ],
        { isBanned: false, numDays: MAX_BOOKING_DAYS_AHEAD },
      ],
      [
        'Multiple bans (not banned) - long and short ban',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateAtBookingLimit }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
        ],
        { isBanned: false, numDays: MAX_BOOKING_DAYS_AHEAD },
      ],
      [
        'Multiple bans (banned) - short and limit-exceeding long ban',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateBeyondBookingLimit }),
        ],
        { isBanned: true, numDays: MAX_BOOKING_DAYS_AHEAD + 1 },
      ],
      [
        'Multiple bans (banned) - limit-exceeding long and short ban',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateBeyondBookingLimit }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
        ],
        { isBanned: true, numDays: MAX_BOOKING_DAYS_AHEAD + 1 },
      ],
      [
        'Multiple bans (banned) - short and indefinite',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: undefined }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
        ],
        { isBanned: true },
      ],
      [
        'Multiple bans (banned) - indefinite and short',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: dateWithinBookingLimit }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: undefined }),
        ],
        { isBanned: true },
      ],
    ])('%s', (_: string, restrictions: Restriction[], expected: { isBanned: boolean; numDays?: number }) => {
      const banStatus = getBanStatus(restrictions)
      expect(banStatus).toStrictEqual(expected)
    })
  })
})
