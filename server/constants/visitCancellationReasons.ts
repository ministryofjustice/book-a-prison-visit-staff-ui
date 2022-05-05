import { OutcomeDto } from '../data/visitSchedulerApiTypes'

const visitCancellationReasons: Record<OutcomeDto['outcome'], string> = {
  VISITOR_CANCELLED: 'Visitor cancelled',
  ESTABLISHMENT_CANCELLED: 'Establishment cancelled',
  PRISONER_CANCELLED: 'Prisoner cancelled',
  ADMINISTRATIVE_ERROR: 'Administrative error',
}

export default visitCancellationReasons
