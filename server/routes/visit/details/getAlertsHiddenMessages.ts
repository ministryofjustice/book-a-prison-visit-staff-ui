import type { GOVUKInsetText, TextOrHtml } from '../../../@types/bapv'
import type { VisitBookingDetails } from '../../../data/orchestrationApiTypes'
import config from '../../../config'

export default ({
  skipAlertsAndRestrictionReason,
  prisonerNumber,
}: {
  skipAlertsAndRestrictionReason: VisitBookingDetails['skipAlertsAndRestrictionReason']
  prisonerNumber: string
}): { prisoner: GOVUKInsetText; visitor: GOVUKInsetText } | null => {
  if (!skipAlertsAndRestrictionReason) {
    return null
  }

  let prisonerTextOrHtml: TextOrHtml
  let visitorTextOrHtml: TextOrHtml

  switch (skipAlertsAndRestrictionReason) {
    case 'VISIT_IN_PAST':
      prisonerTextOrHtml = {
        html: `Alerts and restrictions are not shown for past visits.<br>You can view alerts and restrictions in the <a href="${config.dpsContacts}/prisoner/${prisonerNumber}/alerts-restrictions">contacts service</a>.`,
      }
      visitorTextOrHtml = {
        html: `Visitor restrictions are not shown for past visits.<br>You can view restrictions in the <a href="${config.dpsContacts}/prisoner/${prisonerNumber}/contacts/list">contacts service</a>.`,
      }
      break

    case 'PRISONER_RELEASED':
      prisonerTextOrHtml = {
        text: 'Alerts and restrictions are not shown for released prisoners.',
      }
      visitorTextOrHtml = {
        text: 'Visitor restrictions are not shown for released prisoners.',
      }
      break

    case 'PRISONER_TRANSFERRED':
      prisonerTextOrHtml = {
        text: 'Alerts and restrictions are not shown for transferred prisoners.',
      }
      visitorTextOrHtml = {
        text: 'Visitor restrictions are not shown for transferred prisoners.',
      }
      break

    default:
      return null
  }

  return {
    prisoner: {
      ...prisonerTextOrHtml,
      attributes: { 'data-test': 'prisoner-inset' },
      classes: 'govuk-!-margin-bottom-1',
    },
    visitor: {
      ...visitorTextOrHtml,
      attributes: { 'data-test': 'visitor-inset' },
    },
  }
}
