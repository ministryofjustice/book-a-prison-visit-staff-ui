import type { EventAudit } from '../../../data/orchestrationApiTypes'
import isPublicBooking from './isPublicBooking'

describe('isPublicBooking', () => {
  it.each<{ type: EventAudit['type']; userType: EventAudit['userType']; expected: boolean }>([
    { type: 'BOOKED_VISIT', userType: 'PUBLIC', expected: true },
    { type: 'BOOKED_VISIT', userType: 'STAFF', expected: false },
    { type: 'MIGRATED_VISIT', userType: 'SYSTEM', expected: false }, // example of a case where it is not known
  ])('should return $expected for type=$type and userType=$userType', ({ type, userType, expected }) => {
    const events: EventAudit[] = [
      { applicationMethodType: 'NOT_KNOWN', createTimestamp: '2022-01-01T09:00:00', type, userType },
    ]

    expect(isPublicBooking(events)).toStrictEqual(expected)
  })
})
