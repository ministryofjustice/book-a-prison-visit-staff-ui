import { VisitBookingDetailsDto } from '../../data/orchestrationApiTypes'
import { getPrisonerLocation } from './visitUtils'

describe('Visit utils', () => {
  describe('getPrisonerLocation', () => {
    it('should return location string with cellLocation and prisonName', () => {
      const prisonerLocation = getPrisonerLocation({
        prisonId: 'HEI',
        prisonName: 'Hewell (HMP)',
        cellLocation: '1-1-C-028',
        locationDescription: '',
      } as VisitBookingDetailsDto['prisoner'])

      expect(prisonerLocation).toBe('1-1-C-028, Hewell (HMP)')
    })

    it('should return location of "Unknown" if prisoner being transferred', () => {
      const prisonerLocation = getPrisonerLocation({
        prisonId: 'TRN',
        prisonName: '',
        cellLocation: '',
        locationDescription: '',
      } as VisitBookingDetailsDto['prisoner'])

      expect(prisonerLocation).toBe('Unknown')
    })

    it('should return location description of prisoner has been released', () => {
      const prisonerLocation = getPrisonerLocation({
        prisonId: 'OUT',
        prisonName: '',
        cellLocation: '',
        locationDescription: 'Outside - released from Hewell (HMP)',
      } as VisitBookingDetailsDto['prisoner'])

      expect(prisonerLocation).toBe('Outside - released from Hewell (HMP)')
    })
  })
})
