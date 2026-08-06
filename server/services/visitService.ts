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
  VisitPassDto,
  VisitPreview,
} from '../data/orchestrationApiTypes'
import { OrchestrationApiClient } from '../data'
import logger from '../../logger'
import { formatStartToEndTime, prisonerDateTimePretty } from '../utils/utils'

export default class VisitService {
  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

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
    const visitorDetails = this.buildVisitorDetails(visitors)

    const visit = await this.orchestrationApiClient.bookVisit({
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
    const visitorDetails = this.buildVisitorDetails(visitors)

    const visit = await this.orchestrationApiClient.updateVisit({
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
    return this.orchestrationApiClient.cancelVisit(reference, cancelVisitDto, username)
  }

  async changeVisitApplication({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<ApplicationDto> {
    return this.orchestrationApiClient.changeVisitApplication(visitSessionData, username)
  }

  async createVisitApplicationFromVisit({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<ApplicationDto> {
    return this.orchestrationApiClient.createVisitApplicationFromVisit(visitSessionData, username)
  }

  async createVisitApplication({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<ApplicationDto> {
    return this.orchestrationApiClient.createVisitApplication(visitSessionData, username)
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
    logger.info(`Get visit ${reference}`)
    const visit = await this.orchestrationApiClient.getVisit(reference, username)

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
    return this.orchestrationApiClient.getVisitDetailed(reference, username)
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
    return this.orchestrationApiClient.getVisitsBySessionTemplate(
      prisonId,
      reference,
      sessionDate,
      ['OPEN', 'CLOSED'],
      username,
    )
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
    return this.orchestrationApiClient.getVisitsBySessionTemplate(prisonId, undefined, sessionDate, undefined, username)
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
    return this.orchestrationApiClient.getBookedVisitCountByDate(prisonId, date, username)
  }

  async getVisitPasses({
    prisonId,
    date,
    username,
  }: {
    prisonId: string
    date: string
    username: string
  }): Promise<VisitPassDto[]> {
    return this.orchestrationApiClient.getVisitPasses({ prisonId, date, username })
  }

  async getVisitPass({
    prisonId,
    reference,
    username,
  }: {
    prisonId: string
    reference: string
    username: string
  }): Promise<VisitPassDto> {
    return this.orchestrationApiClient.getVisitPass({ prisonId, reference, username })
  }

  private buildVisitInformation(visit: Visit): VisitInformation {
    return {
      reference: visit.reference,
      prisonNumber: visit.prisonerId,
      prisonerName: '',
      mainContact: visit.visitContact?.name,
      visitDate: prisonerDateTimePretty(visit.startTimestamp),
      visitTime: formatStartToEndTime(visit.startTimestamp, visit.endTimestamp),
      visitStatus: visit.visitStatus,
      visitSubStatus: visit.visitSubStatus,
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
