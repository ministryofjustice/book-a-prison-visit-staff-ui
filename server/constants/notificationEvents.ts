import { NotificationType } from '../data/orchestrationApiTypes'

export const notificationTypes: Partial<Readonly<Record<NotificationType, string>>> = {
  PRISONER_RELEASED_EVENT: 'Prisoner released',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'Time slot removed',
  PRISONER_RECEIVED_EVENT: 'Prisoner transferred',
}

export const notificationTypeReasons: Partial<Readonly<Record<NotificationType, string>>> = {
  PRISONER_RELEASED_EVENT: 'the prisoner is released',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'the date is no longer available for social visits',
  PRISONER_RECEIVED_EVENT: 'the prisoner has been transferred',
}

export const notificationTypeWarnings: Partial<Readonly<Record<NotificationType, string>>> = {
  PRISONER_RELEASED_EVENT: 'This booking should be cancelled as the prisoner has been released.',
  PRISON_VISITS_BLOCKED_FOR_DATE:
    'A new visit time should be selected as the date is no longer available for social visits.',
  PRISONER_RECEIVED_EVENT: 'This booking should be reviewed as the prisoner has been transferred.',
}
