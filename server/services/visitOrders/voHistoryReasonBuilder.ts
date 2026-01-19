import { VisitOrderHistoryAttributeType, VisitOrderHistoryDto } from '../../data/orchestrationApiTypes'

export default ({ visitOrderHistoryType, attributes }: VisitOrderHistoryDto): string => {
  switch (visitOrderHistoryType) {
    case 'MIGRATION':
      return 'Balance migrated from NOMIS'

    case 'VO_ACCUMULATION':
      return 'Accumulated visiting orders'

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

    case 'ALLOCATION_USED_BY_VISIT': {
      const reference = getAttributeValue(attributes, 'VISIT_REFERENCE')
      return `<a href="/visit/${reference}">Visit ${reference}</a> booked`
    }

    case 'ALLOCATION_REFUNDED_BY_VISIT_CANCELLED': {
      const reference = getAttributeValue(attributes, 'VISIT_REFERENCE')
      return `<a href="/visit/${reference}">Visit ${reference}</a> cancelled`
    }

    case 'PRISONER_BALANCE_RESET':
      return 'Balance reset when prisoner received into prison'

    case 'SYNC_FROM_NOMIS':
      return 'Balance changed in NOMIS'

    case 'ALLOCATION_ADDED_AFTER_PRISONER_MERGE': {
      const oldPrisonerId = getAttributeValue(attributes, 'OLD_PRISONER_ID')
      const newPrisonerId = getAttributeValue(attributes, 'NEW_PRISONER_ID')
      return `Balance adjusted after merging records for ${oldPrisonerId} and ${newPrisonerId}`
    }

    case 'ADMIN_RESET_NEGATIVE_BALANCE':
      return 'Negative balance removed'

    default: {
      /// get TypeScript to catch any unhandled cases being added to API
      const unhandledCase: never = visitOrderHistoryType
      return unhandledCase
    }
  }
}

const getAttributeValue = (
  attributes: VisitOrderHistoryDto['attributes'],
  attributeType: VisitOrderHistoryAttributeType,
): string => {
  return attributes.find(attributePair => attributePair.attributeType === attributeType)?.attributeValue
}

const getIncentiveLevel = (attributes: VisitOrderHistoryDto['attributes']): string => {
  return getAttributeValue(attributes, 'INCENTIVE_LEVEL')?.toLocaleLowerCase()
}
