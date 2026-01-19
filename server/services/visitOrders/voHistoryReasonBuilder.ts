import {
  PrisonerBalanceAdjustmentReason,
  VisitOrderHistoryAttributeType,
  VisitOrderHistoryDto,
} from '../../data/orchestrationApiTypes'
import ViewUtils from '../../utils/viewUtils'

export default ({ visitOrderHistoryType, comment, userName, attributes }: VisitOrderHistoryDto): string => {
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

    case 'MANUAL_PRISONER_BALANCE_ADJUSTMENT':
      return getManualAdjustmentReason(attributes, comment, userName)

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
): string | undefined => {
  return attributes.find(attributePair => attributePair.attributeType === attributeType)?.attributeValue
}

const getIncentiveLevel = (attributes: VisitOrderHistoryDto['attributes']): string | undefined => {
  return getAttributeValue(attributes, 'INCENTIVE_LEVEL')?.toLocaleLowerCase()
}

const getManualAdjustmentReason = (
  attributes: VisitOrderHistoryDto['attributes'],
  comment: string,
  userName: string,
): string | undefined => {
  const adjustmentReason = getAttributeValue(attributes, 'ADJUSTMENT_REASON_TYPE') as
    | PrisonerBalanceAdjustmentReason
    | undefined

  switch (adjustmentReason) {
    case 'GOVERNOR_ADJUSTMENT':
      return typeof comment === 'string'
        ? `Governor’s adjustment by ${userName}<br><br>${ViewUtils.escape(comment)}`
        : `Governor’s adjustment by ${userName}`

    case 'BALANCE_TRANSFER_FROM_PREVIOUS_PRISON':
      return `Balance transferred from previous establishment by ${userName}`

    case 'CORRECTIVE_ACTION':
      return `Inaccurate balance corrected by ${userName}`

    case 'EXCHANGE_FOR_PIN_PHONE_CREDIT':
      return `Exchange for PIN phone credit by ${userName}`

    case 'OTHER':
      return `${ViewUtils.escape(comment)}<br><br>${userName}`

    default: {
      const unhandledCase: never = adjustmentReason
      return unhandledCase
    }
  }
}
