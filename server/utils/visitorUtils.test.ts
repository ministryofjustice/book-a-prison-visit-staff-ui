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
        address:
          'Premises,<br>Flat 23B,<br>123 The Street,<br>Springfield,<br>Coventry,<br>West Midlands,<br>C1 2AB,<br>England',
        adult: true,
        banned: false,
        dateOfBirth: '1986-07-28',
        name: 'Jeanette Smith',
        personId: 4321,
        relationshipDescription: 'Wife',
        restrictions,
      })
    })

    it.each([
      // ['label', 'input', 'expected'....]
      ['Single ban with no end date', [TestData.restriction({ restrictionType: 'BAN', expiryDate: undefined })], true],
      [
        'Single ban with past end date',
        [TestData.restriction({ restrictionType: 'BAN', expiryDate: '2020-12-12' })],
        false,
      ],
      [
        'Single ban with future (close) end date',
        [TestData.restriction({ restrictionType: 'BAN', expiryDate: format(addDays(new Date(), 5), 'yyyy-MM-dd') })],
        false,
      ],
      [
        'Single ban with future (28 days) end date',
        [TestData.restriction({ restrictionType: 'BAN', expiryDate: format(addDays(new Date(), 28), 'yyyy-MM-dd') })],
        false,
      ],
      [
        'Single ban with future (29 days) end date',
        [TestData.restriction({ restrictionType: 'BAN', expiryDate: format(addDays(new Date(), 29), 'yyyy-MM-dd') })],
        true,
      ],
      [
        'Multiple bans (acceptable)',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: format(addDays(new Date(), 1), 'yyyy-MM-dd') }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: format(addDays(new Date(), 10), 'yyyy-MM-dd') }),
        ],
        true,
      ],
      [
        'Multiple bans (acceptable)',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: format(addDays(new Date(), 1), 'yyyy-MM-dd') }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: format(addDays(new Date(), 10), 'yyyy-MM-dd') }),
        ],
        true,
      ],
      [
        'Multiple bans (unacceptable)',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: undefined }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: format(addDays(new Date(), 10), 'yyyy-MM-dd') }),
        ],
        true,
      ],
      [
        'Multiple bans (unacceptable)',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: format(addDays(new Date(), 10), 'yyyy-MM-dd') }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: undefined }),
        ],
        true,
      ],
    ])('%s', (_: string, restrictions: Restriction[], expected: boolean) => {
      const contact = TestData.contact({ restrictions })
      const visitorListItem = buildVisitorListItem(contact)

      expect(visitorListItem.banned).toBe(expected)
    })
  })

  describe.only('getBanStatus', () => {
    const twoDaysFromNow = format(addDays(new Date(), 2), 'yyyy-MM-dd')
    const twentyEightDaysFromNow = format(addDays(new Date(), 28), 'yyyy-MM-dd')
    const twentyNineDaysFromNow = format(addDays(new Date(), 29), 'yyyy-MM-dd')
    it.each([
      // ['label', 'input', 'expected'....]
      [
        'Single ban with no end date',
        [TestData.restriction({ restrictionType: 'BAN', expiryDate: undefined })],
        { isBanned: true, numDays: undefined },
      ],
      [
        'Single ban with future (close) end date',
        [TestData.restriction({ restrictionType: 'BAN', expiryDate: twoDaysFromNow })],
        { isBanned: false, numDays: 2 },
      ],
      [
        'Single ban with future (28 days) end date',
        [TestData.restriction({ restrictionType: 'BAN', expiryDate: twentyEightDaysFromNow })],
        { isBanned: false, numDays: 28 },
      ],
      [
        'Single ban with future (29 days) end date',
        [TestData.restriction({ restrictionType: 'BAN', expiryDate: twentyNineDaysFromNow })],
        { isBanned: true, numDays: 29 },
      ],
      [
        'Multiple bans (not banned)',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: twoDaysFromNow }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: twentyEightDaysFromNow }),
        ],
        { isBanned: false, numDays: 28 },
      ],
      [
        'Multiple bans (not banned)',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: twentyEightDaysFromNow }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: twoDaysFromNow }),
        ],
        { isBanned: false, numDays: 28 },
      ],
      [
        'Multiple bans (banned)',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: twoDaysFromNow }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: twentyNineDaysFromNow }),
        ],
        { isBanned: true, numDays: 29 },
      ],
      [
        'Multiple bans (banned)',
        [
          TestData.restriction({ restrictionType: 'BAN', expiryDate: twentyNineDaysFromNow }),
          TestData.restriction({ restrictionType: 'BAN', expiryDate: twoDaysFromNow }),
        ],
        { isBanned: true, numDays: 29 },
      ],
    ])('%s', (_: string, restrictions: Restriction[], expected: { isBanned: boolean; numDays?: number }) => {
      const banStatus = getBanStatus(restrictions)
      expect(banStatus).toStrictEqual(expected)
    })
  })
})
