import { format, parseISO, isAfter, isBefore, parse } from 'date-fns'
import { HmppsAuthClient, RestClientBuilder, OrchestrationApiClient, WhereaboutsApiClient } from '../data'
import { VisitSlot, VisitSlotList, VisitSlotsForDay, PrisonerEvent, GOVUKTag, VisitSessionData } from '../@types/bapv'
import {
  VisitSession,
  SessionCapacity,
  SessionSchedule,
  SessionsAndScheduleDto,
  VisitSessionV2Dto,
  PrisonerScheduledEventDto,
} from '../data/orchestrationApiTypes'
import { ScheduledEvent } from '../data/whereaboutsApiTypes'

// Single date on the calendar grid
type CalendarGridDate = {
  date: string // e.g. 2025-09-01
  sessionCount: number
  colour?: 'orange' | 'red' // defaults to grey (no sessions) or blue (sessions)
  selected: boolean // renders with filled circle background
  outline: boolean // renders with circular outline
}

export type CalendarMonth = {
  monthLabel: string // e.g. 'March'
  days: CalendarGridDate[]
}

type CalendarDaySection = 'morning' | 'afternoon'

// Single visit session entry
export type CalendarVisitSession = {
  date: string // yyyy-mm-dd
  sessionTemplateReference: string
  daySection: CalendarDaySection
  startTime: string // e.g. "10:00"
  endTime: string
  visitRoom: string
  availableTables: number
  capacity: number
  disabled: boolean // is radio input disabled
  tag?: GOVUKTag
}

// Single prisoner event entry
type CalendarScheduledEvent = {
  daySection: CalendarDaySection
  startTime: string // e.g. "10:00"
  endTime: string
  description: string
}

