import { properCaseFullName, prisonerDobPretty } from '../utils/utils'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import PrisonerSearchClient from '../data/prisonerSearchClient'
import { PrisonerDetailsItem, SystemToken } from '../@types/bapv'

type PrisonerSearchClientBuilder = (token: string) => PrisonerSearchClient

export default class PrisonerSearchService {
  private numberOfPages = 1

  private currentPage = 0 // API page number is 0-indexed

  constructor(
    private readonly prisonerSearchClientBuilder: PrisonerSearchClientBuilder,
    private readonly systemToken: SystemToken
  ) {}

  private getPreviousPage(): number {
    return this.currentPage > 0 ? this.currentPage - 1 : 0
  }

  private getNextPage(): number {
    return this.currentPage < this.numberOfPages - 1 ? this.currentPage + 1 : this.numberOfPages - 1
  }

  async getPrisoners(
    search: string,
    username: string,
    page: number
  ): Promise<{
    results: Array<PrisonerDetailsItem[]>
    numberOfResults: number
    numberOfPages: number
    next: number
    previous: number
  }> {
    const token = await this.systemToken(username)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(token)
    this.currentPage = page - 1
    const { totalPages, totalElements, content } = await prisonerSearchClient.getPrisoners(search, this.currentPage)
    this.numberOfPages = totalPages
    const nextPage = this.getNextPage()
    const previousPage = this.getPreviousPage()
    const prisonerList: Array<PrisonerDetailsItem[]> = []

    content.forEach((prisoner: Prisoner) => {
      const row: PrisonerDetailsItem[] = [
        {
          html: `<a href="/prisoner/${prisoner.prisonerNumber}">${properCaseFullName(
            `${prisoner.lastName}, ${prisoner.firstName}`
          )}</a>`,
          classes: 'bapv-table_cell',
        },
        {
          html: prisoner.prisonerNumber,
          classes: 'bapv-table_cell',
        },
        {
          html: prisonerDobPretty(prisoner.dateOfBirth),
          classes: 'bapv-table_cell',
        },
      ]

      prisonerList.push(row)
    })

    return {
      results: prisonerList,
      numberOfResults: totalElements,
      numberOfPages: this.numberOfPages,
      next: nextPage + 1,
      previous: previousPage + 1,
    }
  }
}
