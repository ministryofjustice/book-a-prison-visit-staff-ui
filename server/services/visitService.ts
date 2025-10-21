import { NotFound } from 'http-errors'
import { intervalToDuration, isValid, parseISO } from 'date-fns'
import { VisitInformation, VisitorListItem, VisitSessionData } from '../@types/bapv'
import {
  ApplicationDto,
  ApplicationMethodType,
  BookingRequestVisitorDetailsDto,
  CancelVisitOrchestrationDto,
  Visit,
  VisitBookingDetails,
  VisitPreview,
} from '../data/orchestrationApiTypes'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import logger from '../../logger'
import { prisonerDateTimePretty, prisonerTimePretty } from '../utils/utils'

export default class VisitService {
  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async bookVisit({
    username,
    applicationReference,
    applicationMethod,
    allowOverBooking,
    visitors,
  }: {
    username: string
    applicationReference: string
    applicationMethod: ApplicationMethodType
    allowOverBooking: boolean
    visitors: VisitorListItem[]
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visitorDetails = this.buildVisitorDetails(visitors)

    const visit = await orchestrationApiClient.bookVisit({
      applicationReference,
      applicationMethod,
      allowOverBooking,
      visitorDetails,
      username,
    })
    return visit
  }

  async updateVisit({
    username,
    applicationReference,
    applicationMethod,
    allowOverBooking,
    visitors,
  }: {
    username: string
    applicationReference: string
    applicationMethod: ApplicationMethodType
    allowOverBooking: boolean
    visitors: VisitorListItem[]
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visitorDetails = this.buildVisitorDetails(visitors)

    const visit = await orchestrationApiClient.updateVisit({
      applicationReference,
      applicationMethod,
      allowOverBooking,
      visitorDetails,
      username,
    })
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

  async changeVisitApplication({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<ApplicationDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.changeVisitApplication(visitSessionData)
  }

  async createVisitApplicationFromVisit({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<ApplicationDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.createVisitApplicationFromVisit(visitSessionData, username)
  }

  async createVisitApplication({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<ApplicationDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.createVisitApplication(visitSessionData, username)
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

  async getVisitDetailed({
    username,
    reference,
  }: {
    username: string
    reference: string
  }): Promise<VisitBookingDetails> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitDetailed(reference)
  }

  async getVisitsBySessionTemplate({
    username,
    prisonId,
    reference,
    sessionDate,
  }: {
    username: string
    prisonId: string
    reference: string
    sessionDate: string
  }): Promise<VisitPreview[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitsBySessionTemplate(prisonId, reference, sessionDate, ['OPEN', 'CLOSED'])
  }

  async getVisitsWithoutSessionTemplate({
    username,
    prisonId,
    sessionDate,
  }: {
    username: string
    prisonId: string
    sessionDate: string
  }): Promise<VisitPreview[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitsBySessionTemplate(prisonId, undefined, sessionDate, undefined)
  }

  async getBookedVisitCountByDate({
    username,
    prisonId,
    date,
  }: {
    username: string
    prisonId: string
    date: string
  }): Promise<number> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getBookedVisitCountByDate(prisonId, date)
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

  private buildVisitorDetails(visitors: VisitorListItem[]): BookingRequestVisitorDetailsDto[] {
    const now = new Date()
    return visitors.map(visitor => {
      const { personId: visitorId } = visitor

      let visitorAge: number
      try {
        const visitorDoB = parseISO(visitor.dateOfBirth)

        if (isValid(visitorDoB)) {
          const ageAsDuration = intervalToDuration({ start: visitorDoB, end: now })
          visitorAge = ageAsDuration?.years ?? 0
        } else {
          visitorAge = null
        }
      } catch {
        visitorAge = null
      }

      return { visitorId, visitorAge }
    })
  }
}
