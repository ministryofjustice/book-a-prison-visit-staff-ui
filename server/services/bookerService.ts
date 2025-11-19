import { compareDesc } from 'date-fns'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import { BookerDetailedInfoDto, BookerSearchResultsDto, SocialContactsDto } from '../data/orchestrationApiTypes'

export default class BookerService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  // get bookers by email address with most recently created (the active one) first
  async getSortedBookersByEmail({
    username,
    email,
  }: {
    username: string
    email: string
  }): Promise<BookerSearchResultsDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const unsortedBookers = await orchestrationApiClient.getBookersByEmail(email)
    const bookersByCreatedDesc = unsortedBookers.toSorted((a, b) =>
      compareDesc(new Date(a.createdTimestamp), new Date(b.createdTimestamp)),
    )

    return bookersByCreatedDesc
  }

  async getBookerDetails({
    username,
    reference,
  }: {
    username: string
    reference: string
  }): Promise<BookerDetailedInfoDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getBookerDetails(reference)
  }

  async getNonLinkedSocialContacts({
    username,
    reference,
    prisonerId,
  }: {
    username: string
    reference: string
    prisonerId: string
  }): Promise<SocialContactsDto[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getNonLinkedSocialContacts({ reference, prisonerId })
  }

  async getBookerStatus({
    username,
    email,
    reference,
  }: {
    username: string
    email: string
    reference: string
  }): Promise<{ active: boolean; emailHasMultipleAccounts: boolean }> {
    const bookers = await this.getSortedBookersByEmail({ username, email })
    const emailHasMultipleAccounts = bookers.length > 1
    const active = bookers[0]?.reference === reference

    return { active, emailHasMultipleAccounts }
  }

  async linkBookerVisitor({
    username,
    reference,
    prisonerId,
    visitorId,
    sendNotification,
  }: {
    username: string
    reference: string
    prisonerId: string
    visitorId: number
    sendNotification: boolean
  }): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    await orchestrationApiClient.linkBookerVisitor({ reference, prisonerId, visitorId, sendNotification })
  }

  async unlinkBookerVisitor({
    username,
    reference,
    prisonerId,
    visitorId,
  }: {
    username: string
    reference: string
    prisonerId: string
    visitorId: number
  }): Promise<void> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    await orchestrationApiClient.unlinkBookerVisitor({ reference, prisonerId, visitorId })
  }
}
