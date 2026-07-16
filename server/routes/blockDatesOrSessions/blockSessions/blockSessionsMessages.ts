import { format, parseISO } from 'date-fns'
import { MoJAlert } from '../../../@types/bapv'
import { SessionSchedule } from '../../../data/orchestrationApiTypes'
import { escapeHtml, formatStartToEndTime } from '../../../utils/utils'
import { buildAttendeesText } from '../../timetable/timetableItemBuilder'

export const getSessionBlockedMessage = ({ date, session }: { date: string; session: SessionSchedule }): MoJAlert => {
  return buildMessage(date, session, 'blocked')
}

export const getSessionUnblockedMessage = ({ date, session }: { date: string; session: SessionSchedule }): MoJAlert => {
  return buildMessage(date, session, 'unblocked')
}

const buildMessage = (date: string, session: SessionSchedule, type: 'blocked' | 'unblocked'): MoJAlert => {
  const formattedDate = format(parseISO(date), 'EEEE d MMMM yyyy')
  const time = formatStartToEndTime(session.sessionTimeSlot.startTime, session.sessionTimeSlot.endTime)
  const attendees = escapeHtml(buildAttendeesText({ ...session }))

  return {
    variant: 'success',
    title: `Visit session ${type} for date`,
    html: `Visits are ${type} on ${formattedDate} for ${time} (${session.visitRoom}), <br>${attendees}`,
  }
}
