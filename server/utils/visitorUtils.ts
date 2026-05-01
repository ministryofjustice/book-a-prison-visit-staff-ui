import { differenceInDays } from 'date-fns'
import { VisitorListItem } from '../@types/bapv'
import { Address, Contact, Restriction } from '../data/prisonerContactRegistryApiTypes'
import { isAdult } from './utils'

type BanStatus = { isBanned: boolean; numDays?: number }

export const buildVisitorListItem = (visitor: Contact, policyNoticeDaysMax: number): VisitorListItem => {
  return {
    personId: visitor.personId,
    name: `${visitor.firstName} ${visitor.lastName}`,
    dateOfBirth: visitor.dateOfBirth,
    adult: visitor.dateOfBirth ? isAdult(visitor.dateOfBirth) : true,
    relationshipDescription: visitor.relationshipDescription,
    address: getFormattedAddress(visitor.address),
    restrictions: visitor.restrictions,
    banned: getBanStatus(visitor.restrictions, policyNoticeDaysMax).isBanned,
  }
}

export const getFormattedAddress = (address: Address): string => {
  const flat = address?.flat && `Flat ${address.flat}`
  const formattedAddress = [
    address?.premise,
    flat,
    address?.street,
    address?.locality,
    address?.town,
    address?.county,
    address?.postalCode,
    address?.country,
  ]
    .filter(value => value)
    .join(',\n')

  return formattedAddress || 'Not entered'
}

export const getBanStatus = (restrictions: Restriction[], policyNoticeDaysMax: number): BanStatus => {
  const banned = restrictions.filter(restriction => restriction.restrictionType === 'BAN')

  if (banned.length === 0) {
    return { isBanned: false }
  }
  // if there is a ban with no end date no further checks needed
  if (banned.find(ban => !ban.expiryDate)) {
    return { isBanned: true }
  }

  // determine ban status:
  //   numDays = when longest ban expires
  //   isBanned = if ban expires within max booking window
  return banned.reduce<BanStatus>(
    (acc, { expiryDate }) => {
      const banExpiresInDays = differenceInDays(new Date(expiryDate), new Date()) + 1
      acc.numDays = Math.max(banExpiresInDays, acc.numDays ?? 0)
      acc.isBanned = acc.numDays > policyNoticeDaysMax
      return acc
    },
    { isBanned: undefined },
  )
}
