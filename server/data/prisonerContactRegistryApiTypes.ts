import { components } from '../@types/prisoner-contact-registry-api'

export type Address = components['schemas']['AddressDto']

// TODO transitional - remove when 'addresses' removed in VB-6423
export type ContactDto = components['schemas']['ContactDto']

export type Contact = Omit<ContactDto, 'addresses'>

export type Restriction = components['schemas']['RestrictionDto']
