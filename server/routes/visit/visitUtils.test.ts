import { MoJAlert } from '../../@types/bapv'
import { notificationTypeAlerts } from '../../constants/notifications'
import { visitCancellationAlerts } from '../../constants/visitCancellation'
import { EventAudit, VisitBookingDetails } from '../../data/orchestrationApiTypes'
import TestData from '../testutils/testData'
import {
  getPrisonerLocation,
  getAvailableVisitActions,
  AvailableVisitActions,
  isPublicBooking,
  getVisitorRestrictionIdsToFlag,
  getVisitAlerts,
} from './visitUtils'

beforeEach(() => {
  jest.restoreAllMocks()
})

describe('Visit utils', () => {
  describe('getPrisonerLocation', () => {
    it('should return location string with cellLocation and prisonName', () => {
      const prisonerLocation = getPrisonerLocation({
        prisonId: 'HEI',
        prisonName: 'Hewell (HMP)',
        cellLocation: '1-1-C-028',
        locationDescription: '',
      } as VisitBookingDetails['prisoner'])

      expect(prisonerLocation).toBe('1-1-C-028, Hewell (HMP)')
    })

    it('should return location of "Unknown" if prisoner being transferred', () => {
      const prisonerLocation = getPrisonerLocation({
        prisonId: 'TRN',
        prisonName: '',
        cellLocation: '',
        locationDescription: '',
      } as VisitBookingDetails['prisoner'])

      expect(prisonerLocation).toBe('Unknown')
    })

    it('should return location description of prisoner has been released', () => {
      const prisonerLocation = getPrisonerLocation({
        prisonId: 'OUT',
        prisonName: '',
        cellLocation: '',
        locationDescription: 'Outside - released from Hewell (HMP)',
      } as VisitBookingDetails['prisoner'])

      expect(prisonerLocation).toBe('Outside - released from Hewell (HMP)')
    })
  })

  describe('getAvailableVisitActions', () => {
    const startTimestamp = '2025-04-01T09:00:00'
    let params: Parameters<typeof getAvailableVisitActions>[number]

    beforeEach(() => {
      params = { visitStatus: 'BOOKED', visitSubStatus: 'AUTO_APPROVED', startTimestamp, notifications: [] }
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    describe('REQUESTED visit', () => {
      it('should enable only "processRequest" action if visit REQUESTED', () => {
        params.visitSubStatus = 'REQUESTED'

        expect(getAvailableVisitActions(params)).toStrictEqual<AvailableVisitActions>({
          update: false,
          cancel: false,
          clearNotifications: false,
          processRequest: true,
        })
      })
    })

    describe('CANCELLED visit', () => {
      it('should set all actions to false if visit is CANCELLED', () => {
        params.visitStatus = 'CANCELLED'

        expect(getAvailableVisitActions(params)).toStrictEqual<AvailableVisitActions>({
          update: false,
          cancel: false,
          clearNotifications: false,
          processRequest: false,
        })
      })
    })

    describe('BOOKED visit', () => {
      describe('update action', () => {
        it('should set update to false if visit has started', () => {
          jest.useFakeTimers({ now: new Date('2025-04-01T09:00:00') })
          expect(getAvailableVisitActions(params).update).toBe(false)
        })

        it('should set update to true before visit has started', () => {
          jest.useFakeTimers({ now: new Date('2025-04-01T08:59:59') })
          expect(getAvailableVisitActions(params).update).toBe(true)
        })

        it('should set update to false if before start time but prisoner has been released', () => {
          jest.useFakeTimers({ now: new Date('2025-04-01T08:59:59') })
          params.notifications = [{ type: 'PRISONER_RELEASED_EVENT' }] as VisitBookingDetails['notifications']
          expect(getAvailableVisitActions(params).update).toBe(false)
        })

        it('should set update to false if before start time but prisoner has been transferred', () => {
          jest.useFakeTimers({ now: new Date('2025-04-01T08:59:59') })
          params.notifications = [{ type: 'PRISONER_RECEIVED_EVENT' }] as VisitBookingDetails['notifications']
          expect(getAvailableVisitActions(params).update).toBe(false)
        })
      })

      describe('cancel action', () => {
        it('should set cancel to true before visit start time', () => {
          jest.useFakeTimers({ now: new Date('2025-04-01T08:59:59') })
          expect(getAvailableVisitActions(params).cancel).toBe(true)
        })

        it('should set cancel to true after visit start time, up to CANCELLATION_LIMIT_DAYS (28)', () => {
          jest.useFakeTimers({ now: new Date('2025-04-29T08:59:59') }) // startTimestamp + 28 days
          expect(getAvailableVisitActions(params).cancel).toBe(true)
        })

        it('should set cancel to false after CANCELLATION_LIMIT_DAYS (28)', () => {
          jest.useFakeTimers({ now: new Date('2025-04-29T09:00:00') }) // startTimestamp + 28 days + 1 second
          expect(getAvailableVisitActions(params).cancel).toBe(false)
        })
      })

      describe('clearNotifications action', () => {
        it('should set clearNotifications to false if no visit notifications', () => {
          expect(getAvailableVisitActions(params).clearNotifications).toBe(false)
        })

        it('should set clearNotifications to true if a visit notification is set', () => {
          params.notifications = [{ type: 'NON_ASSOCIATION_EVENT' }] as VisitBookingDetails['notifications']
          expect(getAvailableVisitActions(params).clearNotifications).toBe(true)
        })

        it('should set clearNotifications to false if visit notifications includes PRISON_VISITS_BLOCKED_FOR_DATE', () => {
          params.notifications = [
            { type: 'NON_ASSOCIATION_EVENT' },
            { type: 'PRISON_VISITS_BLOCKED_FOR_DATE' },
          ] as VisitBookingDetails['notifications']
          expect(getAvailableVisitActions(params).clearNotifications).toBe(false)
        })
      })
    })
  })

  describe('getVisitAlerts', () => {
    describe('Visit CANCELLED', () => {
      it('should return no alert if visitStatus **not** CANCELLED', () => {
        const visitDetails = TestData.visitBookingDetails({
          visitStatus: 'BOOKED',
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
            const visitDetails = TestData.visitBookingDetails({ visitStatus: 'CANCELLED', outcomeStatus })
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
        ])(
          'should handle %s',
          (_: string, notifications: VisitBookingDetails['notifications'], expected: MoJAlert[]) => {
            const visitDetails = TestData.visitBookingDetails({ notifications })
            expect(getVisitAlerts(visitDetails)).toStrictEqual(expected)
          },
        )
      })

      describe('Visitor restriction notification(s) => single alert with grouped restrictions', () => {
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
        ])(
          'should handle %s',
          (_: string, notifications: VisitBookingDetails['notifications'], expected: MoJAlert[]) => {
            const visitDetails = TestData.visitBookingDetails({ notifications })
            expect(getVisitAlerts(visitDetails)).toStrictEqual(expected)
          },
        )
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

  describe('getVisitorRestrictionIdsToFlag', () => {
    it('should extract unique visitor restriction IDs if present from list of visit notifications', () => {
      const notifications = <VisitBookingDetails['notifications']>[
        // should be ignored as not a VISITOR_RESTRICTION
        { type: 'PRISONER_RELEASED_EVENT' },
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
      ]

      expect(getVisitorRestrictionIdsToFlag(notifications)).toStrictEqual([1, 2])
    })
  })

  describe('isPublicBooking', () => {
    const events: EventAudit[] = [
      {
        applicationMethodType: 'NOT_KNOWN',
        createTimestamp: '2022-01-01T09:00:00',
        type: 'UPDATED_VISIT',
        userType: 'STAFF',
      },
    ]

    it('should return true if visit booked event is from public user type', () => {
      events[0].type = 'BOOKED_VISIT'
      events[0].userType = 'PUBLIC'

      const publicBooker = isPublicBooking(events)
      expect(publicBooker).toStrictEqual(true)
    })

    it('should return false if visit booked event is from staff user type', () => {
      events[0].type = 'BOOKED_VISIT'
      events[0].userType = 'STAFF'

      const publicBooker = isPublicBooking(events)
      expect(publicBooker).toStrictEqual(false)
    })

    it('should return false if no visit booked event is present', () => {
      events[0].type = 'UPDATED_VISIT'
      events[0].userType = 'PUBLIC'

      const publicBooker = isPublicBooking(events)
      expect(publicBooker).toStrictEqual(false)
    })
  })
})
