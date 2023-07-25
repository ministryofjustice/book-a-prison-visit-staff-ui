import { EventAuditOutcomes } from '../data/orchestrationApiTypes'

const eventAuditText: Partial<Record<EventAuditOutcomes, string>> = {
  BOOKED_VISIT: 'Visit booked',
  UPDATED_VISIT: 'Visit updated',
  CANCELED_VISIT: 'Visit cancelled',
  MIGRATED_VISIT: 'Visit migrated',
}

export default eventAuditText
