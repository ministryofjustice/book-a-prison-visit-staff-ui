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
    const { content } = results
    const prisonerList: Array<PrisonerDetailsRow[]> = []

    content.forEach((prisoner: Prisoner) => {
      const row = [
        {
          text: properCaseFullName(`${prisoner.lastName}, ${prisoner.firstName}`),
        },
        {
          text: prisoner.prisonerNumber,
        },
        {
          text: prisonerDobPretty(prisoner.dateOfBirth),
        },
      ]

      prisonerList.push(row)
    })

    return prisonerList
  }
}
