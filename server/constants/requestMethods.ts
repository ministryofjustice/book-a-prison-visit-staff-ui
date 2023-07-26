import { ApplicationMethodType } from '../data/orchestrationApiTypes'

export const requestMethodOptions: Readonly<Partial<Record<ApplicationMethodType, string>>> = {
  PHONE: 'Phone call',
  WEBSITE: 'GOV.UK',
  EMAIL: 'Email',
  IN_PERSON: 'In person',
}

export const requestMethodDescriptions: Readonly<Record<ApplicationMethodType, string>> = {
  PHONE: '(phone call request)',
  WEBSITE: '(GOV.UK request)',
  EMAIL: '(email request)',
  IN_PERSON: '(in person request)',
  NOT_KNOWN: '', // Return empty string when request method is unknown
}
