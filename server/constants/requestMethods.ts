import { ApplicationMethodType } from '../data/orchestrationApiTypes'

export const requestMethodsCancellation: Readonly<Partial<Record<ApplicationMethodType, string>>> = {
  PHONE: 'Phone call',
  WEBSITE: 'GOV.UK',
  EMAIL: 'Email',
  IN_PERSON: 'In person',
}

export const requestMethodsBooking: Readonly<Partial<Record<ApplicationMethodType, string>>> = {
  ...requestMethodsCancellation,
  BY_PRISONER: 'By the prisoner',
}

export const requestMethodDescriptions: Readonly<Record<ApplicationMethodType, string>> = {
  PHONE: 'Request method: Phone call',
  WEBSITE: 'Request method: GOV.UK',
  EMAIL: 'Request method: Email',
  IN_PERSON: 'Request method: In person',
  BY_PRISONER: 'Request method: By the prisoner',
  NOT_KNOWN: '', // Return empty string when request method is unknown
  NOT_APPLICABLE: '', // Return empty string when request method is not applicable
}
