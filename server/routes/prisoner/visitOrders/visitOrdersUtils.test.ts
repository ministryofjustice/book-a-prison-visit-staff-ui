import { FieldValidationError } from 'express-validator'
import { apiValidationErrorToFieldValidationError, transformErrorCodesToMessage } from './visitOrdersUtils'
import { PrisonerBalanceAdjustmentValidationError } from '../../../data/orchestrationApiTypes'
import { PVO_MAX, VO_MAX } from '../../../constants/visitOrders'
import TestData from '../../testutils/testData'

describe('visitOrdersUtils', () => {
  describe('apiValidationErrorToFieldValidationError', () => {
    it.each([
      ['VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX', 'addVoAmount'],
      ['VO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO', 'removeVoAmount'],
      ['PVO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX', 'addPvoAmount'],
      ['PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO', 'removePvoAmount'],
      ['VO_OR_PVO_NOT_SUPPLIED', ''],
    ])(
      'transforms API validation error code %s to field validation error with path "%s"',
      (validationError: PrisonerBalanceAdjustmentValidationError, expectedPath: string) => {
        const result = apiValidationErrorToFieldValidationError(validationError)

        expect(result.path).toBe(expectedPath)
        expect(result).toStrictEqual<FieldValidationError>({
          type: 'field',
          location: 'body',
          path: expectedPath,
          msg: validationError,
        })
      },
    )
  })

  describe('transformErrorCodesToMessage', () => {
    it.each([
      [
        'VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX',
        { voBalance: VO_MAX, pvoBalance: 0 },
        `The VO limit is ${VO_MAX}. You cannot add a VO.`,
        'addVoAmount',
      ],

      [
        'VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX',
        { voBalance: VO_MAX - 1, pvoBalance: 0 },
        `The VO limit is ${VO_MAX}. You can add a maximum of 1 VO.`,
        'addVoAmount',
      ],

      [
        'VO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO',
        { voBalance: 0, pvoBalance: 0 },
        'The VO balance cannot go below 0. You cannot remove a VO.',
        'removeVoAmount',
      ],

      [
        'VO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO',
        { voBalance: 2, pvoBalance: 0 },
        'The VO balance cannot go below 0. You can remove a maximum of 2 VOs.',
        'removeVoAmount',
      ],

      [
        'PVO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX',
        { voBalance: 0, pvoBalance: PVO_MAX },
        `The PVO limit is ${PVO_MAX}. You cannot add a PVO.`,
        'addPvoAmount',
      ],

      [
        'PVO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX',
        { voBalance: 0, pvoBalance: PVO_MAX - 3 },
        `The PVO limit is ${PVO_MAX}. You can add a maximum of 3 PVOs.`,
        'addPvoAmount',
      ],

      [
        'PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO',
        { voBalance: 0, pvoBalance: 0 },
        'The PVO balance cannot go below 0. You cannot remove a PVO.',
        'removePvoAmount',
      ],

      [
        'PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO',
        { voBalance: 0, pvoBalance: 1 },
        'The PVO balance cannot go below 0. You can remove a maximum of 1 PVO.',
        'removePvoAmount',
      ],

      ['VO_OR_PVO_NOT_SUPPLIED', { voBalance: 0, pvoBalance: 0 }, 'Enter a number.', ''],

      [
        'other validation error - should not be changed',
        { voBalance: 0, pvoBalance: 0 },
        'other validation error - should not be changed',
        'path',
      ],
    ])(
      'transforms %s (%s) to user-friendly message',
      (
        validationError: PrisonerBalanceAdjustmentValidationError,
        balances: { voBalance: number; pvoBalance: number },
        expectedMessage: string,
        expectedPath: string,
      ) => {
        const fieldValidationError: FieldValidationError = {
          type: 'field',
          location: 'body',
          path: expectedPath,
          msg: validationError,
        }
        const result = transformErrorCodesToMessage(fieldValidationError, TestData.prisonerVoBalance({ ...balances }))

        expect(result.path).toStrictEqual(expectedPath)
        expect(result.msg).toStrictEqual(expectedMessage)
      },
    )
  })
})
