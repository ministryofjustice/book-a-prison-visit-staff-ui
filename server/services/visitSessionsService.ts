import { format, parseISO, isAfter, isBefore, parse } from 'date-fns'
import { VisitSlot, VisitSlotList, VisitSlotsForDay, VisitSessionData, PrisonerEvent, GOVUKTag } from '../@types/bapv'
import {
  VisitSession,
  SessionCapacity,
  SessionSchedule,
  SessionsAndScheduleDto,
  VisitSessionV2Dto,
  PrisonerScheduledEventDto,
} from '../data/orchestrationApiTypes'
import { ScheduledEvent } from '../data/whereaboutsApiTypes'
import { HmppsAuthClient, RestClientBuilder, OrchestrationApiClient, WhereaboutsApiClient } from '../data'
import { formatStartToEndTime } from '../utils/utils'

// Single date on the calendar grid
type CalendarGridDate = {
  date: string // e.g. 2025-09-01
  sessionCount: number
  colour?: 'orange' | 'red' // defaults to grey (no sessions) or blue (sessions)
  selected?: boolean // renders with filled circle background
  outline?: boolean // renders with circular outline
}

export type CalendarMonth = {
  monthLabel: string // e.g. 'March'
  days: CalendarGridDate[]
}

// Single visit session entry within a morning/afternoon section
type CalendarVisitSession = {
  sessionTemplateReference: string
  time: string // e.g. "10am to 11am"
  visitRoom: string
  availableTables: number
  disabled?: boolean
  tag?: GOVUKTag
}

// Single prisoner event entry within a morning/afternoon section
type CalendarScheduledEvent = {
  time: string // e.g. "10am to 11am"
  description: string
}

type CalendarDaySection = {
  label: 'morning' | 'afternoon'
  visitSessions: CalendarVisitSession[]
  scheduledEvents: CalendarScheduledEvent[]
}

export type CalendarFullDay = {
  date: string // yyyy-mm-dd
  daySection: CalendarDaySection[]
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
    selectedVisitSession,
    visitRestriction,
  }: {
    username: string
    prisonId: string
    prisonerId: string
    minNumberOfDays: number
    selectedVisitSession: VisitSessionData['selectedVisitSession'] | undefined
    visitRestriction: VisitSessionData['visitRestriction']
  }): Promise<{ calendar: CalendarMonth[]; calendarFullDays: CalendarFullDay[]; scheduledEventsAvailable: boolean }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const { scheduledEventsAvailable, sessionsAndSchedule } = await orchestrationApiClient.getVisitSessionsAndSchedule({
      prisonId,
      prisonerId,
      minNumberOfDays,
      username,
    })

    const calendar = this.buildCalendarMonths(sessionsAndSchedule, selectedVisitSession)
    const calendarFullDays = this.buildCalendarFullDays(sessionsAndSchedule, visitRestriction)

    return {
      calendar,
      calendarFullDays,
      scheduledEventsAvailable,
    }
  }

  private buildCalendarMonths(
    sessionsAndSchedule: SessionsAndScheduleDto[],
    selectedVisitSession: VisitSessionData['selectedVisitSession' | undefined],
  ): CalendarMonth[] {
    let selectedDateFound = false
    const calendarMonths = sessionsAndSchedule.reduce((months, day) => {
      const { date, visitSessions } = day

      const monthLabel = format(day.date, 'MMMM') // e.g. 'September'
      if (months.at(-1)?.monthLabel !== monthLabel) {
        months.push({ monthLabel, days: [] })
      }

      const calendarGridDate: CalendarGridDate = {
        date,
        sessionCount: visitSessions.length,
      }

      const matchesSelectedVisitSession =
        selectedVisitSession?.date === date &&
        visitSessions.some(
          session => session.sessionTemplateReference === selectedVisitSession?.sessionTemplateReference,
        )

      if (matchesSelectedVisitSession) {
        calendarGridDate.selected = true
        selectedDateFound = true
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
  ): CalendarFullDay[] {
    const daysWithVisitSessions = sessionsAndSchedule.filter(day => day.visitSessions.length > 0)

    const sessionsAndScheduleDays: CalendarFullDay[] = daysWithVisitSessions.map(day => {
      const currentDaySessionSchedule: CalendarFullDay = {
        date: day.date,
        daySection: [],
      }

      // split visit sessions to morning / afternoon
      const morningVisitSessions = day.visitSessions.filter(session => this.isBeforeMorningCutOff(session.startTime))
      const afternoonVisitSessions = day.visitSessions.filter(session => !this.isBeforeMorningCutOff(session.startTime))

      if (morningVisitSessions.length) {
        const morningEvents = day.scheduledEvents.filter(event => this.isBeforeMorningCutOff(event.startTime))

        currentDaySessionSchedule.daySection.push({
          label: 'morning',
          visitSessions: morningVisitSessions.map(visitSession =>
            this.buildVisitSession(visitSession, visitRestriction),
          ),
          scheduledEvents: morningEvents.map(event => this.buildCalendarScheduledEvent(event)),
        })
      }

      if (afternoonVisitSessions.length) {
        const afternoonEvents = day.scheduledEvents.filter(event => !this.isBeforeMorningCutOff(event.startTime))

        currentDaySessionSchedule.daySection.push({
          label: 'afternoon',
          visitSessions: afternoonVisitSessions.map(visitSession =>
            this.buildVisitSession(visitSession, visitRestriction),
          ),
          scheduledEvents: afternoonEvents.map(event => this.buildCalendarScheduledEvent(event)),
        })
      }

      return currentDaySessionSchedule
    })

    return sessionsAndScheduleDays
  }

  private buildVisitSession(
    visitSession: VisitSessionV2Dto,
    visitRestriction: VisitSessionData['visitRestriction'],
  ): CalendarVisitSession {
    const availableTables =
      visitRestriction === 'OPEN'
        ? visitSession.openVisitCapacity - visitSession.openVisitBookedCount
        : visitSession.closedVisitCapacity - visitSession.closedVisitBookedCount

    return {
      sessionTemplateReference: visitSession.sessionTemplateReference,
      time: formatStartToEndTime(visitSession.startTime, visitSession.endTime),
      visitRoom: visitSession.visitRoom,
      availableTables,
      // TODO disabled
      // TODO tag
    }
  }

  private buildCalendarScheduledEvent(event: PrisonerScheduledEventDto): CalendarScheduledEvent {
    return {
      time: formatStartToEndTime(event.startTime, event.endTime),
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
