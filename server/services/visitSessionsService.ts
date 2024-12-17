import { format, parseISO, isAfter, isBefore, parse } from 'date-fns'
import { VisitSlot, VisitSlotList, VisitSlotsForDay, VisitSessionData, PrisonerEvent } from '../@types/bapv'
import { VisitSession, SessionCapacity, SessionSchedule } from '../data/orchestrationApiTypes'
import { ScheduledEvent } from '../data/whereaboutsApiTypes'
import { HmppsAuthClient, RestClientBuilder, OrchestrationApiClient, WhereaboutsApiClient } from '../data'

export default class VisitSessionsService {
  private morningCutOff = 12

  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
    private readonly whereaboutsApiClientFactory: RestClientBuilder<WhereaboutsApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  async getSingleVisitSession({
    prisonCode,
    sessionDate,
    sessionTemplateReference,
    username,
  }: {
    prisonCode: string
    sessionDate: string
    sessionTemplateReference: string
    username: string
  }): Promise<VisitSession> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getSingleVisitSession(prisonCode, sessionDate, sessionTemplateReference)
  }

  async getVisitSessions({
    offenderNo,
    prisonId,
    visitRestriction,
    username,
    minNumberOfDays,
  }: {
    username: string
    offenderNo: string
    prisonId: string
    visitRestriction: VisitSessionData['visitRestriction']
    minNumberOfDays: string
  }): Promise<{ slotsList: VisitSlotList; whereaboutsAvailable: boolean }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)
    const whereaboutsApiClient = this.whereaboutsApiClientFactory(token)
    const visitSessions = await orchestrationApiClient.getVisitSessions(offenderNo, prisonId, username, minNumberOfDays)

    let earliestStartTime: Date = new Date()
    let latestEndTime: Date = new Date()

    const availableSessions = visitSessions.reduce(
      (slotList: VisitSlotList, visitSession: VisitSession, slotIdCounter: number) => {
        const parsedStartTimestamp = parseISO(visitSession.startTimestamp)
        const parsedEndTimestamp = parseISO(visitSession.endTimestamp)

        // Month grouping for slots, e.g. 'February 2022'
        const slotMonth = format(parsedStartTimestamp, 'MMMM yyyy')
        if (!slotList[slotMonth]) slotList[slotMonth] = []

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
          if (parsedStartTimestamp.getHours() < this.morningCutOff) {
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
    } catch {
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
          visitSlotsforDay.prisonerEvents.morning = this.getPrisonerEvents(prisonerEvents, timeStart, timeEnd)
        }
        if (hasAfternoonSlots) {
          const timeStart = parse(`${visitSlotsforDay.date} ${year} 11:59`, 'EEEE d MMMM yyyy H:mm', new Date())
          const timeEnd = parse(`${visitSlotsforDay.date} ${year} 23:59`, 'EEEE d MMMM yyyy H:mm', new Date())
          visitSlotsforDay.prisonerEvents.afternoon = this.getPrisonerEvents(prisonerEvents, timeStart, timeEnd)
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
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getSessionSchedule(prisonId, date)
  }

  async getVisitSessionCapacity(
    username: string,
    prisonId: string,
    sessionDate: string,
    sessionStartTime: string,
    sessionEndTime: string,
  ): Promise<SessionCapacity> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    return orchestrationApiClient.getVisitSessionCapacity(prisonId, sessionDate, sessionStartTime, sessionEndTime)
  }

  private getPrisonerEvents(events: ScheduledEvent[], start: Date, end: Date): PrisonerEvent[] {
    return events
      .filter(event => {
        const eventStart = parseISO(event.startTime)

        return isAfter(eventStart, start) && isBefore(eventStart, end)
      })
      .map(event => {
        return {
          startTimestamp: event.startTime,
          endTimestamp: event.endTime,
          description: event.eventSourceDesc,
        }
      })
  }
}
