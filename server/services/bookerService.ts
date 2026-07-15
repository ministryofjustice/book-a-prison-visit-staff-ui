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
  async getSortedBookersByEmail({
    username,
    email,
  }: {
    username: string
    email: string
  }): Promise<BookerSearchResultsDto[]> {
    const orchestrationApiClient = this.orchestrationApiClient

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
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.getBookerDetails(reference)
  }

  async getLinkedVisitors({
    username,
    bookerReference,
    prisonerId,
  }: {
    username: string
    bookerReference: string
    prisonerId: string
  }): Promise<VisitorInfoDto[]> {
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.getLinkedVisitors({ bookerReference, prisonerId })
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
    const orchestrationApiClient = this.orchestrationApiClient

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
    const orchestrationApiClient = this.orchestrationApiClient

    await orchestrationApiClient.linkBookerVisitor({ reference, prisonerId, visitorId, sendNotification, username })
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
    const orchestrationApiClient = this.orchestrationApiClient

    await orchestrationApiClient.unlinkBookerVisitor({ reference, prisonerId, visitorId, username })
  }

  async getBookerVisitorRequestsByPrisoner({
    username,
    reference,
  }: {
    username: string
    reference: string
  }): Promise<Record<string, BookerPrisonerVisitorRequestDto[]>> {
    const orchestrationApiClient = this.orchestrationApiClient

    const requests = await orchestrationApiClient.getBookerVisitorRequests(reference)
    return { ...Object.groupBy(requests, request => request.prisonerId) }
  }

  async getVisitorRequests({
    username,
    prisonId,
  }: {
    username: string
    prisonId: string
  }): Promise<PrisonVisitorRequestListEntryDto[]> {
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.getVisitorRequests(prisonId)
  }

  async getVisitorRequestCount({ username, prisonId }: { username: string; prisonId: string }): Promise<number> {
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.getVisitorRequestCount(prisonId)
  }

  async getVisitorRequestForReview({
    username,
    requestReference,
  }: {
    username: string
    requestReference: string
  }): Promise<VisitorRequestForReviewDto> {
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.getVisitorRequestForReview(requestReference)
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
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.approveVisitorRequest({ requestReference, visitorId, username })
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
    const orchestrationApiClient = this.orchestrationApiClient

    return orchestrationApiClient.rejectVisitorRequest({ requestReference, rejectionReason, username })
  }
}
