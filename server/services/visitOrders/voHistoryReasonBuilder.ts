import { VisitOrderHistoryDto } from '../../data/orchestrationApiTypes'

export default ({ visitOrderHistory }: { visitOrderHistory: VisitOrderHistoryDto }): string => {
  switch (visitOrderHistory.visitOrderHistoryType) {
    case 'VO_ALLOCATION': {
      // FIXME these 'find()'s are not safe as could return undefined
      const incentiveLevelAttribute = visitOrderHistory.attributes.find(
        attribute => attribute.attributeType === 'INCENTIVE_LEVEL',
      )
      return `VO allocation (${incentiveLevelAttribute.attributeValue} incentive level)`
    }
    case 'PVO_ALLOCATION': {
      const incentiveLevelAttribute = visitOrderHistory.attributes.find(
        attribute => attribute.attributeType === 'INCENTIVE_LEVEL',
      )
      return `PVO allocation (${incentiveLevelAttribute.attributeValue} incentive level)`
    }

    case 'VO_AND_PVO_ALLOCATION': {
      const incentiveLevelAttribute = visitOrderHistory.attributes.find(
        attribute => attribute.attributeType === 'INCENTIVE_LEVEL',
      )
      return `VO and PVO allocation (${incentiveLevelAttribute.attributeValue} incentive level)`
    }

    case 'VO_EXPIRATION':
      return 'VO expired'

    case 'PVO_EXPIRATION':
      return 'PVO expired'

    case 'VO_AND_PVO_EXPIRATION':
      return 'VO and PVO expired'

    case 'MIGRATION':
      return `Balance transferred from previous prison by ${visitOrderHistory.userName}`

    case 'ALLOCATION_USED_BY_VISIT': {
      const visitReferenceAttribute = visitOrderHistory.attributes.find(
        attribute => attribute.attributeType === 'VISIT_REFERENCE',
      )
      return `<a href="/visit/${visitReferenceAttribute.attributeValue}">Visit ${visitReferenceAttribute.attributeValue}</a> booked for X visit date`
    } // TODO - get visit date

    case 'ALLOCATION_REFUNDED_BY_VISIT_CANCELLED': {
      const visitReferenceAttribute = visitOrderHistory.attributes.find(
        attribute => attribute.attributeType === 'VISIT_REFERENCE',
      )
      return `<a href="/visit/${visitReferenceAttribute.attributeValue}">Visit ${visitReferenceAttribute.attributeValue}</a> cancelled for X visit date`
    } // TODO - get visit date

    case 'ADMIN_RESET_NEGATIVE_BALANCE':
      return 'Admin reset' // TODO? content

    case 'SYNC_FROM_NOMIS':
      return 'Sync from NOMIS' // TODO? content

    case 'PRISONER_BALANCE_RESET':
      return 'Prisoner balance reset' // TODO? content

    case 'VO_ACCUMULATION':
      return 'VO accumulation' // TODO? content

    case 'ALLOCATION_ADDED_AFTER_PRISONER_MERGE':
      return 'Allocation added after prisoner merge' // TODO? content

    // TODO - Missing type for manual adjustment (see 12/8/25 in design screen 3)

    default:
      return 'Unknown'
  }
}
