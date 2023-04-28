import { format, parseISO, isAfter, isBefore, parse } from 'date-fns'
import { NotFound } from 'http-errors'
import logger from '../../logger'
import {
  VisitInformation,
  ExtendedVisitInformation,
  VisitSlot,
  VisitSlotList,
  VisitSlotsForDay,
  VisitSessionData,
  VisitsPageSlot,
} from '../@types/bapv'
import {
  VisitSession,
  Visit,
  SupportType,
  OutcomeDto,
  SessionCapacity,
  SessionSchedule,
} from '../data/orchestrationApiTypes'
import { ScheduledEvent } from '../data/whereaboutsApiTypes'
import { prisonerDateTimePretty, prisonerTimePretty } from '../utils/utils'
import buildVisitorListItem from '../utils/visitorUtils'
import { getVisitSlotsFromBookedVisits, getPrisonerEvents } from '../utils/visitsUtils'
import {
  HmppsAuthClient,
  PrisonerContactRegistryApiClient,
  RestClientBuilder,
  VisitSchedulerApiClient,
  WhereaboutsApiClient,
} from '../data'

export default class VisitSessionsService {
  private morningCutoff = 12

  constructor(
    private readonly prisonerContactRegistryApiClientFactory: RestClientBuilder<PrisonerContactRegistryApiClient>,
    private readonly visitSchedulerApiClientFactory: RestClientBuilder<VisitSchedulerApiClient>,
    private readonly whereaboutsApiClientFactory: RestClientBuilder<WhereaboutsApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getAvailableSupportOptions(username: string): Promise<SupportType[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)
    return visitSchedulerApiClient.getAvailableSupportOptions()
  }

