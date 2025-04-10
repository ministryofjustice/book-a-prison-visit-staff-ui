import { NotFound } from 'http-errors'
import { VisitInformation, VisitSessionData } from '../@types/bapv'
import {
  Alert,
  ApplicationDto,
  ApplicationMethodType,
  CancelVisitOrchestrationDto,
  EventAudit,
  Visit,
  VisitBookingDetailsDto,
  VisitPreview,
} from '../data/orchestrationApiTypes'
import { HmppsAuthClient, OrchestrationApiClient, RestClientBuilder } from '../data'
import logger from '../../logger'
import { prisonerDateTimePretty, prisonerTimePretty, sortItemsByDateAsc } from '../utils/utils'
import eventAuditTypes from '../constants/eventAuditTypes'
import { requestMethodDescriptions } from '../constants/requestMethods'
import { notificationTypes } from '../constants/notificationEvents'
import { OffenderRestriction } from '../data/prisonApiTypes'

export type MojTimelineItem = {
  label: { text: string }
  text: string
  datetime: {
    timestamp: string
    type: 'datetime'
  }
  // byline undefined is necessary when no 'user' is present for "by User X"
  byline: { text: string }
  attributes: { 'data-test': string }
}

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
  }: {
    username: string
    applicationReference: string
    applicationMethod: ApplicationMethodType
    allowOverBooking: boolean
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visit = await orchestrationApiClient.bookVisit(
      applicationReference,
      applicationMethod,
      allowOverBooking,
      username,
    )
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
  }): Promise<VisitBookingDetailsDto> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const visitDetails = await orchestrationApiClient.getVisitDetailed(reference)
    sortItemsByDateAsc<Alert, 'dateExpires'>(visitDetails.prisoner.prisonerAlerts, 'dateExpires')
    sortItemsByDateAsc<OffenderRestriction, 'expiryDate'>(visitDetails.prisoner.prisonerRestrictions, 'expiryDate')

    return visitDetails
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

  getVisitEventsTimeline({
    events,
    visitStatus,
    visitNotes,
  }: {
    events: EventAudit[]
    visitStatus: VisitBookingDetailsDto['visitStatus']
    visitNotes: VisitBookingDetailsDto['visitNotes']
  }): MojTimelineItem[] {
    const filteredEvents = events.filter(event => Object.keys(eventAuditTypes).includes(event.type)).reverse()

    let cancelledVisitReason = ''
    if (visitStatus === 'CANCELLED') {
      visitNotes.forEach(note => {
        if (note.type === 'VISIT_OUTCOMES') {
          cancelledVisitReason = note.text
        }
      })
    }

    return filteredEvents.map((event, index) => {
      const label = eventAuditTypes[event.type]

      let descriptionContent = ''
      const { applicationMethodType, userType, type } = event

      if (type === 'BOOKED_VISIT' || type === 'UPDATED_VISIT' || type === 'MIGRATED_VISIT') {
        if (userType === 'PUBLIC' && applicationMethodType === 'WEBSITE') {
          descriptionContent = 'Method: GOV.UK booking'
        } else {
          descriptionContent = requestMethodDescriptions[event.applicationMethodType]
        }
      } else if (type === 'CANCELLED_VISIT') {
        if (cancelledVisitReason !== '') {
          descriptionContent = `Reason: ${cancelledVisitReason}`
        } else if (applicationMethodType !== 'NOT_KNOWN' && applicationMethodType !== 'NOT_APPLICABLE') {
          if (userType === 'PUBLIC' && applicationMethodType === 'WEBSITE') {
            descriptionContent = 'Method: GOV.UK cancellation'
          } else {
            descriptionContent = requestMethodDescriptions[applicationMethodType]
          }
        }
      } else if (type === 'IGNORE_VISIT_NOTIFICATIONS_EVENT') {
        descriptionContent = `Reason: ${event.text}`
      } else if (
        type === 'PRISONER_RELEASED_EVENT' ||
        type === 'PRISON_VISITS_BLOCKED_FOR_DATE' ||
        type === 'PRISONER_RECEIVED_EVENT'
      ) {
        // only added to assist type for next line
        descriptionContent = `Reason: ${notificationTypes[type]}`
      }

      const user = event.actionedByFullName

      let byline = null
      if (user && user !== 'NOT_KNOWN') {
        if (user === 'NOT_KNOWN_NOMIS') {
          byline = { text: 'NOMIS' }
        } else {
          byline = { text: user }
        }
      }

      return {
        label: { text: label }, //
        text: descriptionContent,
        datetime: { timestamp: event.createTimestamp, type: 'datetime' }, //
        byline, //
        attributes: { 'data-test': `timeline-entry-${index}` },
      }
    })
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
}