export type CalendarFullDay = {
  date: string // yyyy-mm-dd
  visitSessions: CalendarVisitSession[]
  scheduledEvents: CalendarScheduledEvent[]
}

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
    minNumberOfDays: number
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

  // TODO remove
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

  async getVisitSessionsAndScheduleCalendar({
    username,
    prisonId,
    prisonerId,
    minNumberOfDays,
    visitRestriction,
    selectedVisitSession,
    originalVisitSession,
  }: {
    username: string
    prisonId: string
    prisonerId: string
    minNumberOfDays: number
    visitRestriction: VisitSessionData['visitRestriction']
    selectedVisitSession: VisitSessionData['selectedVisitSession'] | undefined
    originalVisitSession: VisitSessionData['originalVisitSession'] | undefined
  }): Promise<{ calendar: CalendarMonth[]; calendarFullDays: CalendarFullDay[]; scheduledEventsAvailable: boolean }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const { scheduledEventsAvailable, sessionsAndSchedule } = await orchestrationApiClient.getVisitSessionsAndSchedule({
      prisonId,
      prisonerId,
      minNumberOfDays,
      username,
    })

    const calendar = this.buildCalendarMonths(
      sessionsAndSchedule,
      selectedVisitSession,
      originalVisitSession,
      visitRestriction,
    )

    const calendarFullDays = this.buildCalendarFullDays(
      sessionsAndSchedule,
      visitRestriction,
      selectedVisitSession,
      originalVisitSession,
    )

    return {
      calendar,
      calendarFullDays,
      scheduledEventsAvailable,
    }
  }

  private buildCalendarMonths(
    sessionsAndSchedule: SessionsAndScheduleDto[],
    selectedVisitSession: VisitSessionData['selectedVisitSession'] | undefined,
    originalVisitSession: VisitSessionData['originalVisitSession'] | undefined,
    visitRestriction: VisitSessionData['visitRestriction'],
  ): CalendarMonth[] {
    let selectedDateFound = false
    const calendarMonths = sessionsAndSchedule.reduce((months, day) => {
      const { date, visitSessions } = day

      const monthLabel = format(day.date, 'MMMM') // e.g. 'September'
      if (months.at(-1)?.monthLabel !== monthLabel) {
        months.push({ monthLabel, days: [] })
      }

      const sessionCount =
        visitRestriction === 'OPEN'
          ? visitSessions.filter(session => session.openVisitCapacity > 0).length
          : visitSessions.filter(session => session.closedVisitCapacity > 0).length

      const calendarGridDate: CalendarGridDate = {
        date,
        sessionCount,
        selected: false,
        outline: selectedVisitSession?.date === date || originalVisitSession?.date === date,
      }

      if (!selectedDateFound) {
        const matchesSelectedVisitSession =
          selectedVisitSession &&
          selectedVisitSession.date === date &&
          visitSessions.some(
            session => session.sessionTemplateReference === selectedVisitSession?.sessionTemplateReference,
          )
        const matchesOriginalVisitSession =
          originalVisitSession &&
          originalVisitSession.date === date &&
          visitSessions.some(
            session => session.sessionTemplateReference === originalVisitSession?.sessionTemplateReference,
          )

        if (matchesSelectedVisitSession || matchesOriginalVisitSession) {
          calendarGridDate.selected = true
          selectedDateFound = true
        }
      }

      months.at(-1).days.push(calendarGridDate)

      return months
    }, [] as CalendarMonth[])

    if (!selectedDateFound) {
      for (const month of calendarMonths) {
        const firstDayWithVisitSessions = month.days.find(day => day.sessionCount > 0)
        if (firstDayWithVisitSessions) {
          firstDayWithVisitSessions.selected = true
          break
        }
      }
    }

    return calendarMonths
  }

  private buildCalendarFullDays(
    sessionsAndSchedule: SessionsAndScheduleDto[],
    visitRestriction: VisitSessionData['visitRestriction'],
    selectedVisitSession: VisitSessionData['selectedVisitSession'] | undefined,
    originalVisitSession: VisitSessionData['originalVisitSession'] | undefined,
  ): CalendarFullDay[] {
    const daysWithVisitSessions = sessionsAndSchedule.filter(day => day.visitSessions.length > 0)

    const calendarFullDays: CalendarFullDay[] = daysWithVisitSessions.map(day => {
      return {
        date: day.date,
        visitSessions: day.visitSessions.map(visitSession =>
          this.buildVisitSession(day.date, visitSession, visitRestriction, selectedVisitSession, originalVisitSession),
        ),
        scheduledEvents: day.scheduledEvents.map(event => this.buildScheduledEvent(event)),
      }
    })

    return calendarFullDays
  }

  private buildVisitSession(
    date: string,
    visitSession: VisitSessionV2Dto,
    visitRestriction: VisitSessionData['visitRestriction'],
    selectedVisitSession: VisitSessionData['selectedVisitSession'] | undefined,
    originalVisitSession: VisitSessionData['originalVisitSession'] | undefined,
  ): CalendarVisitSession {
    const availableTables =
      visitRestriction === 'OPEN'
        ? visitSession.openVisitCapacity - visitSession.openVisitBookedCount
        : visitSession.closedVisitCapacity - visitSession.closedVisitBookedCount

    const capacity = visitRestriction === 'OPEN' ? visitSession.openVisitCapacity : visitSession.closedVisitCapacity

    const tag = this.getVisitSessionTag(date, visitSession, selectedVisitSession, originalVisitSession, availableTables)

    return {
      date,
      sessionTemplateReference: visitSession.sessionTemplateReference,
      daySection: this.isBeforeMorningCutOff(visitSession.startTime) ? 'morning' : 'afternoon',
      startTime: visitSession.startTime,
      endTime: visitSession.endTime,
      visitRoom: visitSession.visitRoom,
      availableTables,
      capacity,
      disabled: this.isVisitSessionDisabled(date, visitSession, originalVisitSession),
      ...(tag && { tag }),
    }
  }

  private isVisitSessionDisabled(
    date: string,
    visitSession: VisitSessionV2Dto,
    originalVisitSession: VisitSessionData['originalVisitSession'],
  ): boolean {
    // original visit session should be selectable (not disabled)
    if (
      originalVisitSession &&
      date === originalVisitSession.date &&
      visitSession.sessionTemplateReference === originalVisitSession.sessionTemplateReference
    ) {
      return false
    }

    // otherwise disabled if existing booking
    return visitSession.sessionConflicts.includes('DOUBLE_BOOKING_OR_RESERVATION')
  }

  private getVisitSessionTag(
    date: string,
    visitSession: VisitSessionV2Dto,
    selectedVisitSession: VisitSessionData['selectedVisitSession'] | undefined,
    originalVisitSession: VisitSessionData['originalVisitSession'] | undefined,
    availableTables: number,
  ): GOVUKTag | undefined {
    if (
      date === originalVisitSession?.date &&
      visitSession.sessionTemplateReference === originalVisitSession.sessionTemplateReference
    ) {
      return {
        text: 'Original booking',
        classes: 'govuk-tag--blue',
      }
    }

    if (
      date === selectedVisitSession?.date &&
      visitSession.sessionTemplateReference === selectedVisitSession.sessionTemplateReference
    ) {
      return {
        text: 'Reserved visit time',
        classes: 'govuk-tag--blue',
      }
    }

    if (visitSession.sessionConflicts.includes('DOUBLE_BOOKING_OR_RESERVATION')) {
      return {
        text: 'Prisoner has a visit',
        classes: 'govuk-tag--red',
      }
    }

    if (availableTables <= 0) {
      return {
        text: 'Fully booked',
        classes: 'govuk-tag--red',
      }
    }

    return undefined
  }

  private buildScheduledEvent(event: PrisonerScheduledEventDto): CalendarScheduledEvent {
    return {
      daySection: this.isBeforeMorningCutOff(event.startTime) ? 'morning' : 'afternoon',
      startTime: event.startTime,
      endTime: event.endTime,
      description: this.getEventDescription(event),
    }
  }

  // is a start time (HH:MM) before morning cut off time
  private isBeforeMorningCutOff(time: string): boolean {
    const hours = parseInt(time.substring(0, 2), 10)
    return hours < this.morningCutOff
  }

  // TODO remove
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
          description: this.getEventDescription(event),
        }
      })
  }

  private getEventDescription(event: ScheduledEvent | PrisonerScheduledEventDto): string {
    if (event.eventType === 'APP') {
      return `Appointment - ${event.eventSubTypeDesc}`
    }

    if (event.eventType === 'VISIT') {
      return `Visit - ${event.eventSourceDesc}`
    }

    return `Activity - ${event.eventSourceDesc}`
  }
}
