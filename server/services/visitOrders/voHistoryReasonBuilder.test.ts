import { VisitOrderHistoryDto } from '../../data/orchestrationApiTypes'
import TestData from '../../routes/testutils/testData'
import voHistoryReasonBuilder from './voHistoryReasonBuilder'

describe('voHistoryReasonBuilder - build VO history page reason HTML', () => {
  it.each([
    // TODO confirm content for commented-out entries

    // ['MIGRATION', 'SYSTEM', [], 'x'],

    // ['VO_ACCUMULATION', 'SYSTEM', [], 'x'],

    [
      'VO_ALLOCATION',
      'SYSTEM',
      // TODO confirm incoming case of attributeValue
      [{ attributeType: 'INCENTIVE_LEVEL', attributeValue: 'Standard' }],
      'VO allocation (standard incentive level)',
    ],

    [
      'VO_AND_PVO_ALLOCATION',
      'SYSTEM',
      // TODO confirm incoming case of attributeValue
      [{ attributeType: 'INCENTIVE_LEVEL', attributeValue: 'Standard' }],
      'VO and PVO allocation (standard incentive level)',
    ],

    [
      'PVO_ALLOCATION',
      'SYSTEM',
      // TODO confirm incoming case of attributeValue
      [{ attributeType: 'INCENTIVE_LEVEL', attributeValue: 'Standard' }],
      'PVO allocation (standard incentive level)',
    ],

    ['VO_EXPIRATION', 'SYSTEM', [], 'VO expired'],

    ['VO_AND_PVO_EXPIRATION', 'SYSTEM', [], 'VO and PVO expired'],

    ['PVO_EXPIRATION', 'SYSTEM', [], 'PVO expired'],

    [
      'ALLOCATION_USED_BY_VISIT',
      'SYSTEM',
      [{ attributeType: 'VISIT_REFERENCE', attributeValue: 'ab-cd-ef-gh' }],
      '<a href="/visit/ab-cd-ef-gh">Visit ab-cd-ef-gh</a> booked',
    ],

    [
      'ALLOCATION_REFUNDED_BY_VISIT_CANCELLED',
      'SYSTEM',
      [{ attributeType: 'VISIT_REFERENCE', attributeValue: 'ab-cd-ef-gh' }],
      '<a href="/visit/ab-cd-ef-gh">Visit ab-cd-ef-gh</a> cancelled',
    ],

    // ['PRISONER_BALANCE_RESET', 'SYSTEM', [], 'x'],

    // ['SYNC_FROM_NOMIS', 'SYSTEM', [], 'x'],

    // ['ALLOCATION_ADDED_AFTER_PRISONER_MERGE', 'SYSTEM', [], 'x'],

    // ['ADMIN_RESET_NEGATIVE_BALANCE', 'SYSTEM', [], 'x'],

    // TODO need to handle manual adjustment cases when VB-4260 is done
  ])(
    'visitOrderHistoryType: %s',
    (
      visitOrderHistoryType: VisitOrderHistoryDto['visitOrderHistoryType'],
      userName: string,
      attributes: VisitOrderHistoryDto['attributes'],
      expected: string,
    ) => {
      const visitOrderHistory = TestData.visitOrderHistoryDto({ visitOrderHistoryType, userName, attributes })
      expect(voHistoryReasonBuilder(visitOrderHistory)).toBe(expected)
    },
  )
})
