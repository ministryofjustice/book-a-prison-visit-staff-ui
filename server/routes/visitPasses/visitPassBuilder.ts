import { differenceInYears, format, parseISO } from 'date-fns'
import { VisitPassDto, VisitPassVisitorDto } from '../../data/orchestrationApiTypes'
import { formatStartToEndTime, properCase, properCaseFullName } from '../../utils/utils'

export type VisitPass = {
  date: string
  time: string
  prisonerName: string
  prisonNumber: string
  reference: string
  type: string
  adults: { name: string; address: string }[]
  children: { name: string; dateOfBirth: string }[]
}

const CHILD_VISITOR_AGE_THRESHOLD = 16

export const buildVisitPass = (visitPass: VisitPassDto): VisitPass => {
  const date = format(parseISO(visitPass.visitDate), 'EEEE d MMMM yyyy')

  const type = properCase(visitPass.visitRestriction)

  const { adultVisitors, childVisitors } = splitAdultAndChildVisitors(visitPass.visitors)
  const adults = adultVisitors.map(visitor => ({
    name: properCaseFullName(`${visitor.firstName} ${visitor.lastName}`),
    address: formatVisitorAddress(visitor.address),
  }))
  const children = childVisitors.map(visitor => ({
    name: properCaseFullName(`${visitor.firstName} ${visitor.lastName}`),
    dateOfBirth: visitor.dateOfBirth,
  }))

  return {
    date,
    time: formatStartToEndTime(visitPass.startTime, visitPass.endTime),
    prisonerName: properCaseFullName(`${visitPass.prisonerFirstName} ${visitPass.prisonerLastName}`),
    prisonNumber: visitPass.prisonerId,
    reference: visitPass.reference,
    type,
    adults,
    children,
  }
}

const splitAdultAndChildVisitors = (
  visitors: VisitPassVisitorDto[],
): { adultVisitors: VisitPassVisitorDto[]; childVisitors: VisitPassVisitorDto[] } => {
  const now = new Date()

  return visitors.reduce(
    (acc, visitor) => {
      const dob = visitor.dateOfBirth ? parseISO(visitor.dateOfBirth) : null

      if (!dob || Number.isNaN(dob.getTime()) || differenceInYears(now, dob) >= CHILD_VISITOR_AGE_THRESHOLD) {
        acc.adultVisitors.push(visitor)
      } else {
        acc.childVisitors.push(visitor)
      }

      return acc
    },
    { adultVisitors: [], childVisitors: [] },
  )
}

const formatVisitorAddress = (address: VisitPassVisitorDto['address']): string => {
  return [address?.flat, address?.premise, address?.street, address?.town, address?.postalCode]
    .filter(value => value)
    .join(', ')
}
