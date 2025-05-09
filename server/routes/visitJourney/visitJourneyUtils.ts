import { format } from 'date-fns'
import { ApplicationValidationErrorResponse } from '../../data/orchestrationApiTypes'
import { prisonerTimePretty } from '../../utils/utils'
import { MoJAlert } from '../../@types/bapv'

// return URL prefix for either visit booking or visit update journey
export const getUrlPrefix = (isUpdate: boolean) => {
  return isUpdate ? '/update-a-visit' : '/book-a-visit'
}

export const validationErrorsMojAlert = (
  prisonerName: string,
  visitStartTimestamp: string,
  validationErrors: ApplicationValidationErrorResponse['validationErrors'],
): { mojAlert: MoJAlert; url: string } => {
  if (validationErrors.includes('APPLICATION_INVALID_NON_ASSOCIATION_VISITS')) {
    return {
      mojAlert: {
        title: `${prisonerName} now has a non-association on ${format(visitStartTimestamp, 'd MMMM')}.`,
        text: 'Select a new visit time.',
        variant: 'error',
        showTitleAsHeading: true,
      },
      url: `select-date-and-time`,
    }
  }
  if (validationErrors.includes('APPLICATION_INVALID_VISIT_ALREADY_BOOKED')) {
    return {
      mojAlert: {
        title: `${prisonerName} now has another visit at ${prisonerTimePretty(visitStartTimestamp)} on ${format(visitStartTimestamp, 'd MMMM')}.`,
        text: 'Select a new visit time.',
        variant: 'error',
        showTitleAsHeading: true,
      },
      url: `select-date-and-time`,
    }
  }
  if (validationErrors.includes('APPLICATION_INVALID_NO_SLOT_CAPACITY')) {
    return {
      mojAlert: {
        title: 'Another person has booked the last table.',
        text: 'Select whether to book for this time or choose a new visit time.',
        variant: 'warning',
        showTitleAsHeading: true,
      },
      url: `check-your-booking/overbooking`,
    }
  }

  return null
}
