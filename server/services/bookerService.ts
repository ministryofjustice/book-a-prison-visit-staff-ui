import { compareDesc } from 'date-fns'
import { OrchestrationApiClient } from '../data'
import {
  BookerDetailedInfoDto,
  BookerPrisonerVisitorRequestDto,
  BookerSearchResultsDto,
  PrisonVisitorRequestDto,
  PrisonVisitorRequestListEntryDto,
  RejectVisitorRequestDto,
  SocialContactsDto,
  VisitorInfoDto,
  VisitorRequestForReviewDto,
} from '../data/orchestrationApiTypes'

export default class BookerService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  // get bookers by email address with most recently created (the active one) first
  async getSortedBookersByEmail({ email }: { username: string; email: string }): Promise<BookerSearchResultsDto[]> {
    const unsortedBookers = await this.orchestrationApiClient.getBookersByEmail(email)
    const bookersByCreatedDesc = unsortedBookers.toSorted((a, b) =>
      compareDesc(new Date(a.createdTimestamp), new Date(b.createdTimestamp)),
    )

    return bookersByCreatedDesc
  }

  async getBookerDetails({ reference }: { username: string; reference: string }): Promise<BookerDetailedInfoDto> {
    return this.orchestrationApiClient.getBookerDetails(reference)
  }

  async getLinkedVisitors({
    bookerReference,
    prisonerId,
  }: {
    username: string
    bookerReference: string
    prisonerId: string
  }): Promise<VisitorInfoDto[]> {
    return this.orchestrationApiClient.getLinkedVisitors({ bookerReference, prisonerId })
  }

  async getNonLinkedSocialContacts({
    reference,
    prisonerId,
  }: {
    username: string
    reference: string
    prisonerId: string
  }): Promise<SocialContactsDto[]> {
    return this.orchestrationApiClient.getNonLinkedSocialContacts({ reference, prisonerId })
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
    await this.orchestrationApiClient.linkBookerVisitor({
      reference,
      prisonerId,
      visitorId,
      sendNotification,
      username,
    })
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
    await this.orchestrationApiClient.unlinkBookerVisitor({ reference, prisonerId, visitorId, username })
  }

  async getBookerVisitorRequestsByPrisoner({
    reference,
  }: {
    username: string
    reference: string
  }): Promise<Record<string, BookerPrisonerVisitorRequestDto[]>> {
    const requests = await this.orchestrationApiClient.getBookerVisitorRequests(reference)
    return { ...Object.groupBy(requests, request => request.prisonerId) }
  }

  async getVisitorRequests({
    prisonId,
  }: {
    username: string
    prisonId: string
  }): Promise<PrisonVisitorRequestListEntryDto[]> {
    return this.orchestrationApiClient.getVisitorRequests(prisonId)
  }

  async getVisitorRequestCount({ prisonId }: { username?: string; prisonId: string }): Promise<number> {
    return this.orchestrationApiClient.getVisitorRequestCount(prisonId)
  }

  async getVisitorRequestForReview({
    requestReference,
  }: {
    username: string
    requestReference: string
  }): Promise<VisitorRequestForReviewDto> {
    return this.orchestrationApiClient.getVisitorRequestForReview(requestReference)
  }

  async approveVisitorRequest({
    username,
    requestReference,
    visitorId,
  }: {
    username: string
    requestReference: string
    visitorId: number
  }): Promise<PrisonVisitorRequestDto> {
    return this.orchestrationApiClient.approveVisitorRequest({ requestReference, visitorId, username })
  }

  async rejectVisitorRequest({
    username,
    requestReference,
    rejectionReason,
  }: {
    username: string
    requestReference: string
    rejectionReason: RejectVisitorRequestDto['rejectionReason']
  }): Promise<PrisonVisitorRequestDto> {
    return this.orchestrationApiClient.rejectVisitorRequest({ requestReference, rejectionReason, username })
  }
}
