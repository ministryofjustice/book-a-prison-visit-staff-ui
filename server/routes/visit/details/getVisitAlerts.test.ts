import TestData from '../../testutils/testData'
import getVisitAlerts from './getVisitAlerts'
import type { MoJAlert } from '../../../@types/bapv'
import type { VisitBookingDetails } from '../../../data/orchestrationApiTypes'
import { notificationTypeAlerts } from '../../../constants/notifications'
import { visitCancellationAlerts } from '../../../constants/visitCancellation'

describe('getVisitAlerts', () => {
  describe('Visit CANCELLED', () => {
    it('should return no alert if visitStatus **not** CANCELLED', () => {
      const visitDetails = TestData.visitBookingDetails({
        visitStatus: 'BOOKED',
        visitSubStatus: 'AUTO_APPROVED',
        outcomeStatus: 'ADMINISTRATIVE_CANCELLATION',
      })
      expect(getVisitAlerts(visitDetails)).toStrictEqual([])
    })

    describe('cancellation reasons', () => {
      it.each([
        ['an expected outcomeStatus value', 'BOOKER_CANCELLED', visitCancellationAlerts.BOOKER_CANCELLED],
        ['fallback to default', '** ANY OTHER STATUS **', visitCancellationAlerts.default],
        ['handle empty string', '', visitCancellationAlerts.default],
        ['handle undefined', undefined, visitCancellationAlerts.default],
      ])(
        "should handle %s: '%s' => %s",
        (_: string, outcomeStatus: VisitBookingDetails['outcomeStatus'], expected: string) => {
          const visitDetails = TestData.visitBookingDetails({
            visitStatus: 'CANCELLED',
            visitSubStatus: 'CANCELLED',
            outcomeStatus,
          })
          expect(getVisitAlerts(visitDetails)).toStrictEqual<MoJAlert[]>([
            {
              variant: 'information',
              title: 'Visit cancelled',
              showTitleAsHeading: true,
              text: expected,
            },
          ])
        },
      )
    })
  })

  describe('Visit request REJECTED', () => {
    it('should return an alert if visit request is REJECTED (with no rejection reason)', () => {
      const visitDetails = TestData.visitBookingDetails({
        visitStatus: 'CANCELLED',
        visitSubStatus: 'REJECTED',
        outcomeStatus: 'ESTABLISHMENT_CANCELLED',
        events: [
          {
            type: 'REQUESTED_VISIT_REJECTED',
            applicationMethodType: 'WEBSITE',
            actionedByFullName: 'User One',
            userType: 'STAFF',
            createTimestamp: '',
          },
        ],
      })

      expect(getVisitAlerts(visitDetails)).toStrictEqual<MoJAlert[]>([
        {
          variant: 'information',
          title: 'Request rejected',
          showTitleAsHeading: true,
          text: 'This visit request was rejected by User One',
        },
      ])
    })

    it('should return an alert if visit request is REJECTED (with a rejection reason)', () => {
      const visitDetails = TestData.visitBookingDetails({
        visitStatus: 'CANCELLED',
        visitSubStatus: 'REJECTED',
        outcomeStatus: 'ESTABLISHMENT_CANCELLED',
        events: [
          {
            type: 'REQUESTED_VISIT_REJECTED',
            applicationMethodType: 'WEBSITE',
            actionedByFullName: 'User One',
            userType: 'STAFF',
            text: 'NO_VISIT_ALLOWANCE',
            createTimestamp: '',
          },
        ],
      })

      expect(getVisitAlerts(visitDetails)).toStrictEqual<MoJAlert[]>([
        {
          variant: 'information',
          title: 'Request rejected as the prisoner had used up their entitlement',
          showTitleAsHeading: true,
          text: 'This visit request was rejected by User One',
        },
      ])
    })

    it('should return an alert if visit request is WITHDRAWN', () => {
      const visitDetails = TestData.visitBookingDetails({
        visitStatus: 'CANCELLED',
        visitSubStatus: 'WITHDRAWN',
        outcomeStatus: 'REQUESTED_VISIT_WITHDRAWN',
        events: [
          {
            type: 'REQUESTED_VISIT_WITHDRAWN',
            applicationMethodType: 'WEBSITE',
            actionedByFullName: undefined,
            userType: 'PUBLIC',
            createTimestamp: '',
          },
        ],
      })

      expect(getVisitAlerts(visitDetails)).toStrictEqual<MoJAlert[]>([
        {
          variant: 'information',
          title: 'Request withdrawn',
          showTitleAsHeading: true,
          text: 'This visit request was withdrawn by the booker',
        },
      ])
    })
  })

  describe('Visit request', () => {
    it('should return no alert if visit is *not* in REQUESTED state', () => {
      const visitDetails = TestData.visitBookingDetails({ visitSubStatus: 'APPROVED' })
      expect(getVisitAlerts(visitDetails)).toStrictEqual([])
    })

    it('should return alert component for a REQUESTED visit', () => {
      const visitDetails = TestData.visitBookingDetails({ visitSubStatus: 'REQUESTED' })
      expect(getVisitAlerts(visitDetails)[0].title).toBe('This request needs to be reviewed')
    })
  })

  describe('Visit notifications', () => {
    describe('Single notification(s) => single alert(s)', () => {
      it.each([
        [
          'an expected notification type',
          [{ type: 'PRISONER_RELEASED_EVENT' }],
          [notificationTypeAlerts.PRISONER_RELEASED_EVENT],
        ],
        [
          'multiple expected notifications',
          [{ type: 'PRISONER_RELEASED_EVENT' }, { type: 'PRISON_VISITS_BLOCKED_FOR_DATE' }],
          [notificationTypeAlerts.PRISONER_RELEASED_EVENT, notificationTypeAlerts.PRISON_VISITS_BLOCKED_FOR_DATE],
        ],
        [
          'an unexpected notification type',
          [{ type: 'PRISONER_RELEASED_EVENT' }, { type: '** SOME OTHER TYPE **' }],
          [notificationTypeAlerts.PRISONER_RELEASED_EVENT],
        ],
        ['no notifications', [], []],
      ])('should handle %s', (_: string, notifications: VisitBookingDetails['notifications'], expected: MoJAlert[]) => {
        const visitDetails = TestData.visitBookingDetails({ notifications })
        expect(getVisitAlerts(visitDetails)).toStrictEqual(expected)
      })
    })

    describe('Mixed notifications', () => {
      it.each([
        [
          'a single visitor restriction notification',
          [
            {
              type: 'VISITOR_RESTRICTION',
              additionalData: [{ attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '1' }],
            },
          ],
          [
            {
              variant: 'warning',
              title: 'This visit needs review',
              showTitleAsHeading: true,
              html:
                '<ul class="govuk-list">' +
                '<li><a href="#visitor-restriction-1">A restriction has been added or updated</a></li>' +
                '</ul>',
              classes: 'notifications-summary-alert',
            },
          ] as MoJAlert[],
        ],

        [
          'two visitor restriction notifications',
          [
            {
              type: 'VISITOR_RESTRICTION',
              additionalData: [{ attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '1' }],
            },
            // a duplicate VISITOR_RESTRICTION_ID - should be ignored
            {
              type: 'VISITOR_RESTRICTION',
              additionalData: [{ attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '1' }],
            },
            {
              type: 'VISITOR_RESTRICTION',
              additionalData: [{ attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '2' }],
            },
          ],
          [
            {
              variant: 'warning',
              title: 'This visit needs review',
              showTitleAsHeading: true,
              html:
                '<ul class="govuk-list">' +
                '<li><a href="#visitor-restriction-1">A restriction has been added or updated</a></li>' +
                '<li><a href="#visitor-restriction-2">A restriction has been added or updated</a></li>' +
                '</ul>',
              classes: 'notifications-summary-alert',
            },
          ],
        ],
        [
          'visitor restriction and visitor unapproved notifications',
          [
            {
              type: 'VISITOR_RESTRICTION',
              additionalData: [{ attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '2' }],
            },
            {
              type: 'VISITOR_UNAPPROVED_EVENT',
              additionalData: [{ attributeName: 'VISITOR_ID', attributeValue: '3' }],
            },
            {
              type: 'PRISONER_ALERT_UPDATED_EVENT',
              additionalData: [{ attributeName: 'ALERT_UUID', attributeValue: '4' }],
            },
            {
              type: 'PRISONER_ALERT_CREATED_EVENT',
              additionalData: [{ attributeName: 'ALERT_UUID', attributeValue: '5' }],
            },
          ],
          [
            {
              variant: 'warning',
              title: 'This visit needs review',
              showTitleAsHeading: true,
              html:
                '<ul class="govuk-list">' +
                '<li><a href="#visitor-restriction-2">A restriction has been added or updated</a></li>' +
                '<li><a href="#visitor-3">Visitor has been unapproved</a></li>' +
                '<li><a href="#prisoner-alert-4">An alert has been updated</a></li>' +
                '<li><a href="#prisoner-alert-5">An alert has been added</a></li>' +
                '</ul>',
              classes: 'notifications-summary-alert',
            },
          ],
        ],
      ])('should handle %s', (_: string, notifications: VisitBookingDetails['notifications'], expected: MoJAlert[]) => {
        const visitDetails = TestData.visitBookingDetails({ notifications })
        expect(getVisitAlerts(visitDetails)).toStrictEqual(expected)
      })
    })

    describe('Mixed single/grouped notifications', () => {
      it('should handle a mix of notifications: one single and two to group as one', () => {
        const notifications = [
          { type: 'PRISONER_RELEASED_EVENT' },
          {
            type: 'VISITOR_RESTRICTION',
            additionalData: [{ attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '1' }],
          },
          {
            type: 'VISITOR_RESTRICTION',
            additionalData: [{ attributeName: 'VISITOR_RESTRICTION_ID', attributeValue: '2' }],
          },
        ] as VisitBookingDetails['notifications']

        const visitDetails = TestData.visitBookingDetails({ notifications })
        const result = getVisitAlerts(visitDetails)

        expect(result).toStrictEqual<MoJAlert[]>([
          notificationTypeAlerts.PRISONER_RELEASED_EVENT,
          {
            variant: 'warning',
            title: 'This visit needs review',
            showTitleAsHeading: true,
            html:
              '<ul class="govuk-list">' +
              '<li><a href="#visitor-restriction-1">A restriction has been added or updated</a></li>' +
              '<li><a href="#visitor-restriction-2">A restriction has been added or updated</a></li>' +
              '</ul>',
            classes: 'notifications-summary-alert',
          } as MoJAlert,
        ])
      })
    })
  })
})
