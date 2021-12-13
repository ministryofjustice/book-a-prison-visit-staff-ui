import type PrisonerSearchClient from '../data/prisonerSearchClient'
import { properCaseFullName, prisonerDobPretty } from '../utils/utils'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'

interface PrisonerDetailsRow {
  text: string
}

export default class PrisonerSearchService {
  constructor(private readonly prisonerSearchClient: PrisonerSearchClient) {}

  async getPrisoners(search: string): Promise<Array<PrisonerDetailsRow[]>> {
    const results = await this.prisonerSearchClient.getPrisoners(search)
    const { matches } = results
    const prisonerList: Array<PrisonerDetailsRow[]> = []

    matches.forEach((prisoner: { prisoner: Prisoner }) => {
      const singlePrisoner = prisoner.prisoner
      const row = [
        {
          text: properCaseFullName(`${singlePrisoner.lastName}, ${singlePrisoner.firstName}`),
        },
        {
          text: singlePrisoner.prisonerNumber,
        },
        {
          text: prisonerDobPretty(singlePrisoner.dateOfBirth),
        },
      ]

      prisonerList.push(row)
    })

    return prisonerList
  }
}
