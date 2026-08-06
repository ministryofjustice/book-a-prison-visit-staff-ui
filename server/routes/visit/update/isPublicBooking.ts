import type { EventAudit } from '../../../data/orchestrationApiTypes'

export default (events: EventAudit[]): boolean => {
  return events.find(event => event.type === 'BOOKED_VISIT')?.userType === 'PUBLIC'
}
