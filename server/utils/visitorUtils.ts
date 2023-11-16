import { addDays, differenceInBusinessDays, differenceInDays, isAfter } from 'date-fns'
import { VisitorListItem } from '../@types/bapv'
import { Address, Contact, Restriction } from '../data/prisonerContactRegistryApiTypes'
import { isAdult } from './utils'

const visitorRestrictionsToShow = ['BAN', 'PREINF', 'RESTRICTED', 'CLOSED', 'NONCON']
const MAXIMUM_NUMBER_DAYS = 28

export const buildVisitorListItem = (visitor: Contact): VisitorListItem => {
  return {
    personId: visitor.personId,
    name: `${visitor.firstName} ${visitor.lastName}`,
    dateOfBirth: visitor.dateOfBirth,
    adult: visitor.dateOfBirth ? isAdult(visitor.dateOfBirth) : true,
    relationshipDescription: visitor.relationshipDescription,
    address: getAddressToDisplay(visitor.addresses),
    restrictions: getRestrictionsToDisplay(visitor.restrictions),
    banned: getBanStatus(visitor.restrictions).isBanned,
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

export const getBanStatus = (restrictions: Restriction[]): { isBanned: boolean; numDays?: number } => {
  const banned = restrictions.filter(restriction => restriction.restrictionType === 'BAN')
  let isBanned = false
  let numDays = 0
  let counter = 0
  banned.forEach(restriction => {
    if (restriction.expiryDate) {
      counter = differenceInDays(new Date(restriction.expiryDate), new Date()) + 1

      if (counter > numDays && counter >= 1) {
        numDays = counter
      }

      if (numDays >= 29) {
        isBanned = true
        return { isBanned, numDays }
      }
    } else {
      isBanned = true
      numDays = undefined
      return { isBanned, numDays }
    }
  })
  return { isBanned, numDays }
}
