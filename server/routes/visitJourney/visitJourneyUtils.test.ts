import { getUrlPrefix, validationErrorsMojAlert } from './visitJourneyUtils'
import { ApplicationValidationErrorResponse } from '../../data/orchestrationApiTypes'

describe('getUrlPrefix', () => {
  it('should return the URL prefix for a booking journey page', () => {
    expect(getUrlPrefix(false, undefined)).toBe('/book-a-visit')
  })
  it('should return the URL prefix for an update journey page', () => {
    expect(getUrlPrefix(true, 'ab-cd-ef-gh')).toBe('/visit/ab-cd-ef-gh/update')
  })
})

describe('validationErrorsMojAlert', () => {
  const prisonerName = 'Smith, John'
  const visitStartTimestamp = '2022-03-12T09:30:00'

  it('should return a MojAlert item from 422 error `APPLICATION_INVALID_NON_ASSOCIATION_VISITS`', () => {
    const validationErrors: ApplicationValidationErrorResponse['validationErrors'] = [
      'APPLICATION_INVALID_NON_ASSOCIATION_VISITS',
    ]

    const { mojAlert, url } = validationErrorsMojAlert(prisonerName, visitStartTimestamp, validationErrors)

    expect(mojAlert).toStrictEqual({
      text: 'Select a new visit time.',
      showTitleAsHeading: true,
      title: 'Smith, John now has a non-association on 12 March.',
      variant: 'error',
    })
    expect(url).toBe('select-date-and-time')
  })

  it('should return a MojAlert item from 422 error `APPLICATION_INVALID_VISIT_ALREADY_BOOKED`', () => {
    const validationErrors: ApplicationValidationErrorResponse['validationErrors'] = [
      'APPLICATION_INVALID_VISIT_ALREADY_BOOKED',
    ]

    const { mojAlert, url } = validationErrorsMojAlert(prisonerName, visitStartTimestamp, validationErrors)

    expect(mojAlert).toStrictEqual({
      text: 'Select a new visit time.',
      showTitleAsHeading: true,
      title: 'Smith, John now has another visit at 9:30am on 12 March.',
      variant: 'error',
    })
    expect(url).toBe('select-date-and-time')
  })

  it('should return a MojAlert item from 422 error `APPLICATION_INVALID_NO_SLOT_CAPACITY`', () => {
    const validationErrors: ApplicationValidationErrorResponse['validationErrors'] = [
      'APPLICATION_INVALID_NO_SLOT_CAPACITY',
    ]

    const { mojAlert, url } = validationErrorsMojAlert(prisonerName, visitStartTimestamp, validationErrors)

    expect(mojAlert).toStrictEqual({
      text: 'Select whether to book for this time or choose a new visit time.',
      showTitleAsHeading: true,
      title: 'Another person has booked the last table.',
      variant: 'warning',
    })
    expect(url).toBe('check-your-booking/overbooking')
  })
})
