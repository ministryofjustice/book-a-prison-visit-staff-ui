import { EventAuditType } from '../data/orchestrationApiTypes'

const eventAuditTypes: Partial<Record<EventAuditType, string>> = {
  BOOKED_VISIT: 'Booked',
  UPDATED_VISIT: 'Updated',
  CANCELLED_VISIT: 'Cancelled',
  MIGRATED_VISIT: 'Migrated',
  NON_ASSOCIATION_EVENT: 'Needs review',
  PRISONER_RECEIVED_EVENT: 'Needs review',
  PRISONER_RELEASED_EVENT: 'Needs review',
  PRISONER_RESTRICTION_CHANGE_EVENT: 'Needs review',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'Needs review',
  IGNORE_VISIT_NOTIFICATIONS_EVENT: 'No change required',
  PERSON_RESTRICTION_UPSERTED_EVENT: 'Needs review',
  PRISONER_ALERTS_UPDATED_EVENT: 'Needs review',
}

export default eventAuditTypes
