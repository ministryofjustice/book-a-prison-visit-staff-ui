import { VisitBookingDetailsDto } from '../../data/orchestrationApiTypes'
import { AvailableVisitActions, getAvailableVisitActions, getPrisonerLocation } from './visitUtils'

describe('Visit utils', () => {
  describe('getPrisonerLocation', () => {
    it('should return location string with cellLocation and prisonName', () => {
      const prisonerLocation = getPrisonerLocation({
        prisonId: 'HEI',
        prisonName: 'Hewell (HMP)',
        cellLocation: '1-1-C-028',
        locationDescription: '',
      } as VisitBookingDetailsDto['prisoner'])

      expect(prisonerLocation).toBe('1-1-C-028, Hewell (HMP)')
    })

    it('should return location of "Unknown" if prisoner being transferred', () => {
      const prisonerLocation = getPrisonerLocation({
        prisonId: 'TRN',
        prisonName: '',
        cellLocation: '',
        locationDescription: '',
      } as VisitBookingDetailsDto['prisoner'])

      expect(prisonerLocation).toBe('Unknown')
    })

    it('should return location description of prisoner has been released', () => {
      const prisonerLocation = getPrisonerLocation({
        prisonId: 'OUT',
        prisonName: '',
        cellLocation: '',
        locationDescription: 'Outside - released from Hewell (HMP)',
      } as VisitBookingDetailsDto['prisoner'])

      expect(prisonerLocation).toBe('Outside - released from Hewell (HMP)')
    })
  })

  describe('getAvailableVisitActions', () => {
    const startTimestamp = '2025-04-01T09:00:00'
    let params: Parameters<typeof getAvailableVisitActions>[number]

    beforeEach(() => {
      params = { visitStatus: 'BOOKED', startTimestamp, notifications: [] }
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    describe('CANCELLED visit', () => {
      it('should set all actions to false if visit is CANCELLED', () => {
        params.visitStatus = 'CANCELLED'

        expect(getAvailableVisitActions(params)).toStrictEqual<AvailableVisitActions>({
          update: false,
          cancel: false,
          clearNotifications: false,
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
          params.notifications = [{ type: 'PRISONER_RELEASED_EVENT' }] as VisitBookingDetailsDto['notifications']
          expect(getAvailableVisitActions(params).update).toBe(false)
        })

        it('should set update to false if before start time but prisoner has been transferred', () => {
          jest.useFakeTimers({ now: new Date('2025-04-01T08:59:59') })
          params.notifications = [{ type: 'PRISONER_RECEIVED_EVENT' }] as VisitBookingDetailsDto['notifications']
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
          params.notifications = [{ type: 'NON_ASSOCIATION_EVENT' }] as VisitBookingDetailsDto['notifications']
          expect(getAvailableVisitActions(params).clearNotifications).toBe(true)
        })

        it('should set clearNotifications to false if visit notifications includes PRISON_VISITS_BLOCKED_FOR_DATE', () => {
          params.notifications = [
            { type: 'NON_ASSOCIATION_EVENT' },
            { type: 'PRISON_VISITS_BLOCKED_FOR_DATE' },
          ] as VisitBookingDetailsDto['notifications']
          expect(getAvailableVisitActions(params).clearNotifications).toBe(false)
        })
      })
    })
  })
})
