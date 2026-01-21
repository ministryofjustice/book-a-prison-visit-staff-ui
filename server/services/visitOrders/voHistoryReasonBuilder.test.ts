import { PrisonerBalanceAdjustmentReason, VisitOrderHistoryDto } from '../../data/orchestrationApiTypes'
import TestData from '../../routes/testutils/testData'
import voHistoryReasonBuilder from './voHistoryReasonBuilder'

describe('voHistoryReasonBuilder - build VO history page reason HTML', () => {
  describe('SYSTEM user entries', () => {
    const userName = 'SYSTEM'

    it.each([
      ['MIGRATION', [], 'Balance migrated from NOMIS'],

      ['VO_ACCUMULATION', [], 'Accumulated visiting orders'],

      [
        'VO_ALLOCATION',
        [{ attributeType: 'INCENTIVE_LEVEL', attributeValue: 'Standard' }],
        'VO allocation (standard incentive level)',
      ],

      [
        'VO_AND_PVO_ALLOCATION',
        [{ attributeType: 'INCENTIVE_LEVEL', attributeValue: 'Standard' }],
        'VO and PVO allocation (standard incentive level)',
      ],

      [
        'PVO_ALLOCATION',
        [{ attributeType: 'INCENTIVE_LEVEL', attributeValue: 'Standard' }],
        'PVO allocation (standard incentive level)',
      ],

      ['VO_EXPIRATION', [], 'VO expired'],

      ['VO_AND_PVO_EXPIRATION', [], 'VO and PVO expired'],

      ['PVO_EXPIRATION', [], 'PVO expired'],

      [
        'ALLOCATION_USED_BY_VISIT',

        [{ attributeType: 'VISIT_REFERENCE', attributeValue: 'ab-cd-ef-gh' }],
        '<a href="/visit/ab-cd-ef-gh?from=vo-history">Visit ab-cd-ef-gh</a> booked',
      ],

      [
        'ALLOCATION_REFUNDED_BY_VISIT_CANCELLED',

        [{ attributeType: 'VISIT_REFERENCE', attributeValue: 'ab-cd-ef-gh' }],
        '<a href="/visit/ab-cd-ef-gh?from=vo-history">Visit ab-cd-ef-gh</a> cancelled',
      ],

      ['PRISONER_BALANCE_RESET', [], 'Balance reset when prisoner received into prison'],

      ['SYNC_FROM_NOMIS', [], 'Balance changed in NOMIS'],

      [
        'ALLOCATION_ADDED_AFTER_PRISONER_MERGE',

        [
          { attributeType: 'OLD_PRISONER_ID', attributeValue: 'A1234BC' },
          { attributeType: 'NEW_PRISONER_ID', attributeValue: 'B2345CD' },
        ],
        'Balance adjusted after merging records for A1234BC and B2345CD',
      ],

      ['ADMIN_RESET_NEGATIVE_BALANCE', [], 'Negative balance removed'],
    ])(
      'visitOrderHistoryType: %s',
      (
        visitOrderHistoryType: VisitOrderHistoryDto['visitOrderHistoryType'],
        attributes: VisitOrderHistoryDto['attributes'],
        expected: string,
      ) => {
        const visitOrderHistory = TestData.visitOrderHistoryDto({ visitOrderHistoryType, userName, attributes })
        expect(voHistoryReasonBuilder(visitOrderHistory)).toBe(expected)
      },
    )
  })

  describe('Manual adjustment user entries', () => {
    const userName = 'User One'

    it.each([
      // Comment text optional for this type
      ['GOVERNOR_ADJUSTMENT', null, 'Governor’s adjustment by User One'],
      [
        'GOVERNOR_ADJUSTMENT',
        'adjustment details text',
        'Governor’s adjustment by User One<br><br>adjustment details text',
      ],

      ['BALANCE_TRANSFER_FROM_PREVIOUS_PRISON', null, 'Balance transferred from previous establishment by User One'],

      ['CORRECTIVE_ACTION', null, 'Inaccurate balance corrected by User One'],

      ['EXCHANGE_FOR_PIN_PHONE_CREDIT', null, 'Exchange for PIN phone credit by User One'],

      // Comment text required for this type
      ['OTHER', 'adjustment details text', 'adjustment details text<br><br>User One'],
    ])(
      'MANUAL_PRISONER_BALANCE_ADJUSTMENT (reason %s)',
      (adjustmentReason: PrisonerBalanceAdjustmentReason, comment: string, expected: string) => {
        const visitOrderHistory = TestData.visitOrderHistoryDto({
          visitOrderHistoryType: 'MANUAL_PRISONER_BALANCE_ADJUSTMENT',
          userName,
          comment,
          attributes: [{ attributeType: 'ADJUSTMENT_REASON_TYPE', attributeValue: adjustmentReason }],
        })
        expect(voHistoryReasonBuilder(visitOrderHistory)).toBe(expected)
      },
    )

    it('should escape user supplied text', () => {
      const rawComment = 'content "that <b>should</b> be escaped & !'
      const escapedComment = 'content &quot;that &lt;b&gt;should&lt;/b&gt; be escaped &amp; !'
      const visitOrderHistory = TestData.visitOrderHistoryDto({
        visitOrderHistoryType: 'MANUAL_PRISONER_BALANCE_ADJUSTMENT',
        userName,
        comment: rawComment,
      })

      // GOVERNOR_ADJUSTMENT type
      visitOrderHistory.attributes = [
        { attributeType: 'ADJUSTMENT_REASON_TYPE', attributeValue: 'GOVERNOR_ADJUSTMENT' },
      ]
      expect(voHistoryReasonBuilder(visitOrderHistory)).toBe(
        `Governor’s adjustment by User One<br><br>${escapedComment}`,
      )

      // OTHER type
      visitOrderHistory.attributes = [{ attributeType: 'ADJUSTMENT_REASON_TYPE', attributeValue: 'OTHER' }]
      expect(voHistoryReasonBuilder(visitOrderHistory)).toBe(`${escapedComment}<br><br>User One`)
    })
  })
})
