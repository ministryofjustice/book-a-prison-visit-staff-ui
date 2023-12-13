import { NotificationType } from '../data/orchestrationApiTypes'

export const notificationTypes: Readonly<Record<NotificationType, string>> = {
  NON_ASSOCIATION_EVENT: 'Non–association',
  PRISONER_RELEASED_EVENT: 'Prisoner released',
  PRISONER_RESTRICTION_CHANGE_EVENT: 'Visit type changed',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'No visits that day',
}

export const notificationTypeDescriptions: Readonly<Record<NotificationType, string>> = {
  NON_ASSOCIATION_EVENT: 'there are non-associations',
  PRISONER_RELEASED_EVENT: 'the prisoner is released',
  PRISONER_RESTRICTION_CHANGE_EVENT: 'the visit type has changed',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'the date is no longer available for social visits',
}

export const notificationTypePathSegments: Readonly<Record<NotificationType, string>> = {
  NON_ASSOCIATION_EVENT: 'non-association',
  PRISONER_RELEASED_EVENT: 'prisoner-released',
  PRISONER_RESTRICTION_CHANGE_EVENT: 'visit-type-change',
  PRISON_VISITS_BLOCKED_FOR_DATE: 'blocked-date',
}
