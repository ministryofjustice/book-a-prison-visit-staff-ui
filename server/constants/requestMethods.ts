import { ApplicationMethodType } from '../data/orchestrationApiTypes'

export const requestMethodOptions: Readonly<Partial<Record<ApplicationMethodType, string>>> = {
  PHONE: 'Phone call',
  WEBSITE: 'GOV.UK',
  EMAIL: 'Email',
  IN_PERSON: 'In person',
}

export const requestMethodDescriptions: Readonly<Record<ApplicationMethodType, string>> = {
  PHONE: 'Phone call request',
  WEBSITE: 'GOV.UK request',
  EMAIL: 'Email request',
  IN_PERSON: 'In person request',
  NOT_KNOWN: '', // Return empty string when request method is unknown
  NOT_APPLICABLE: '', // Return empty string when request method is not applicable
}
