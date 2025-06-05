import { MoJAlert } from '../@types/bapv'
import { NotificationType } from '../data/orchestrationApiTypes'

// used on visits to review listing page and visit details timeline
export const notificationTypes: Partial<Record<NotificationType, string>> = {
  PRISONER_RELEASED_EVENT: 'Prisoner released',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'Time slot removed',
  PRISONER_RECEIVED_EVENT: 'Prisoner transferred',
  VISITOR_RESTRICTION: 'Visitor restriction',
}

// used on visits to review listing page
export const notificationTypeReasons: Partial<Record<NotificationType, string>> = {
  PRISONER_RELEASED_EVENT: 'the prisoner is released',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'the date is no longer available for social visits',
  PRISONER_RECEIVED_EVENT: 'the prisoner has been transferred',
  VISITOR_RESTRICTION: 'a visitor has a new or updated restriction',
}

// alerts for visit details page
export const notificationTypeAlerts: Partial<Record<NotificationType, MoJAlert>> = {
  PRISONER_RELEASED_EVENT: {
    variant: 'error',
    title: 'The prisoner has been released',
    showTitleAsHeading: true,
    text: 'This booking should be cancelled.',
  },

  PRISONER_RECEIVED_EVENT: {
    variant: 'warning',
    title: 'The prisoner has been transferred',
    showTitleAsHeading: true,
    text: 'This booking should be reviewed.',
  },

  PRISON_VISITS_BLOCKED_FOR_DATE: {
    variant: 'error',
    title: 'This date is no longer available for social visits',
    showTitleAsHeading: true,
    text: 'A new visit time should be selected.',
  },

  // VISITOR_RESTRICTION: handled in getVisitNotificationsAlerts()
}
