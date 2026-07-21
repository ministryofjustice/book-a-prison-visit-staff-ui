import { VisitBookingDetails } from '../../data/orchestrationApiTypes'
import { getPrisonerLocation, getIdsToFlag } from './visitUtils'

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

  describe('getIdsToFlag', () => {
    // flaggedVisitorRestrictionIds
    const visitorRestrictionId = 'VISITOR_RESTRICTION_ID'
    const visitorRestriction = 'VISITOR_RESTRICTION'
    // unapprovedVisitorIds
    const visitorId = 'VISITOR_ID'
    const visitorUnapprovedEvent = 'VISITOR_UNAPPROVED_EVENT'

    // flaggedAlertCreatedIds and flaggedAlertUpdatedIds
    const alertUuid = 'ALERT_UUID'
    const alertUpdatedEvent = 'PRISONER_ALERT_UPDATED_EVENT'
    const alertCreatedEvent = 'PRISONER_ALERT_CREATED_EVENT'

    it(`should return ${visitorRestrictionId} if notification exists for ${visitorRestriction}`, () => {
      const notifications = <VisitBookingDetails['notifications']>[
        // should be ignored as not a VISITOR_RESTRICTION
        { type: 'PRISONER_RELEASED_EVENT' },
        {
          type: visitorRestriction,
          additionalData: [{ attributeName: visitorRestrictionId, attributeValue: '1' }],
        },
        // a duplicate VISITOR_RESTRICTION_ID - should be ignored
        {
          type: visitorRestriction,
          additionalData: [{ attributeName: visitorRestrictionId, attributeValue: '1' }],
        },
        {
          type: visitorRestriction,
          additionalData: [{ attributeName: visitorRestrictionId, attributeValue: '2' }],
        },
      ]

      expect(
        getIdsToFlag({
          notificationType: visitorRestriction,
          returnedIdType: visitorRestrictionId,
          notifications,
        }),
      ).toStrictEqual(['1', '2'])
    })

    it(`should return ${visitorId} if notification exists for ${visitorUnapprovedEvent}`, () => {
      const notifications = <VisitBookingDetails['notifications']>[
        // should be ignored as not a VISITOR_UNAPPROVED_EVENT
        { type: 'PRISONER_RELEASED_EVENT' },
        {
          type: visitorUnapprovedEvent,
          additionalData: [{ attributeName: visitorId, attributeValue: '100' }],
        },
        // a duplicate VISITOR_ID - should be ignored
        {
          type: visitorUnapprovedEvent,
          additionalData: [{ attributeName: visitorId, attributeValue: '100' }],
        },
        {
          type: visitorUnapprovedEvent,
          additionalData: [{ attributeName: visitorId, attributeValue: '200' }],
        },
      ]

      expect(
        getIdsToFlag({ notificationType: visitorUnapprovedEvent, returnedIdType: visitorId, notifications }),
      ).toStrictEqual(['100', '200'])
    })

    it(`should return ${alertUuid} if notification exists for ${alertUpdatedEvent}`, () => {
      const notifications = <VisitBookingDetails['notifications']>[
        // should be ignored as not a PRISONER_ALERT_UPDATED_EVENT
        { type: 'PRISONER_RELEASED_EVENT' },
        {
          type: alertUpdatedEvent,
          additionalData: [{ attributeName: alertUuid, attributeValue: '100' }],
        },
        // a duplicate ALERT_UUID - should be ignored
        {
          type: alertUpdatedEvent,
          additionalData: [{ attributeName: alertUuid, attributeValue: '100' }],
        },
        {
          type: alertUpdatedEvent,
          additionalData: [{ attributeName: alertUuid, attributeValue: '200' }],
        },
      ]

      expect(
        getIdsToFlag({ notificationType: alertUpdatedEvent, returnedIdType: alertUuid, notifications }),
      ).toStrictEqual(['100', '200'])
    })

    it(`should return ${alertUuid} if notification exists for ${alertCreatedEvent}`, () => {
      const notifications = <VisitBookingDetails['notifications']>[
        // should be ignored as not a PRISONER_ALERT_CREATED_EVENT
        { type: 'PRISONER_RELEASED_EVENT' },
        {
          type: alertCreatedEvent,
          additionalData: [{ attributeName: alertUuid, attributeValue: '100' }],
        },
        // a duplicate ALERT_UUID - should be ignored
        {
          type: alertCreatedEvent,
          additionalData: [{ attributeName: alertUuid, attributeValue: '100' }],
        },
        {
          type: alertCreatedEvent,
          additionalData: [{ attributeName: alertUuid, attributeValue: '200' }],
        },
      ]

      expect(
        getIdsToFlag({ notificationType: alertCreatedEvent, returnedIdType: alertUuid, notifications }),
      ).toStrictEqual(['100', '200'])
    })
  })
})
