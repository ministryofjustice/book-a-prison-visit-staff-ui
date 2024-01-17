import { EventAuditType } from '../data/orchestrationApiTypes'

export const eventAuditTypesOriginal: Partial<Record<EventAuditType, string>> = {
  BOOKED_VISIT: 'Booked',
  UPDATED_VISIT: 'Updated',
  CANCELLED_VISIT: 'Cancelled',
  MIGRATED_VISIT: 'Migrated',
}

export const eventAuditTypesWithReview: Partial<Record<EventAuditType, string>> = {
  BOOKED_VISIT: 'Booked',
  UPDATED_VISIT: 'Updated',
  CANCELLED_VISIT: 'Cancelled',
  MIGRATED_VISIT: 'Migrated',
  NON_ASSOCIATION_EVENT: 'Needs review',
  PRISONER_RELEASED_EVENT: 'Needs review',
  PRISONER_RESTRICTION_CHANGE_EVENT: 'Needs review',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'Needs review',
}

export const needsReviewDescriptions: Partial<Record<EventAuditType, string>> = {
  NON_ASSOCIATION_EVENT: 'Reason: Non-association',
  PRISONER_RELEASED_EVENT: 'Reason: Prisoner released',
  PRISONER_RESTRICTION_CHANGE_EVENT: 'Reason: Restriction change',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'Reason: Prison has blocked this date',
}
