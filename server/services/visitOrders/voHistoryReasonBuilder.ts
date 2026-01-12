import { VisitOrderHistoryDto } from '../../data/orchestrationApiTypes'

export default ({ visitOrderHistoryType, attributes }: VisitOrderHistoryDto): string => {
  switch (visitOrderHistoryType) {
    case 'MIGRATION':
      return visitOrderHistoryType

    case 'VO_ACCUMULATION':
      return visitOrderHistoryType

    case 'VO_ALLOCATION':
      return `VO allocation (${getIncentiveLevel(attributes)} incentive level)`

    case 'VO_AND_PVO_ALLOCATION':
      return `VO and PVO allocation (${getIncentiveLevel(attributes)} incentive level)`

    case 'PVO_ALLOCATION':
      return `PVO allocation (${getIncentiveLevel(attributes)} incentive level)`

    case 'VO_EXPIRATION':
      return 'VO expired'

    case 'VO_AND_PVO_EXPIRATION':
      return 'VO and PVO expired'

    case 'PVO_EXPIRATION':
      return 'PVO expired'

    case 'ALLOCATION_USED_BY_VISIT':
      return `<a href="/visit/${getVisitReference(attributes)}">Visit ${getVisitReference(attributes)}</a> booked`

    case 'ALLOCATION_REFUNDED_BY_VISIT_CANCELLED':
      return `<a href="/visit/${getVisitReference(attributes)}">Visit ${getVisitReference(attributes)}</a> cancelled`

    case 'PRISONER_BALANCE_RESET':
    case 'SYNC_FROM_NOMIS':
    case 'ALLOCATION_ADDED_AFTER_PRISONER_MERGE':
    case 'ADMIN_RESET_NEGATIVE_BALANCE':
      return visitOrderHistoryType

    default: {
      /// get TypeScript to catch any unhandled cases being added to API
      const unhandledCase: never = visitOrderHistoryType
      return unhandledCase
    }
  }
}

const getIncentiveLevel = (attributes: VisitOrderHistoryDto['attributes']): string => {
  return attributes
    .find(attributePair => attributePair.attributeType === 'INCENTIVE_LEVEL')
    ?.attributeValue.toLocaleLowerCase()
}

const getVisitReference = (attributes: VisitOrderHistoryDto['attributes']): string => {
  return attributes.find(attributePair => attributePair.attributeType === 'VISIT_REFERENCE')?.attributeValue
}
