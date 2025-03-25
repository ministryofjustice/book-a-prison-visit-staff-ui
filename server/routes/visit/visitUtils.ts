import { VisitBookingDetailsDto } from '../../data/orchestrationApiTypes'

// eslint-disable-next-line import/prefer-default-export
export const getPrisonerLocation = (prisoner: VisitBookingDetailsDto['prisoner']) => {
  if (prisoner.prisonId === 'OUT') {
    return prisoner.locationDescription
  }

  if (prisoner.prisonId === 'TRN') {
    return 'Unknown'
  }

  return `${prisoner.cellLocation}, ${prisoner.prisonName}`
}
