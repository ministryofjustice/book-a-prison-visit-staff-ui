import { ApplicationMethodType } from '../data/orchestrationApiTypes'

export const requestMethodOptions: Readonly<Partial<Record<ApplicationMethodType, string>>> = {
  PHONE: 'Phone call',
  WEBSITE: 'GOV.UK',
  EMAIL: 'Email',
  IN_PERSON: 'In person',
}

export const requestMethodDescriptions: Readonly<Record<ApplicationMethodType, string>> = {
  PHONE: 'Phone call',
  WEBSITE: 'GOV.UK',
  EMAIL: 'Email',
  IN_PERSON: 'In person',
  NOT_KNOWN: 'Unknown',
}
