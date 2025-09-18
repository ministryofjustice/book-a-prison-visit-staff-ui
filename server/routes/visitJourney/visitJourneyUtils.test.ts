import { getUrlPrefix, validationErrorsToMoJAlert } from './visitJourneyUtils'
import { ApplicationValidationErrorResponse } from '../../data/orchestrationApiTypes'

describe('getUrlPrefix', () => {
  it('should return the URL prefix for a booking journey page', () => {
    expect(getUrlPrefix(false)).toBe('/book-a-visit')
  })
  it('should return the URL prefix for an update journey page', () => {
    expect(getUrlPrefix(true)).toBe('/update-a-visit')
  })
})

describe('validationErrorToMoJAlert', () => {
  const prisonerName = 'Smith, John'
  const visitStartTimestamp = '2022-03-12T09:30:00'

  it('should return an MoJAlert for 422 error APPLICATION_INVALID_NON_ASSOCIATION_VISITS', () => {
    const validationErrors: ApplicationValidationErrorResponse['validationErrors'] = [
      'APPLICATION_INVALID_NON_ASSOCIATION_VISITS',
    ]

    const { mojAlert, url } = validationErrorsToMoJAlert(prisonerName, visitStartTimestamp, validationErrors)

    expect(mojAlert).toStrictEqual({
      text: 'Select a new visit time.',
      showTitleAsHeading: true,
      title: 'Smith, John now has a non-association on 12 March.',
      variant: 'error',
    })
    expect(url).toBe('select-date-and-time')
  })

  it('should return an MoJAlert for 422 error APPLICATION_INVALID_VISIT_ALREADY_BOOKED', () => {
    const validationErrors: ApplicationValidationErrorResponse['validationErrors'] = [
      'APPLICATION_INVALID_VISIT_ALREADY_BOOKED',
    ]

    const { mojAlert, url } = validationErrorsToMoJAlert(prisonerName, visitStartTimestamp, validationErrors)

    expect(mojAlert).toStrictEqual({
      text: 'Select a new visit time.',
      showTitleAsHeading: true,
      title: 'Smith, John now has another visit at 9:30am on 12 March.',
      variant: 'error',
    })
    expect(url).toBe('select-date-and-time')
  })

  it('should return an MoJAlert for 422 error APPLICATION_INVALID_NO_SLOT_CAPACITY', () => {
    const validationErrors: ApplicationValidationErrorResponse['validationErrors'] = [
      'APPLICATION_INVALID_NO_SLOT_CAPACITY',
    ]

    const { mojAlert, url } = validationErrorsToMoJAlert(prisonerName, visitStartTimestamp, validationErrors)

    expect(mojAlert).toStrictEqual({
      text: 'Select whether to book for this time or choose a new visit time.',
      showTitleAsHeading: true,
      title: 'Another person has booked the last table.',
      variant: 'warning',
    })
    expect(url).toBe('check-your-booking/overbooking')
  })

  it('should return an MoJAlert for 422 error APPLICATION_INVALID_VISIT_DATE_BLOCKED', () => {
    const validationErrors: ApplicationValidationErrorResponse['validationErrors'] = [
      'APPLICATION_INVALID_VISIT_DATE_BLOCKED',
    ]

    const { mojAlert, url } = validationErrorsToMoJAlert(prisonerName, visitStartTimestamp, validationErrors)

    expect(mojAlert).toStrictEqual({
      text: 'Select a new visit time.',
      showTitleAsHeading: true,
      title: 'This visit date has been blocked.',
      variant: 'error',
    })
    expect(url).toBe('select-date-and-time')
  })

  it('should return a single, prioritised MoJAlert for multiple 422 errors', () => {
    const validationErrors: ApplicationValidationErrorResponse['validationErrors'] = [
      'APPLICATION_INVALID_NO_SLOT_CAPACITY',
      'APPLICATION_INVALID_NON_ASSOCIATION_VISITS',
    ]

    const { mojAlert } = validationErrorsToMoJAlert(prisonerName, visitStartTimestamp, validationErrors)

    expect(mojAlert.title).toContain('non-association')
  })

  it('should return undefined for an unhandled 422 error code', () => {
    const validationErrors = [
      '*** UNHANDLED_ERROR***',
    ] as unknown as ApplicationValidationErrorResponse['validationErrors']

    expect(validationErrorsToMoJAlert(prisonerName, visitStartTimestamp, validationErrors)).toBeUndefined()
  })
})
