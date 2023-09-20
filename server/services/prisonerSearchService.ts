import { properCaseFullName, prisonerDatePretty } from '../utils/utils'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import { PrisonerDetailsItem } from '../@types/bapv'
import { HmppsAuthClient, PrisonerSearchClient, RestClientBuilder } from '../data'

export default class PrisonerSearchService {
  private numberOfPages = 1

  private currentPage = 0 // API page number is 0-indexed

  constructor(
    private readonly prisonerSearchClientFactory: RestClientBuilder<PrisonerSearchClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  private getPreviousPage(): number {
    return this.currentPage > 0 ? this.currentPage - 1 : 0
  }

  private getNextPage(): number {
    return this.currentPage < this.numberOfPages - 1 ? this.currentPage + 1 : this.numberOfPages - 1
  }

  async getPrisoners(
    search: string,
    prisonId: string,
    username: string,
    page: number,
    visit?: boolean,
  ): Promise<{
    results: Array<PrisonerDetailsItem[]>
    numberOfResults: number
    numberOfPages: number
    next: number
    previous: number
  }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerSearchClient = this.prisonerSearchClientFactory(token)
    this.currentPage = page - 1
    const { totalPages, totalElements, content } = await prisonerSearchClient.getPrisoners(
      search,
      prisonId,
      this.currentPage,
    )
    this.numberOfPages = totalPages
    const nextPage = this.getNextPage()
    const previousPage = this.getPreviousPage()
    const prisonerList: Array<PrisonerDetailsItem[]> = []
    const queryParams = new URLSearchParams({ search }).toString()

    content.forEach((prisoner: Prisoner) => {
      const url = visit
        ? `<a href="/prisoner/${
            prisoner.prisonerNumber
          }/visits?${queryParams}" class="bapv-result-row">${properCaseFullName(
            `${prisoner.lastName}, ${prisoner.firstName}`,
          )}</a>`
        : `<a href="/prisoner/${prisoner.prisonerNumber}?${queryParams}" class="bapv-result-row">${properCaseFullName(
            `${prisoner.lastName}, ${prisoner.firstName}`,
          )}</a>`
      const row: PrisonerDetailsItem[] = [
        {
          html: url,
        },
        {
          html: prisoner.prisonerNumber,
        },
        {
          html: prisonerDatePretty({ dateToFormat: prisoner.dateOfBirth }),
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

  async getPrisoner(search: string, prisonId: string, username: string): Promise<Prisoner> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerSearchClient = this.prisonerSearchClientFactory(token)
    const { content } = await prisonerSearchClient.getPrisoner(search, prisonId)
    return content.length === 1 ? content[0] : null
  }

  async getPrisonerById(id: string, username: string): Promise<Prisoner> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerSearchClient = this.prisonerSearchClientFactory(token)
    return prisonerSearchClient.getPrisonerById(id)
  }

  async getMessagePrisoner(id: string, establishmentName: string, username: string): Promise<string> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerSearchClient = this.prisonerSearchClientFactory(token)
    const prisoner = await prisonerSearchClient.getPrisonerById(id)
    let message = 'There are no results for this prison number at any establishment.'
    if (prisoner.inOutStatus === 'OUT' || prisoner.inOutStatus === 'TRN') {
      message = `This prisoner is not in ${establishmentName}. They might be being moved to another establishment or have been released.`
    } else if (prisoner.inOutStatus === 'IN') {
      message =
        'This prisoner is located at another establishment. The visitor should contact the prisoner to find out their location.'
    }

    return message
  }

  async getPrisonersByPrisonerNumbers(
    prisonerVisits: {
      prisoner: string
      visit: string
    }[],
    queryStringForBackLink: string,
    username: string,
    page: number,
  ): Promise<{
    results: Array<PrisonerDetailsItem[]>
    numberOfResults: number
    numberOfPages: number
    next: number
    previous: number
  }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerSearchClient = this.prisonerSearchClientFactory(token)
    const prisonerNumbers = prisonerVisits.flatMap(prisonerVisit => prisonerVisit.prisoner)
    this.currentPage = page - 1
    const { totalPages, totalElements, content } = await prisonerSearchClient.getPrisonersByPrisonerNumbers(
      prisonerNumbers,
      this.currentPage,
    )
    this.numberOfPages = totalPages
    const nextPage = this.getNextPage()
    const previousPage = this.getPreviousPage()
    const prisonerList: Array<PrisonerDetailsItem[]> = []
    const fromQueryString = new URLSearchParams({
      query: queryStringForBackLink,
      from: 'visit-search',
    }).toString()

    content.forEach((prisoner: Prisoner) => {
      const matchingVisit = prisonerVisits.find(prisonerVisit => prisonerVisit.prisoner === prisoner.prisonerNumber)
      const row: PrisonerDetailsItem[] = [
        {
          text: properCaseFullName(`${prisoner.lastName}, ${prisoner.firstName}`),
          attributes: {
            'data-test': 'prisoner-name',
          },
        },
        {
          text: prisoner.prisonerNumber,
          attributes: {
            'data-test': 'prisoner-number',
          },
        },
        {
          html: `<a href="/visit/${matchingVisit.visit}?${fromQueryString}" class="bapv-result-row">View</a>`,
          classes: 'govuk-!-text-align-right',
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
