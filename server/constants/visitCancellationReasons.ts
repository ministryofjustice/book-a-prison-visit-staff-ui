import { OutcomeDto } from '../data/orchestrationApiTypes'

const visitCancellationReasons: Partial<Record<OutcomeDto['outcomeStatus'], string>> = {
  VISITOR_CANCELLED: 'Visitor cancelled',
  ESTABLISHMENT_CANCELLED: 'Establishment cancelled',
  PRISONER_CANCELLED: 'Prisoner cancelled',
  ADMINISTRATIVE_ERROR: 'Administrative error',
}

export default visitCancellationReasons
