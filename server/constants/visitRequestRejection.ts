import { VisitRequestRejectionReason } from '../data/orchestrationApiTypes'

// eslint-disable-next-line import/prefer-default-export
export const visitRequestRejectionReasons: Record<VisitRequestRejectionReason, string> = {
  NO_VISIT_ALLOWANCE: 'The prisoner has used up their entitlement',
  ALERT_OR_RESTRICTION: 'A restriction or an alert prevents this visit',
}
