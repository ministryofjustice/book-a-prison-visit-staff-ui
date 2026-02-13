import { FieldValidationError, ValidationError } from 'express-validator'
import { PrisonerBalanceAdjustmentValidationError, PrisonerBalanceDto } from '../../../data/orchestrationApiTypes'
import { pluralise } from '../../../utils/utils'
import { PVO_MAX, VO_MAX } from '../../../constants/visitOrders'

// Map API validation error codes to field validation errors for form handling
export const apiValidationErrorToFieldValidationError = (
  validationError: PrisonerBalanceAdjustmentValidationError,
): FieldValidationError => {
  const fieldValidationError: FieldValidationError = {
    type: 'field',
    location: 'body',
    path: '',
    msg: validationError,
  }

  switch (validationError) {
    case 'VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX':
      fieldValidationError.path = 'addVoAmount'
      break
    case 'VO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO':
      fieldValidationError.path = 'removeVoAmount'
      break

    case 'PVO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX':
      fieldValidationError.path = 'addPvoAmount'
      break
    case 'PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO':
      fieldValidationError.path = 'removePvoAmount'
      break

    case 'VO_OR_PVO_NOT_SUPPLIED':
      // Handle theoretical API return value (that should be caught by front-end validate())
      break

    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const unhandledCase: never = validationError
    }
  }

  return fieldValidationError
}

// Transform error codes into user-friendly messages
export const transformErrorCodesToMessage = <T extends ValidationError>(
  error: T,
  { voBalance, pvoBalance }: PrisonerBalanceDto,
): T => {
  if (error.type !== 'field') {
    return error
  }

  let { msg, path } = error

  switch (msg) {
    case 'VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX': {
      const addMax = VO_MAX - voBalance
      msg = `The VO limit is ${VO_MAX}. `
      msg += addMax > 0 ? `You can add a maximum of ${addMax} ${pluralise('VO', addMax)}.` : 'You cannot add a VO.'
      path = 'addVoAmount'
      break
    }

    case 'VO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO': {
      const removeMax = voBalance
      msg = 'The VO balance cannot go below 0. '
      msg +=
        removeMax > 0
          ? `You can remove a maximum of ${removeMax} ${pluralise('VO', removeMax)}.`
          : 'You cannot remove a VO.'
      path = 'removeVoAmount'
      break
    }

    case 'PVO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX': {
      const addMax = PVO_MAX - pvoBalance
      msg = `The PVO limit is ${PVO_MAX}. `
      msg += addMax > 0 ? `You can add a maximum of ${addMax} ${pluralise('PVO', addMax)}.` : 'You cannot add a PVO.'
      path = 'addPvoAmount'
      break
    }

    case 'PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO': {
      const removeMax = pvoBalance
      msg = 'The PVO balance cannot go below 0. '
      msg +=
        removeMax > 0
          ? `You can remove a maximum of ${removeMax} ${pluralise('PVO', removeMax)}.`
          : 'You cannot remove a PVO.'
      path = 'removePvoAmount'
      break
    }

    case 'VO_OR_PVO_NOT_SUPPLIED': {
      msg = 'Enter a number.'
      break
    }

    default:
      break
  }
  return { ...error, msg, path }
}
