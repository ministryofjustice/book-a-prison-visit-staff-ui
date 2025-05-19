import { OutcomeDto } from '../data/orchestrationApiTypes'

type OutcomeStatus = OutcomeDto['outcomeStatus']

// used for cancellation journey; order significant for radio button display
export const visitCancellationReasons: Partial<Record<OutcomeDto['outcomeStatus'], string>> = {
  VISITOR_CANCELLED: 'Visitor cancelled',
  ESTABLISHMENT_CANCELLED: 'Establishment cancelled',
  PRISONER_CANCELLED: 'Prisoner cancelled',
  DETAILS_CHANGED_AFTER_BOOKING: 'Details changed after booking',
  ADMINISTRATIVE_ERROR: 'Administrative error',
}

// used for cancellation alert on visit details page
export const visitCancellationAlerts: Partial<Record<OutcomeStatus, string>> & { default: string } = {
  default: 'This visit was cancelled.',

  ADMINISTRATIVE_CANCELLATION: 'This visit was cancelled due to an administrative error with the booking.',
  ADMINISTRATIVE_ERROR: 'This visit was cancelled due to an administrative error with the booking.',
  BOOKER_CANCELLED: 'This visit was cancelled by a visitor.',
  DETAILS_CHANGED_AFTER_BOOKING: 'This visit was cancelled as the details changed after booking.',
  ESTABLISHMENT_CANCELLED: 'This visit was cancelled by the establishment.',
  PRISONER_CANCELLED: 'This visit was cancelled by the prisoner.',
  VISITOR_CANCELLED: 'This visit was cancelled by a visitor.',
}
