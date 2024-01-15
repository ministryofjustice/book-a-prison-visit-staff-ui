import config from '../config'
import { OutcomeDto } from '../data/orchestrationApiTypes'

const visitCancellationReasons: Partial<Record<OutcomeDto['outcomeStatus'], string>> = {
  VISITOR_CANCELLED: 'Visitor cancelled',
  ESTABLISHMENT_CANCELLED: 'Establishment cancelled',
  PRISONER_CANCELLED: 'Prisoner cancelled',
  ...(config.features.showReviewBookingsTile ? { DETAILS_CHANGED_AFTER_BOOKING: 'Details changed after booking' } : {}),
  ADMINISTRATIVE_ERROR: 'Administrative error',
}

export default visitCancellationReasons
