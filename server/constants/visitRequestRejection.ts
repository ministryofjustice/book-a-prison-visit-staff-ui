import { VisitRequestRejectionReason } from '../data/orchestrationApiTypes'

// Used for visit request rejection journey; order significant for radio button display
export const visitRequestRejectionReasons: Record<VisitRequestRejectionReason, string> = {
  NO_VISIT_ALLOWANCE: 'The prisoner has used up their entitlement',
  ALERT_OR_RESTRICTION: 'A restriction or an alert prevents this visit',
}

// Used for visit request rejection alert on visit details page
export const visitRequestRejectionAlerts: Record<VisitRequestRejectionReason, string> & { default: string } = {
  default: 'Request rejected',

  NO_VISIT_ALLOWANCE: 'Request rejected as the prisoner had used up their entitlement',
  ALERT_OR_RESTRICTION: 'Request rejected due to a restriction or an alert',
}

// Used for visit request rejection timeline entry on visit details page
export const visitRequestRejectionAuditEvents: Record<VisitRequestRejectionReason, string> = {
  NO_VISIT_ALLOWANCE: 'Reason: The prisoner had used up their entitlement',
  ALERT_OR_RESTRICTION: 'Reason: A restriction or an alert prevented this visit',
}
