import { VisitorListItem } from '../@types/bapv'
import { Address, Contact, Restriction } from '../data/prisonerContactRegistryApiTypes'
import { isAdult } from './utils'

const visitorRestrictionsToShow = ['BAN', 'PREINF', 'RESTRICTED', 'CLOSED', 'NONCON']

const buildVisitorListItem = (visitor: Contact): VisitorListItem => {
  return {
    personId: visitor.personId,
    name: `${visitor.firstName} ${visitor.lastName}`,
    dateOfBirth: visitor.dateOfBirth,
    adult: visitor.dateOfBirth ? isAdult(visitor.dateOfBirth) : undefined,
    relationshipDescription: visitor.relationshipDescription,
    address: getAddressToDisplay(visitor.addresses),
    restrictions: getRestrictionsToDisplay(visitor.restrictions),
    selected: false,
    banned: isBanned(visitor.restrictions),
  }
}

const getAddressToDisplay = (addresses: Address[]): string => {
  if (addresses.length === 0) return 'Not entered'

  const primaryAddress = addresses.find(address => address.primary)
  return getFormattedAddress(primaryAddress || addresses[0])
}

const getFormattedAddress = (address: Address): string => {
  const flat = address.flat && `Flat ${address.flat}`
  const formattedAddress = [
    address.premise,
    flat,
    address.street,
    address.locality,
    address.town,
    address.county,
    address.postalCode,
    address.country,
  ]
    .filter(value => value)
    .join(',<br>')

  return formattedAddress
}

const getRestrictionsToDisplay = (restrictions: Restriction[]): Restriction[] => {
  return restrictions.filter(restriction => visitorRestrictionsToShow.includes(restriction.restrictionType))
}

const isBanned = (restrictions: Restriction[]): boolean => {
  return !!restrictions.find(restriction => restriction.restrictionType === 'BAN')
}

export default buildVisitorListItem