  async getVisitSessions({
    username,
    offenderNo,
    prisonId,
    visitRestriction,
  }: {
    username: string
    offenderNo: string
    prisonId: string
    visitRestriction: VisitSessionData['visitRestriction']
  }): Promise<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)
    const whereaboutsApiClient = this.whereaboutsApiClientFactory(token)
    const visitSessions = await visitSchedulerApiClient.getVisitSessions(offenderNo, prisonId)

    let earliestStartTime: Date = new Date()
    let latestEndTime: Date = new Date()

    const availableSessions = visitSessions.reduce(
      (slotList: VisitSlotList, visitSession: VisitSession, slotIdCounter: number) => {
        const parsedStartTimestamp = parseISO(visitSession.startTimestamp)
        const parsedEndTimestamp = parseISO(visitSession.endTimestamp)

        // Month grouping for slots, e.g. 'February 2022'
        const slotMonth = format(parsedStartTimestamp, 'MMMM yyyy')
        if (!slotList[slotMonth]) slotList[slotMonth] = [] // eslint-disable-line no-param-reassign

        // Slots for the day, e.g. 'Monday 14 February'
        const slotDate = format(parsedStartTimestamp, 'EEEE d MMMM')
        let slotsForDay: VisitSlotsForDay = slotList[slotMonth].find(slot => slot.date === slotDate)
        if (slotsForDay === undefined) {
          slotsForDay = {
            date: slotDate,
            slots: { morning: [], afternoon: [] },
            prisonerEvents: { morning: [], afternoon: [] },
          }
          slotList[slotMonth].push(slotsForDay)
        }

        const newSlot: VisitSlot = {
          id: (slotIdCounter + 1).toString(),
          sessionTemplateReference: visitSession.sessionTemplateReference,
          prisonId: visitSession.prisonId,
          startTimestamp: visitSession.startTimestamp,
          endTimestamp: visitSession.endTimestamp,
          availableTables:
            visitRestriction === 'OPEN'
              ? visitSession.openVisitCapacity - visitSession.openVisitBookedCount
              : visitSession.closedVisitCapacity - visitSession.closedVisitBookedCount,
          capacity: visitRestriction === 'OPEN' ? visitSession.openVisitCapacity : visitSession.closedVisitCapacity,
          visitRoom: visitSession.visitRoom,
          sessionConflicts: visitSession.sessionConflicts,
          visitRestriction,
        }

        // Maybe this needs doing below, twice since technically this may not be pushed
        if (isAfter(parsedEndTimestamp, latestEndTime)) {
          latestEndTime = parsedEndTimestamp
        }
        if (isBefore(parsedStartTimestamp, earliestStartTime)) {
          earliestStartTime = parsedStartTimestamp
        }

        // slotHasCapacity == true when the slot has capacity for this selected restriction
        const slotHasCapacity =
          visitRestriction === 'OPEN' ? visitSession.openVisitCapacity > 0 : visitSession.closedVisitCapacity > 0
        if (slotHasCapacity) {
          // Add new Slot to morning / afternoon grouping
          if (parsedStartTimestamp.getHours() < this.morningCutoff) {
            slotsForDay.slots.morning.push(newSlot)
          } else {
            slotsForDay.slots.afternoon.push(newSlot)
          }
        }
        return slotList
      },
      {},
    )

    let prisonerEvents: ScheduledEvent[] = []
    let whereaboutsAvailable = true
    try {
      prisonerEvents = await whereaboutsApiClient.getEvents(
        offenderNo,
        format(earliestStartTime, 'yyyy-MM-dd'),
        format(latestEndTime, 'yyyy-MM-dd'),
      )
    } catch (error) {
      whereaboutsAvailable = false
    }

    Object.keys(availableSessions).forEach(month => {
      /* eslint no-param-reassign: ["error", { "props": false }] */
      const year = month.split(' ')[1]
      const allVisitSlots: VisitSlotsForDay[] = []

      availableSessions[month].forEach((visitSlotsforDay: VisitSlotsForDay) => {
        const hasMorningSlots = visitSlotsforDay.slots.morning.length > 0
        const hasAfternoonSlots = visitSlotsforDay.slots.afternoon.length > 0

        if (hasMorningSlots) {
          const timeStart = parse(`${visitSlotsforDay.date} ${year} 00:00`, 'EEEE d MMMM yyyy H:mm', new Date())
          const timeEnd = parse(`${visitSlotsforDay.date} ${year} 12:00`, 'EEEE d MMMM yyyy H:mm', new Date())
          visitSlotsforDay.prisonerEvents.morning = getPrisonerEvents(prisonerEvents, timeStart, timeEnd)
        }
        if (hasAfternoonSlots) {
          const timeStart = parse(`${visitSlotsforDay.date} ${year} 11:59`, 'EEEE d MMMM yyyy H:mm', new Date())
          const timeEnd = parse(`${visitSlotsforDay.date} ${year} 23:59`, 'EEEE d MMMM yyyy H:mm', new Date())
          visitSlotsforDay.prisonerEvents.afternoon = getPrisonerEvents(prisonerEvents, timeStart, timeEnd)
        }

        if (hasMorningSlots || hasAfternoonSlots) {
          allVisitSlots.push(visitSlotsforDay)
        }
      })

      if (allVisitSlots.length > 0) {
        availableSessions[month] = allVisitSlots
      } else {
        delete availableSessions[month]
      }
    })

    return { slotsList: availableSessions, whereaboutsAvailable }
  }

  async getSessionSchedule({
    username,
    prisonId,
    date,
  }: {
    username: string
    prisonId: string
    date: string
  }): Promise<SessionSchedule[]> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)

    return visitSchedulerApiClient.getSessionSchedule(prisonId, date)
  }

  async getVisitSessionCapacity(
    username: string,
    prisonId: string,
    sessionDate: string,
    sessionStartTime: string,
    sessionEndTime: string,
  ): Promise<SessionCapacity> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)
    return visitSchedulerApiClient.getVisitSessionCapacity(prisonId, sessionDate, sessionStartTime, sessionEndTime)
  }

  async reserveVisit({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)

    const reservation = await visitSchedulerApiClient.reserveVisit(visitSessionData)
    return reservation
  }

  async changeReservedVisit({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)

    const visit = await visitSchedulerApiClient.changeReservedVisit(visitSessionData)
    return visit
  }

  async bookVisit({
    username,
    applicationReference,
  }: {
    username: string
    applicationReference: string
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)

    const visit = await visitSchedulerApiClient.bookVisit(applicationReference)
    return visit
  }

  async changeBookedVisit({
    username,
    visitSessionData,
  }: {
    username: string
    visitSessionData: VisitSessionData
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)

    const visit = await visitSchedulerApiClient.changeBookedVisit(visitSessionData)
    return visit
  }

  async cancelVisit({
    username,
    reference,
    outcome,
  }: {
    username: string
    reference: string
    outcome: OutcomeDto
  }): Promise<Visit> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)

    return visitSchedulerApiClient.cancelVisit(reference, outcome)
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
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)

    logger.info(`Get visit ${reference}`)
    const visit = await visitSchedulerApiClient.getVisit(reference)

    if (visit.prisonId !== prisonId) {
      logger.info(`Visit ${reference} is not in prison '${prisonId}'`)
      throw new NotFound()
    }

    return this.buildVisitInformation(visit)
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
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)

    logger.info(`Get upcoming visits for ${offenderNo}`)
    const { content: visits } = await visitSchedulerApiClient.getUpcomingVisits(offenderNo, visitStatus)

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
    const visitSchedulerApiClient = this.visitSchedulerApiClientFactory(token)
    const prisonerContactRegistryApiClient = this.prisonerContactRegistryApiClientFactory(token)

    logger.info(`Get visits for ${dateString}`)
    const { content: visits } = await visitSchedulerApiClient.getVisitsByDate(dateString, prisonId)

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
