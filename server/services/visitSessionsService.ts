import { format, parseISO } from 'date-fns'
import { OrchestrationApiClient } from '../data'
import { VisitorListItem, VisitSessionData } from '../@types/bapv'
import {
  VisitSession,
  SessionCapacity,
  SessionSchedule,
  VisitSessionV2Dto,
  PrisonerScheduledEventDto,
  SessionConflict,
} from '../data/orchestrationApiTypes'

// Single day on calendar with info for grid day and any visit sessions/events
export type CalendarDay = {
  date: string // e.g. 2025-09-01
  monthHeading: string // e.g. September

  // grid day options
  colour?: 'orange' | 'red' // default is grey (no sessions) or blue (sessions)
  selected: boolean // renders with filled circle background
  outline: boolean // renders with circular outline

  showAgeRestrictionWarning: boolean // show day level age restriction warning

  visitSessions: CalendarVisitSession[] // visit sessions with capacity for given OPEN/CLOSED restriction
  scheduledEvents: CalendarScheduledEvent[]
}

type CalendarDaySection = 'morning' | 'afternoon'

export type CalendarVisitSessionTag =
  'ORIGINAL_BOOKING' | 'CURRENT_RESERVATION' | 'EXISTING_BOOKING' | 'FULLY_BOOKED' | 'AGE_RESTRICTED'

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
  ageRestriction: number
  sessionConflicts: VisitSessionV2Dto['sessionConflicts']
  disabled: boolean // is radio input disabled
  tags: CalendarVisitSessionTag[]
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

  constructor(private readonly orchestrationApiClient: OrchestrationApiClient) {}

  async getSingleVisitSession({
    prisonCode,
    sessionDate,
    sessionTemplateReference,
  }: {
    prisonCode: string
    sessionDate: string
    sessionTemplateReference: string
  }): Promise<VisitSession> {
    return this.orchestrationApiClient.getSingleVisitSession(prisonCode, sessionDate, sessionTemplateReference)
  }

  async getSessionSchedule({
    prisonId,
    date,
    includeExcludedSessions,
  }: {
    prisonId: string
    date: string
    includeExcludedSessions: boolean
  }): Promise<SessionSchedule[]> {
    return this.orchestrationApiClient.getSessionSchedule({ prisonId, date, includeExcludedSessions })
  }

  async getVisitSessionCapacity(
    prisonId: string,
    sessionDate: string,
    sessionStartTime: string,
    sessionEndTime: string,
  ): Promise<SessionCapacity> {
    return this.orchestrationApiClient.getVisitSessionCapacity(prisonId, sessionDate, sessionStartTime, sessionEndTime)
  }

  async getVisitSessionsAndScheduleCalendar({
    username,
    prisonId,
    prisonerId,
    minNumberOfDays,
    visitors,
    visitRestriction,
    selectedVisitSession,
    originalVisitSession,
  }: {
    username: string
    prisonId: string
    prisonerId: string
    minNumberOfDays: number
    visitors: VisitorListItem[]
    visitRestriction: VisitSessionData['visitRestriction']
    selectedVisitSession: VisitSessionData['selectedVisitSession'] | undefined
    originalVisitSession: VisitSessionData['originalVisitSession'] | undefined
  }): Promise<{ calendar: CalendarDay[]; scheduledEventsAvailable: boolean }> {
    const { scheduledEventsAvailable, sessionsAndSchedule } =
      await this.orchestrationApiClient.getVisitSessionsAndSchedule({
        prisonId,
        prisonerId,
        minNumberOfDays,
        username,
        youngestVisitorAge: this.getYoungestVisitorAge(visitors),
      })

    // map raw session/schedule data to format for calendar
    const calendar: CalendarDay[] = sessionsAndSchedule.map(day => {
      const { date, visitSessions, scheduledEvents } = day

      // Filter out sessions if:
      //  - no capacity for requested visit restriction type (OPEN/CLOSED)
      //  - a SESSION_DATE_BLOCKED conflict is present
      const filteredVisitSessions = visitSessions.filter(visitSession => {
        const hasCapacity =
          visitRestriction === 'OPEN' ? visitSession.openVisitCapacity > 0 : visitSession.closedVisitCapacity > 0

        const sessionIsBlocked = this.sessionHasConflictOfType({
          sessionConflicts: visitSession.sessionConflicts,
          conflictType: 'SESSION_DATE_BLOCKED',
        })

        return hasCapacity && !sessionIsBlocked
      })

      // Transform visit sessions and events data for calendar
      const calendarVisitSessions = filteredVisitSessions.map(visitSession =>
        this.buildVisitSession(date, visitSession, visitRestriction, selectedVisitSession, originalVisitSession),
      )
      const calendarScheduledEvents = scheduledEvents.map(event => this.buildScheduledEvent(event))

      const colour = this.getDayColour(calendarVisitSessions, selectedVisitSession, originalVisitSession)

      // Show age restriction warning if at least one of the day's visit sessions has an AGE_RESTRICTION tag
      const showAgeRestrictionWarning = calendarVisitSessions.some(visitSession =>
        visitSession.tags.includes('AGE_RESTRICTED'),
      )

      return {
        date,
        monthHeading: format(parseISO(date), 'MMMM'),
        ...(colour && { colour }),
        selected: false,
        outline: selectedVisitSession?.date === date || originalVisitSession?.date === date,
        showAgeRestrictionWarning,
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

  private getYoungestVisitorAge(visitors: VisitorListItem[]): number | null {
    const visitorsWithAge = visitors.filter(visitor => typeof visitor.age === 'number')

    if (visitorsWithAge.length === 0) {
      return null
    }

    const youngestAge = Math.min(...visitorsWithAge.map(visitor => visitor.age))
    return youngestAge
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

    return {
      date,
      sessionTemplateReference: visitSession.sessionTemplateReference,
      daySection: this.isBeforeMorningCutOff(visitSession.startTime) ? 'morning' : 'afternoon',
      startTime: visitSession.startTime,
      endTime: visitSession.endTime,
      visitRoom: visitSession.visitRoom,
      availableTables,
      capacity,
      ageRestriction: visitSession.ageRestriction,
      sessionConflicts: visitSession.sessionConflicts,
      disabled: this.isVisitSessionDisabled(date, visitSession, originalVisitSession),
      tags: this.getVisitSessionTags(date, visitSession, selectedVisitSession, originalVisitSession, availableTables),
    }
  }

  private isVisitSessionDisabled(
    date: string,
    visitSession: VisitSessionV2Dto,
    originalVisitSession: VisitSessionData['originalVisitSession'],
  ): boolean {
    // an age-restricted visit session should always be disabled
    if (
      this.sessionHasConflictOfType({
        sessionConflicts: visitSession.sessionConflicts,
        conflictType: 'AGE_RESTRICTION',
      })
    ) {
      return true
    }

    // the original visit session (i.e. on an update journey) should not be disabled
    if (
      originalVisitSession &&
      date === originalVisitSession.date &&
      visitSession.sessionTemplateReference === originalVisitSession.sessionTemplateReference
    ) {
      return false
    }

    // an existing booking should disable the visit session
    return this.sessionHasConflictOfType({
      sessionConflicts: visitSession.sessionConflicts,
      conflictType: 'DOUBLE_BOOKING_OR_RESERVATION',
    })
  }

  private getVisitSessionTags(
    date: string,
    visitSession: VisitSessionV2Dto,
    selectedVisitSession: VisitSessionData['selectedVisitSession'] | undefined,
    originalVisitSession: VisitSessionData['originalVisitSession'] | undefined,
    availableTables: number,
  ): CalendarVisitSessionTag[] {
    const tags: CalendarVisitSessionTag[] = []

    // *** Define conditions for tags ***

    // Originally booked visit session (in an update journey)
    const isOriginallyBookedSession =
      date === originalVisitSession?.date &&
      visitSession.sessionTemplateReference === originalVisitSession.sessionTemplateReference

    // Currently reserved visit session (the one currently selected on book or update journey)
    const isCurrentlyReservedSession =
      date === selectedVisitSession?.date &&
      visitSession.sessionTemplateReference === selectedVisitSession.sessionTemplateReference

    // Session is either:
    // 1. an existing visit booking for the prisoner
    // 2. (on an update journey) the existing booking that is kept reserved until the update is completed
    const isBookedOrReserved = this.sessionHasConflictOfType({
      sessionConflicts: visitSession.sessionConflicts,
      conflictType: 'DOUBLE_BOOKING_OR_RESERVATION',
    })

    // Prisoner has an existing booking on this visit session
    const isAlreadyBooked = isBookedOrReserved && !isOriginallyBookedSession

    // Session has an age restriction conflict
    const isAgeRestricted = this.sessionHasConflictOfType({
      sessionConflicts: visitSession.sessionConflicts,
      conflictType: 'AGE_RESTRICTION',
    })

    // Session fully booked
    const isFullyBooked = availableTables <= 0

    // *** Apply tags ***
    if (isOriginallyBookedSession) {
      tags.push('ORIGINAL_BOOKING')
    }

    if (isCurrentlyReservedSession && !isOriginallyBookedSession) {
      tags.push('CURRENT_RESERVATION')
    }

    if (isAlreadyBooked) {
      tags.push('EXISTING_BOOKING')
    }

    if (isFullyBooked && !isBookedOrReserved && !isOriginallyBookedSession && !isCurrentlyReservedSession) {
      tags.push('FULLY_BOOKED')
    }

    if (isAgeRestricted && !isAlreadyBooked) {
      tags.push('AGE_RESTRICTED')
    }

    return tags
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

    const allSessionsAreDisabled = calendarVisitSessions.every(visitSession => visitSession.disabled)
    if (allSessionsAreDisabled) {
      return 'red'
    }

    const allAvailableSessionsFull = calendarVisitSessions
      .filter(
        visitSession =>
          this.sessionConflictCount({
            sessionConflicts: visitSession.sessionConflicts,
            // ignore until 'overrides' feature implemented
            excludeConflictTypes: [
              'REMAND_VISITS_LIMIT_REACHED',
              'NO_VO_BALANCE',
              'NO_PVO_BALANCE',
              'NO_VO_OR_PVO_BALANCE',
            ],
          }) === 0,
      )
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

  private sessionHasConflictOfType({
    sessionConflicts,
    conflictType,
  }: {
    sessionConflicts: VisitSessionV2Dto['sessionConflicts']
    conflictType: SessionConflict
  }): boolean {
    return sessionConflicts.some(conflict => conflict.sessionConflict === conflictType)
  }

  private sessionConflictCount({
    sessionConflicts,
    excludeConflictTypes,
  }: {
    sessionConflicts: VisitSessionV2Dto['sessionConflicts']
    excludeConflictTypes: SessionConflict[]
  }): number {
    return sessionConflicts.filter(conflict => !excludeConflictTypes.includes(conflict.sessionConflict)).length
  }
}
