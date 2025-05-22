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

// Used in visit details timeline
export const requestMethodDescriptions: Partial<Record<ApplicationMethodType, string>> = {
  PHONE: 'Method: Phone booking',
  WEBSITE: 'Method: GOV.UK request',
  EMAIL: 'Method: Email request',
  IN_PERSON: 'Method: In person booking',
  BY_PRISONER: 'Method: Prisoner request',
}
