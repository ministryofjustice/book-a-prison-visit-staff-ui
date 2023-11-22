import { NotFound } from 'http-errors'
import {
  ExtendedVisitInformation,
  VisitInformation,
  VisitSessionData,
  VisitorListItem,
  VisitsPageSlot,
} from '../@types/bapv'
import {
  ApplicationMethodType,
  CancelVisitOrchestrationDto,
  NotificationCount,
  Visit,
  VisitHistoryDetails,
} from '../data/orchestrationApiTypes'
import { buildVisitorListItem } from '../utils/visitorUtils'
import { getSupportTypeDescriptions } from '../routes/visitorUtils'
import { HmppsAuthClient, OrchestrationApiClient, PrisonerContactRegistryApiClient, RestClientBuilder } from '../data'
import AdditionalSupportService from './additionalSupportService'
import logger from '../../logger'
import { prisonerDateTimePretty, prisonerTimePretty } from '../utils/utils'
import { getVisitSlotsFromBookedVisits } from '../utils/visitsUtils'

export default class VisitService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly prisonerContactRegistryApiClientFactory: RestClientBuilder<PrisonerContactRegistryApiClient>,
    private readonly additionalSupportService: AdditionalSupportService,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async bookVisit({
    username,
    applicationReference,
    applicationMethod,
  }: {
    username: string
    applicationReference: string
    applicationMethod: ApplicationMethodType
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visit = await orchestrationApiClient.bookVisit(applicationReference, applicationMethod)
    return visit
  }

  async cancelVisit({
    username,
    reference,
    cancelVisitDto,
  }: {
    username: string
    reference: string
    cancelVisitDto: CancelVisitOrchestrationDto
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.cancelVisit(reference, cancelVisitDto)
  }

  async changeBookedVisit({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visit = await orchestrationApiClient.changeBookedVisit(visitSessionData)
    return visit
  }

  async changeReservedVisit({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visit = await orchestrationApiClient.changeReservedVisit(visitSessionData)
    return visit
  }

  async reserveVisit({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const reservation = await orchestrationApiClient.reserveVisit(visitSessionData)
    return reservation
  }

  async getVisit({
    username,
    reference,
    prisonId,
  }: {
    username: string
    reference: string
    prisonId: string
  }): Promise<VisitInformation> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    logger.info(`Get visit ${reference}`)
    const visit = await orchestrationApiClient.getVisit(reference)

    if (visit.prisonId !== prisonId) {
      logger.info(`Visit ${reference} is not in prison '${prisonId}'`)
      throw new NotFound()
    }

    return this.buildVisitInformation(visit)
  }

  async getFullVisitDetails({
    username,
    reference,
  }: {
    username: string
    reference: string
  }): Promise<{ visitHistoryDetails: VisitHistoryDetails; visitors: VisitorListItem[]; additionalSupport: string[] }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientFactory(token)

    const visitHistoryDetails = await orchestrationApiClient.getVisitHistory(reference)
    const { visit } = visitHistoryDetails
    const contacts = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(visit.prisonerId)
    const visitorIds = visit.visitors.map(visitor => visitor.nomisPersonId)

    const visitors = contacts
      .filter(contact => visitorIds.includes(contact.personId))
      .map(contact => buildVisitorListItem(contact))

    const additionalSupport = getSupportTypeDescriptions(
      await this.additionalSupportService.getAvailableSupportOptions(username),
      visit.visitorSupport,
    )

    return { visitHistoryDetails, visitors, additionalSupport }
  }

  async getUpcomingVisits({
    username,
    offenderNo,
    visitStatus,
  }: {
    username: string
    offenderNo: string
    visitStatus: Visit['visitStatus'][]
  }): Promise<VisitInformation[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    logger.info(`Get upcoming visits for ${offenderNo}`)
    const { content: visits } = await orchestrationApiClient.getUpcomingVisits(offenderNo, visitStatus)

    return visits.map(visit => this.buildVisitInformation(visit))
  }

  async getVisitsByDate({
    username,
    dateString,
    prisonId,
  }: {
    username: string
    dateString: string
    prisonId: string
  }): Promise<{
    extendedVisitsInfo: ExtendedVisitInformation[]
    slots: {
      openSlots: VisitsPageSlot[]
      closedSlots: VisitsPageSlot[]
      unknownSlots: VisitsPageSlot[]
      firstSlotTime: string
    }
  }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientFactory(token)

    logger.info(`Get visits for ${dateString}`)
    const { content: visits } = await orchestrationApiClient.getVisitsByDate(dateString, prisonId)

    const extendedVisitsInfo: ExtendedVisitInformation[] = await Promise.all(
      visits.map(visit => {
        return this.buildExtendedVisitInformation(visit, prisonerContactRegistryApiClient)
      }),
    )

    return {
      extendedVisitsInfo,
      slots: getVisitSlotsFromBookedVisits(extendedVisitsInfo),
    }
  }

  async getNotificationCount(username: string, prisonId: string): Promise<NotificationCount> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getNotificationCount(prisonId)
  }

  private buildVisitInformation(visit: Visit): VisitInformation {
    const visitTime = `${prisonerTimePretty(visit.startTimestamp)} to ${prisonerTimePretty(visit.endTimestamp)}`

    return {
      reference: visit.reference,
      prisonNumber: visit.prisonerId,
      prisonerName: '',
      mainContact: visit.visitContact?.name,
      visitDate: prisonerDateTimePretty(visit.startTimestamp),
      visitTime,
      visitStatus: visit.visitStatus,
    }
  }

  private async buildExtendedVisitInformation(
    visit: Visit,
    prisonerContactRegistryApiClient: PrisonerContactRegistryApiClient,
  ): Promise<ExtendedVisitInformation> {
    const visitTime = `${prisonerTimePretty(visit.startTimestamp)} to ${prisonerTimePretty(visit.endTimestamp)}`
    const contacts = await prisonerContactRegistryApiClient.getPrisonerSocialContacts(visit.prisonerId)
    const visitorIds = visit.visitors.map(visitor => visitor.nomisPersonId)

    const visitors = contacts
      .filter(contact => visitorIds.includes(contact.personId))
      .map(contact => buildVisitorListItem(contact))

    return {
      reference: visit.reference,
      prisonNumber: visit.prisonerId,
      prisonerName: '',
      mainContact: visit.visitContact?.name,
      startTimestamp: visit.startTimestamp,
      endTimestamp: visit.endTimestamp,
      visitDate: prisonerDateTimePretty(visit.startTimestamp),
      visitTime,
      visitStatus: visit.visitStatus,
      visitRestriction: visit.visitRestriction,
      visitors,
    }
  }
}
