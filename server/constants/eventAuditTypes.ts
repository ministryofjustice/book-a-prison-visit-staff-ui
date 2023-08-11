import { EventAuditType } from '../data/orchestrationApiTypes'

const eventAuditTypes: Partial<Record<EventAuditType, string>> = {
  BOOKED_VISIT: 'Visit booked',
  UPDATED_VISIT: 'Visit updated',
  CANCELLED_VISIT: 'Visit cancelled',
  MIGRATED_VISIT: 'Visit migrated',
}

export default eventAuditTypes
