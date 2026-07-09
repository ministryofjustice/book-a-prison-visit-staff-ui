import { PrisonAndSessionsExcludeDatesDto } from '../../data/orchestrationApiTypes'
import { formatStartToEndTime } from '../../utils/utils'
import { buildAttendeesText } from '../timetable/timetableItemBuilder'

export type BlockedDateOrSessionRow = {
  date: string // YYYY-MM-DD
  when: string
  attendees: string
  actionedBy: string
  sessionTemplateReference?: string
}

const buildBlockedDatesAndSessionsTable = ({
  fullDateExclusions,
  sessionExclusions,
}: PrisonAndSessionsExcludeDatesDto): BlockedDateOrSessionRow[] => {
  const rows: BlockedDateOrSessionRow[] = []

  fullDateExclusions.forEach(({ excludeDate, actionedBy }) => {
    rows.push({
      date: excludeDate,
      when: 'All day',
      attendees: 'All prisoners',
      actionedBy,
    })
  })

  sessionExclusions.forEach(sessionExclusion => {
    rows.push({
      date: sessionExclusion.excludeDate.excludeDate,
      when: formatStartToEndTime(
        sessionExclusion.sessionTimeSlot?.startTime,
        sessionExclusion.sessionTimeSlot?.endTime,
      ),
      attendees: buildAttendeesText({ ...sessionExclusion }),
      actionedBy: sessionExclusion.excludeDate.actionedBy,
      sessionTemplateReference: sessionExclusion.sessionTemplateReference,
    })
  })

  // Sort rows by date ascending and then by those without a sessionTemplateReference (i.e. day blocks) first
  rows.sort((a, b) => {
    if (a.date < b.date) return -1
    if (a.date > b.date) return 1

    if (a.sessionTemplateReference && !b.sessionTemplateReference) return 1
    if (!a.sessionTemplateReference && b.sessionTemplateReference) return -1

    return 0
  })

  return rows
}

export default buildBlockedDatesAndSessionsTable
