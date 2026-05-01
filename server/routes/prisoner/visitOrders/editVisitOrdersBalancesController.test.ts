import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { FieldValidationError } from 'express-validator'
import { InternalServerError } from 'http-errors'
import { appWithAllRoutes, FlashData, flashProvider } from '../../testutils/appSetup'
import { createMockAuditService, createMockVisitOrdersService } from '../../../services/testutils/mocks'
import TestData from '../../testutils/testData'
import { PVO_MAX, VO_MAX } from '../../../constants/visitOrders'
import { PrisonerBalanceAdjustmentValidationErrorResponse } from '../../../data/orchestrationApiTypes'
import { SanitisedError } from '../../../sanitisedError'

let app: Express
let flashData: FlashData

const auditService = createMockAuditService()
const visitOrdersService = createMockVisitOrdersService()

const prisonerVoBalance = TestData.prisonerVoBalance()
const { prisonerId } = prisonerVoBalance

const url = `/prisoner/${prisonerId}/edit-visiting-orders-balances`

beforeEach(() => {
  flashData = { errors: [], formValues: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  visitOrdersService.getVoBalance.mockResolvedValue(prisonerVoBalance)

  app = appWithAllRoutes({ services: { auditService, visitOrdersService } })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Edit visit order balances', () => {
  describe(`GET ${url}`, () => {
    it('should render edit visiting orders balances page', () => {
      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Edit visiting orders balances -/)
          expect($('.govuk-breadcrumbs li').length).toBe(0)
          expect($('.govuk-back-link').attr('href')).toBe(`/prisoner/${prisonerId}#visiting-orders`)
          expect($('h1').text().trim()).toBe('Edit visiting orders balances')

          // Prisoner and balance details
          expect($('[data-test=prisoner-name]').text()).toBe('John Smith')
          expect($('[data-test=vo-balance]').text()).toBe('5')
          expect($('[data-test=pvo-balance]').text()).toBe('2')

          // Form
          expect($('form').attr('action')).toBe(url)
          expect($('input[name=voChange]').length).toBe(3)
          expect($('input[name=voChange][checked]').val()).toBe('NO_CHANGE')
          expect($('input[name=pvoChange]').length).toBe(3)
          expect($('input[name=pvoChange][checked]').val()).toBe('NO_CHANGE')
          expect($('input[name=reason]').length).toBe(5)
          expect($('input[name=reason][checked]').length).toBe(0)
          expect($('[data-test=edit-balance]').text().trim()).toBe('Edit balance')

          expect(visitOrdersService.getVoBalance).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
            prisonerId,
          })
        })
    })

    it('should render transformed validation errors and pre-populate the form', () => {
      const addVoAmountValidationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'addVoAmount',
        value: '10',
        msg: 'VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX', // Simulate API validation error code
      }
      const expectedAddVoAmountMessage = 'The VO limit is 26. You can add a maximum of 21 VOs.'

      const reasonValidationError: FieldValidationError = {
        type: 'field',
        location: 'body',
        path: 'reason',
        value: '',
        msg: 'Select a reason.',
      }
      flashData.errors = [addVoAmountValidationError, reasonValidationError]
      flashData.formValues = [
        { voChange: 'ADD', addVoAmount: '10', pvoChange: 'REMOVE', removePvoAmount: '1', reason: '' },
      ]

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)

          // Errors
          expect($('.govuk-error-summary a[href=#addVoAmount-error]').text()).toBe(expectedAddVoAmountMessage)
          expect($('#addVoAmount-error').text()).toContain(expectedAddVoAmountMessage)
          expect($('input[name=addVoAmount]').val()).toBe(addVoAmountValidationError.value)
          expect($('.govuk-error-summary a[href=#reason-error]').text()).toBe(reasonValidationError.msg)
          expect($('#reason-error').text()).toContain(reasonValidationError.msg)
          expect($('input[name=reason]').prop('checked')).toBe(false)

          // Pre-populated form values
          expect($('input[name=voChange][checked]').val()).toBe('ADD')
          expect($('input[name=addVoAmount]').val()).toBe('10')
          expect($('input[name=pvoChange][checked]').val()).toBe('REMOVE')
          expect($('input[name=removePvoAmount]').val()).toBe('1')
        })
    })

    it('should render 400 Bad Request error for invalid prisoner number', () => {
      return request(app).get('/prisoner/A12--34BC/edit-visiting-orders-balances').expect(400)
    })
  })

  describe(`POST ${url}`, () => {
    it('should send VO/PVO balance adjustment, audit and redirect to profile page', () => {
      const prisonerBalanceAdjustmentDto = TestData.prisonerBalanceAdjustmentDto({ voAmount: 1, pvoAmount: -2 })

      return request(app)
        .post(url)
        .send({
          voChange: 'ADD',
          addVoAmount: '1',
          pvoChange: 'REMOVE',
          removePvoAmount: '2',
          reason: 'GOVERNOR_ADJUSTMENT',
          governorAdjustmentDetails: 'adjustment reason',
        })
        .expect(302)
        .expect('Location', `/prisoner/${prisonerId}#visiting-orders`)
        .expect(() => {
          expect(visitOrdersService.changeVoBalance).toHaveBeenCalledWith({
            username: 'user1',
            prisonId: 'HEI',
            prisonerId,
            prisonerBalanceAdjustmentDto,
          })

          expect(auditService.adjustedVisitBalance).toHaveBeenCalledWith({
            prisonerId,
            voChange: 1,
            pvoChange: -2,
            reason: 'GOVERNOR_ADJUSTMENT',
            reasonDetails: 'adjustment reason',
            username: 'user1',
            operationId: undefined,
          })
          expect(flashProvider).not.toHaveBeenCalled()
        })
    })
    // Check validations (form fields and API 422 triggered), flash data setting and redirect

    describe('form validation errors', () => {
      it('should handle no data entered for selected action', () => {
        return request(app)
          .post(url)
          .send({ voChange: 'ADD', pvoChange: 'REMOVE' })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(visitOrdersService.changeVoBalance).not.toHaveBeenCalled()
            expect(auditService.adjustedVisitBalance).not.toHaveBeenCalled()

            expect(flashProvider).toHaveBeenCalledWith('errors', [
              { location: 'body', msg: 'Enter a number.', path: 'addVoAmount', type: 'field', value: NaN },
              { location: 'body', msg: 'Enter a number.', path: 'removePvoAmount', type: 'field', value: NaN },
              { location: 'body', msg: 'Select a reason.', path: 'reason', type: 'field', value: undefined },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              voChange: 'ADD',
              addVoAmount: NaN,
              removeVoAmount: NaN,
              pvoChange: 'REMOVE',
              addPvoAmount: NaN,
              removePvoAmount: NaN,
            })
          })
      })

      it('should handle adding - below minimum', () => {
        return request(app)
          .post(url)
          .send({
            voChange: 'ADD',
            addVoAmount: '0',
            pvoChange: 'ADD',
            addPvoAmount: '-1',
            reason: 'CORRECTIVE_ACTION',
          })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(visitOrdersService.changeVoBalance).not.toHaveBeenCalled()
            expect(auditService.adjustedVisitBalance).not.toHaveBeenCalled()

            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'Enter a number greater than zero.',
                path: 'addVoAmount',
                type: 'field',
                value: 0,
              },
              {
                location: 'body',
                msg: 'Enter a number greater than zero.',
                path: 'addPvoAmount',
                type: 'field',
                value: -1,
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              voChange: 'ADD',
              addVoAmount: 0,
              removeVoAmount: NaN,
              pvoChange: 'ADD',
              addPvoAmount: -1,
              removePvoAmount: NaN,
              reason: 'CORRECTIVE_ACTION',
            })
          })
      })

      it('should handle adding - above maximum', () => {
        const addVoAmount = VO_MAX + 1
        const addPvoAmount = PVO_MAX + 1

        return request(app)
          .post(url)
          .send({
            voChange: 'ADD',
            addVoAmount: addVoAmount.toString(),
            pvoChange: 'ADD',
            addPvoAmount: addPvoAmount.toString(),
            reason: 'CORRECTIVE_ACTION',
          })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(visitOrdersService.changeVoBalance).not.toHaveBeenCalled()
            expect(auditService.adjustedVisitBalance).not.toHaveBeenCalled()

            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX',
                path: 'addVoAmount',
                type: 'field',
                value: addVoAmount,
              },
              {
                location: 'body',
                msg: 'PVO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX',
                path: 'addPvoAmount',
                type: 'field',
                value: addPvoAmount,
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              voChange: 'ADD',
              addVoAmount,
              removeVoAmount: NaN,
              pvoChange: 'ADD',
              addPvoAmount,
              removePvoAmount: NaN,
              reason: 'CORRECTIVE_ACTION',
            })
          })
      })

      it('should handle removing - below minimum', () => {
        return request(app)
          .post(url)
          .send({
            voChange: 'REMOVE',
            removeVoAmount: '0',
            pvoChange: 'REMOVE',
            removePvoAmount: '-1',
            reason: 'CORRECTIVE_ACTION',
          })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(visitOrdersService.changeVoBalance).not.toHaveBeenCalled()
            expect(auditService.adjustedVisitBalance).not.toHaveBeenCalled()

            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'Enter a number greater than zero.',
                path: 'removeVoAmount',
                type: 'field',
                value: 0,
              },
              {
                location: 'body',
                msg: 'Enter a number greater than zero.',
                path: 'removePvoAmount',
                type: 'field',
                value: -1,
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              voChange: 'REMOVE',
              addVoAmount: NaN,
              removeVoAmount: 0,
              pvoChange: 'REMOVE',
              addPvoAmount: NaN,
              removePvoAmount: -1,
              reason: 'CORRECTIVE_ACTION',
            })
          })
      })

      it('should handle removing - above maximum', () => {
        const removeVoAmount = VO_MAX + 1
        const removePvoAmount = PVO_MAX + 1

        return request(app)
          .post(url)
          .send({
            voChange: 'REMOVE',
            removeVoAmount: removeVoAmount.toString(),
            pvoChange: 'REMOVE',
            removePvoAmount: removePvoAmount.toString(),
            reason: 'CORRECTIVE_ACTION',
          })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(visitOrdersService.changeVoBalance).not.toHaveBeenCalled()
            expect(auditService.adjustedVisitBalance).not.toHaveBeenCalled()

            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'VO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO',
                path: 'removeVoAmount',
                type: 'field',
                value: removeVoAmount,
              },
              {
                location: 'body',
                msg: 'PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO',
                path: 'removePvoAmount',
                type: 'field',
                value: removePvoAmount,
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              voChange: 'REMOVE',
              addVoAmount: NaN,
              removeVoAmount,
              pvoChange: 'REMOVE',
              addPvoAmount: NaN,
              removePvoAmount,
              reason: 'CORRECTIVE_ACTION',
            })
          })
      })

      it('should handle at least one change required', () => {
        return request(app)
          .post(url)
          .send({
            voChange: 'NO_CHANGE',
            pvoChange: 'NO_CHANGE',
            reason: 'CORRECTIVE_ACTION',
          })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(visitOrdersService.changeVoBalance).not.toHaveBeenCalled()
            expect(auditService.adjustedVisitBalance).not.toHaveBeenCalled()

            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'Select at least one balance to change.',
                path: 'voChange',
                type: 'field',
                value: 'NO_CHANGE',
              },
              {
                location: 'body',
                msg: 'Select at least one balance to change.',
                path: 'pvoChange',
                type: 'field',
                value: 'NO_CHANGE',
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              voChange: 'NO_CHANGE',
              addVoAmount: NaN,
              removeVoAmount: NaN,
              pvoChange: 'NO_CHANGE',
              addPvoAmount: NaN,
              removePvoAmount: NaN,
              reason: 'CORRECTIVE_ACTION',
            })
          })
      })

      it('should handle invalid text input', () => {
        const invalidTextInput = 'some invalid text <🙂>'

        return request(app)
          .post(url)
          .send({
            voChange: 'ADD',
            addVoAmount: '1',
            pvoChange: 'NO_CHANGE',
            reason: 'OTHER',
            otherDetails: invalidTextInput,
          })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(visitOrdersService.changeVoBalance).not.toHaveBeenCalled()
            expect(auditService.adjustedVisitBalance).not.toHaveBeenCalled()

            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'Reason must only include letters, numbers and special characters such as hyphens, apostrophes and brackets.',
                path: 'otherDetails',
                type: 'field',
                value: invalidTextInput,
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              voChange: 'ADD',
              addVoAmount: 1,
              removeVoAmount: NaN,
              pvoChange: 'NO_CHANGE',
              addPvoAmount: NaN,
              removePvoAmount: NaN,
              reason: 'OTHER',
              otherDetails: invalidTextInput,
            })
          })
      })
    })

    describe('API validation errors', () => {
      it('should handle API 422 validation errors', () => {
        const error: SanitisedError<PrisonerBalanceAdjustmentValidationErrorResponse> = {
          name: 'Error',
          status: 422,
          message: 'Unprocessable Entity',
          stack: 'Error: Unprocessable Entity',
          data: {
            status: 422,
            validationErrors: ['VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX', 'PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO'],
          },
        }

        visitOrdersService.changeVoBalance.mockRejectedValue(error)

        return request(app)
          .post(url)
          .send({
            voChange: 'ADD',
            addVoAmount: '10',
            pvoChange: 'REMOVE',
            removePvoAmount: '5',
            reason: 'OTHER',
            otherDetails: 'other reason',
          })
          .expect(302)
          .expect('Location', url)
          .expect(() => {
            expect(visitOrdersService.changeVoBalance).toHaveBeenCalled()

            expect(flashProvider).toHaveBeenCalledWith('errors', [
              {
                location: 'body',
                msg: 'VO_TOTAL_POST_ADJUSTMENT_ABOVE_MAX',
                path: 'addVoAmount',
                type: 'field',
              },
              {
                location: 'body',
                msg: 'PVO_TOTAL_POST_ADJUSTMENT_BELOW_ZERO',
                path: 'removePvoAmount',
                type: 'field',
              },
            ])
            expect(flashProvider).toHaveBeenCalledWith('formValues', {
              voChange: 'ADD',
              addVoAmount: 10,
              removeVoAmount: NaN,
              pvoChange: 'REMOVE',
              addPvoAmount: NaN,
              removePvoAmount: 5,
              reason: 'OTHER',
              otherDetails: 'other reason',
            })
          })
      })

      it('should throw for non-422 API errors', () => {
        visitOrdersService.changeVoBalance.mockRejectedValue(new InternalServerError())

        return request(app)
          .post(url)
          .send({
            voChange: 'ADD',
            addVoAmount: '10',
            pvoChange: 'REMOVE',
            removePvoAmount: '5',
            reason: 'OTHER',
            otherDetails: 'other reason',
          })
          .expect(500)
      })
    })
  })
})
