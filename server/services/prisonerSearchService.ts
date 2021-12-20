import systemToken from '../data/authClient'
import { properCaseFullName, prisonerDobPretty } from '../utils/utils'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import PrisonerSearchClient from '../data/prisonerSearchClient'

interface PrisonerDetailsRow {
  text: string
}

type PrisonerSearchClientBuilder = (token: string) => PrisonerSearchClient

export default class PrisonerSearchService {
  constructor(private readonly prisonerSearchClientBuilder: PrisonerSearchClientBuilder) {}

  async getPrisoners(search: string, username: string): Promise<Array<PrisonerDetailsRow[]>> {
    const token = await systemToken(username)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(token)
    const results = await prisonerSearchClient.getPrisoners(search)
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
