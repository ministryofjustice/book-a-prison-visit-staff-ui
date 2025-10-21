import { format } from 'date-fns'
import { HmppsAuthClient, RestClientBuilder, OrchestrationApiClient } from '../data'
import { GOVUKTag, VisitSessionData } from '../@types/bapv'
import {
  VisitSession,
  SessionCapacity,
  SessionSchedule,
  VisitSessionV2Dto,
  PrisonerScheduledEventDto,
} from '../data/orchestrationApiTypes'

// Single day on calendar with info for grid day and any visit sessions/events
export type CalendarDay = {
  date: string // e.g. 2025-09-01
  monthHeading: string // e.g. September

  // grid day options
  colour?: 'orange' | 'red' // default is grey (no sessions) or blue (sessions)
  selected: boolean // renders with filled circle background
  outline: boolean // renders with circular outline

  visitSessions: CalendarVisitSession[] // visit sessions with capacity for given OPEN/CLOSED restriction
  scheduledEvents: CalendarScheduledEvent[]
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
  sessionConflicts: VisitSessionV2Dto['sessionConflicts']
  disabled: boolean // is radio input disabled
  tag?: GOVUKTag
}

// Single prisoner event entry
export type CalendarScheduledEvent = {
  daySection: CalendarDaySection
  startTime: string // e.g. "10:00"
  endTime: string
  description: string
}

export default class VisitSessionsService {
  private morningCutOff = 12

  constructor(
    private readonly orchestrationApiClientFactory: RestClientBuilder<OrchestrationApiClient>,
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
  }): Promise<{ calendar: CalendarDay[]; scheduledEventsAvailable: boolean }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const orchestrationApiClient = this.orchestrationApiClientFactory(token)

    const { scheduledEventsAvailable, sessionsAndSchedule } = await orchestrationApiClient.getVisitSessionsAndSchedule({
      prisonId,
      prisonerId,
      minNumberOfDays,
      username,
    })

    // map raw session/schedule data to format for calendar
    const calendar: CalendarDay[] = sessionsAndSchedule.map(day => {
      const { date, visitSessions, scheduledEvents } = day

      // Filter out sessions with no capacity for requested visit restriction type
      const visitSessionsWithCapacityForRestriction = visitSessions.filter(visitSession =>
        visitRestriction === 'OPEN' ? visitSession.openVisitCapacity > 0 : visitSession.closedVisitCapacity > 0,
      )

      // Transform visit sessions and events data for calendar
      const calendarVisitSessions = visitSessionsWithCapacityForRestriction.map(visitSession =>
        this.buildVisitSession(date, visitSession, visitRestriction, selectedVisitSession, originalVisitSession),
      )
      const calendarScheduledEvents = scheduledEvents.map(event => this.buildScheduledEvent(event))

      const colour = this.getDayColour(calendarVisitSessions, selectedVisitSession, originalVisitSession)

      return {
        date,
        monthHeading: format(date, 'MMMM'),
        ...(colour && { colour }),
        selected: false,
        outline: selectedVisitSession?.date === date || originalVisitSession?.date === date,
        visitSessions: calendarVisitSessions,
        scheduledEvents: calendarScheduledEvents,
      }
    })

    // Determine which grid day to select (highlight). Order of preference is the day with:
    // 1. selected visit session (if set)
    // 2. original visit session (set on update journey)
    // 3. first available visit session (if there are any)
    const dayWithSelectedVisitSession =
      selectedVisitSession &&
      this.getCalendarDay(calendar, selectedVisitSession.date, selectedVisitSession.sessionTemplateReference)

    const dayWithOriginalVisitSession =
      originalVisitSession &&
      this.getCalendarDay(calendar, originalVisitSession.date, originalVisitSession.sessionTemplateReference)

    const dayToSelect = dayWithSelectedVisitSession ?? dayWithOriginalVisitSession

    if (dayToSelect) {
      dayToSelect.selected = true
    } else {
      const firstDayWithVisitSession = calendar.find(day => day.visitSessions.length > 0)
      if (firstDayWithVisitSession) {
        firstDayWithVisitSession.selected = true
      }
    }

    return { calendar, scheduledEventsAvailable }
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
      sessionConflicts: visitSession.sessionConflicts,
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
        classes: 'govuk-tag--light-blue',
      }
    }

    if (
      date === selectedVisitSession?.date &&
      visitSession.sessionTemplateReference === selectedVisitSession.sessionTemplateReference
    ) {
      return {
        text: 'Reserved visit time',
        classes: 'govuk-tag--light-blue',
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
        classes: 'govuk-tag--orange',
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

  // is a start time (HH:mm) before morning cut off time
  private isBeforeMorningCutOff(time: string): boolean {
    const hours = parseInt(time.substring(0, 2), 10)
    return hours < this.morningCutOff
  }

  // Determine day colours based on visit session availability and existing bookings/reservations
  private getDayColour(
    calendarVisitSessions: CalendarVisitSession[],
    selectedVisitSession: VisitSessionData['selectedVisitSession'],
    originalVisitSession: VisitSessionData['originalVisitSession'],
  ): CalendarDay['colour'] | undefined {
    if (calendarVisitSessions.length === 0) {
      return undefined
    }

    const hasSelectedVisitSession =
      selectedVisitSession &&
      calendarVisitSessions.some(
        visitSession =>
          visitSession.date === selectedVisitSession.date &&
          visitSession.sessionTemplateReference === selectedVisitSession.sessionTemplateReference,
      )
    const hasOriginalVisitSession =
      originalVisitSession &&
      calendarVisitSessions.some(
        visitSession =>
          visitSession.date === originalVisitSession.date &&
          visitSession.sessionTemplateReference === originalVisitSession.sessionTemplateReference,
      )
    if (hasSelectedVisitSession || hasOriginalVisitSession) {
      return undefined
    }

    const allSessionsHaveExistingVisit = calendarVisitSessions.every(visitSession =>
      visitSession.sessionConflicts.includes('DOUBLE_BOOKING_OR_RESERVATION'),
    )
    if (allSessionsHaveExistingVisit) {
      return 'red'
    }

    const allAvailableSessionsFull = calendarVisitSessions
      .filter(visitSession => visitSession.sessionConflicts.length === 0)
      .every(visitSession => visitSession.availableTables <= 0)
    if (allAvailableSessionsFull) {
      return 'orange'
    }

    // default (blue)
    return undefined
  }

  private getCalendarDay(
    calendar: CalendarDay[],
    date: string,
    sessionTemplateReference: string,
  ): CalendarDay | undefined {
    return calendar.find(day =>
      day.visitSessions.find(
        visitSession =>
          visitSession.date === date && visitSession.sessionTemplateReference === sessionTemplateReference,
      ),
    )
  }

  private getEventDescription(event: PrisonerScheduledEventDto): string {
    if (event.eventType === 'APP') {
      return `Appointment - ${event.eventSubTypeDesc}`
    }

    if (event.eventType === 'VISIT') {
      return `Visit - ${event.eventSourceDesc}`
    }

    return `Activity - ${event.eventSourceDesc}`
  }
}
