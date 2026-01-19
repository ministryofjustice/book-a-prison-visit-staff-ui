import { VisitOrderHistoryDto } from '../../data/orchestrationApiTypes'
import TestData from '../../routes/testutils/testData'
import voHistoryReasonBuilder from './voHistoryReasonBuilder'

describe('voHistoryReasonBuilder - build VO history page reason HTML', () => {
  it.each([
    ['MIGRATION', 'SYSTEM', [], 'Balance migrated from NOMIS'],

    ['VO_ACCUMULATION', 'SYSTEM', [], 'Accumulated visiting orders'],

    [
      'VO_ALLOCATION',
      'SYSTEM',
      [{ attributeType: 'INCENTIVE_LEVEL', attributeValue: 'Standard' }],
      'VO allocation (standard incentive level)',
    ],

    [
      'VO_AND_PVO_ALLOCATION',
      'SYSTEM',
      [{ attributeType: 'INCENTIVE_LEVEL', attributeValue: 'Standard' }],
      'VO and PVO allocation (standard incentive level)',
    ],

    [
      'PVO_ALLOCATION',
      'SYSTEM',
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

    ['PRISONER_BALANCE_RESET', 'SYSTEM', [], 'Balance reset when prisoner received into prison'],

    ['SYNC_FROM_NOMIS', 'SYSTEM', [], 'Balance changed in NOMIS'],

    [
      'ALLOCATION_ADDED_AFTER_PRISONER_MERGE',
      'SYSTEM',
      [
        { attributeType: 'OLD_PRISONER_ID', attributeValue: 'A1234BC' },
        { attributeType: 'NEW_PRISONER_ID', attributeValue: 'B2345CD' },
      ],
      'Balance adjusted after merging records for A1234BC and B2345CD',
    ],

    ['ADMIN_RESET_NEGATIVE_BALANCE', 'SYSTEM', [], 'Negative balance removed'],

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
