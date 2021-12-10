import type PrisonerSearchClient from '../data/prisonerSearchClient'
import { properCaseFullName, prisonerDobPretty } from '../utils/utils'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'

interface PrisonerSearchDetails {
  name: string
  prisonerNumber: string
  dateOfBirth: string
  bookingId: string
}

export default class PrisonerSearchService {
  constructor(private readonly prisonerSearchClient: PrisonerSearchClient) {}

  async getPrisoners(search: string): Promise<PrisonerSearchDetails[]> {
    const results = await this.prisonerSearchClient.getPrisoners(search)

    return results.map((prisoner: Prisoner) => ({
      name: properCaseFullName(`${prisoner.lastName}, ${prisoner.firstName}`),
      prisonerNumber: prisoner.prisonerNumber,
      dateOfBirth: prisonerDobPretty(prisoner.dateOfBirth),
      bookingId: prisoner.bookingId,
    }))
  }
}
