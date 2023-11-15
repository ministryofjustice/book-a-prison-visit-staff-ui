import { addDays, isAfter } from 'date-fns'
import { VisitorListItem } from '../@types/bapv'
import { Address, Contact, Restriction } from '../data/prisonerContactRegistryApiTypes'
import { isAdult } from './utils'

const visitorRestrictionsToShow = ['BAN', 'PREINF', 'RESTRICTED', 'CLOSED', 'NONCON']
const maximumNumberOfDays = 28

const buildVisitorListItem = (visitor: Contact): VisitorListItem => {
  return {
    personId: visitor.personId,
    name: `${visitor.firstName} ${visitor.lastName}`,
    dateOfBirth: visitor.dateOfBirth,
    adult: visitor.dateOfBirth ? isAdult(visitor.dateOfBirth) : true,
    relationshipDescription: visitor.relationshipDescription,
    address: getAddressToDisplay(visitor.addresses),
    restrictions: getRestrictionsToDisplay(visitor.restrictions),
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
  const banned = restrictions.find(restriction => restriction.restrictionType === 'BAN')
  const futureDate = addDays(new Date(), maximumNumberOfDays)
  if (banned) {
    if (banned.expiryDate) {
      // return true if ban is after today + maximum number of days
      return isAfter(new Date(banned.expiryDate), futureDate)
    }
    // return true if ban has no expiry
    return true
  }
  // return false if no ban found
  return false
}

export default buildVisitorListItem
