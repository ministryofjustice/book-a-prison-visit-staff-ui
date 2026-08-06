import type { VisitBookingDetails } from '../../../data/orchestrationApiTypes'
import getAvailableVisitActions, { type AvailableVisitActions } from './getAvailableVisitActions'

beforeEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe('getAvailableVisitActions', () => {
  const startTimestamp = '2025-04-01T09:00:00'
  let params: Parameters<typeof getAvailableVisitActions>[number]

  beforeEach(() => {
    params = { visitStatus: 'BOOKED', visitSubStatus: 'AUTO_APPROVED', startTimestamp, notifications: [] }
  })

  describe('REQUESTED visit', () => {
    it('should enable only "processRequest" action if visit REQUESTED', () => {
      params.visitSubStatus = 'REQUESTED'

      expect(getAvailableVisitActions(params)).toStrictEqual<AvailableVisitActions>({
        update: false,
        cancel: false,
        clearNotifications: false,
        print: false,
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
        print: false,
        processRequest: false,
      })
    })
  })

  describe('BOOKED visit', () => {
    describe('update action', () => {
      it('should set update to false and print to true if visit has started', () => {
        jest.useFakeTimers({ now: new Date('2025-04-01T09:00:00') })
        expect(getAvailableVisitActions(params).update).toBe(false)
        expect(getAvailableVisitActions(params).print).toBe(true)
      })

      it('should set update and print to true before visit has started', () => {
        jest.useFakeTimers({ now: new Date('2025-04-01T08:59:59') })
        expect(getAvailableVisitActions(params).update).toBe(true)
        expect(getAvailableVisitActions(params).print).toBe(true)
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
      it('should set cancel and print to true before visit start time', () => {
        jest.useFakeTimers({ now: new Date('2025-04-01T08:59:59') })
        expect(getAvailableVisitActions(params).cancel).toBe(true)
        expect(getAvailableVisitActions(params).print).toBe(true)
      })

      it('should set cancel to true and print to false after visit start time, up to CANCELLATION_LIMIT_DAYS (28)', () => {
        jest.useFakeTimers({ now: new Date('2025-04-29T08:59:59') }) // startTimestamp + 28 days
        expect(getAvailableVisitActions(params).cancel).toBe(true)
        expect(getAvailableVisitActions(params).print).toBe(false)
      })

      it('should set cancel to false and print to false after CANCELLATION_LIMIT_DAYS (28)', () => {
        jest.useFakeTimers({ now: new Date('2025-04-29T09:00:00') }) // startTimestamp + 28 days + 1 second
        expect(getAvailableVisitActions(params).cancel).toBe(false)
        expect(getAvailableVisitActions(params).print).toBe(false)
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

      it('should set clearNotifications to false if visit notifications includes SESSION_VISITS_BLOCKED_FOR_DATE', () => {
        params.notifications = [
          { type: 'NON_ASSOCIATION_EVENT' },
          { type: 'SESSION_VISITS_BLOCKED_FOR_DATE' },
        ] as VisitBookingDetails['notifications']
        expect(getAvailableVisitActions(params).clearNotifications).toBe(false)
      })

      it('should set clearNotifications to false if visit notifications includes VISITOR_UNAPPROVED_EVENT', () => {
        params.notifications = [
          { type: 'NON_ASSOCIATION_EVENT' },
          { type: 'VISITOR_UNAPPROVED_EVENT' },
        ] as VisitBookingDetails['notifications']
        expect(getAvailableVisitActions(params).clearNotifications).toBe(false)
      })

      it('should set print to false if a visit notification is set', () => {
        params.notifications = [{ type: 'NON_ASSOCIATION_EVENT' }] as VisitBookingDetails['notifications']
        expect(getAvailableVisitActions(params).print).toBe(false)
      })
    })
  })
})
