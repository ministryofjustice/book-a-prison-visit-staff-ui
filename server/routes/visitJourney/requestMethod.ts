import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { requestMethodsBooking } from '../../constants/requestMethods'
import { getFlashFormValues } from '../visitorUtils'
import { getUrlPrefix } from './visitJourneyUtils'

export default class RequestMethod {
  constructor(private readonly mode: string) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && visitSessionData.requestMethod) {
      formValues.method = visitSessionData.requestMethod
    }

    res.render('pages/bookAVisit/requestMethod', {
      errors: req.flash('errors'),
      formValues,
      requestMethodsBooking,
      urlPrefix: getUrlPrefix(isUpdate),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    const urlPrefix = getUrlPrefix(isUpdate)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(`${urlPrefix}/request-method`)
    }

    visitSessionData.requestMethod = req.body.method

    return res.redirect(`${urlPrefix}/check-your-booking`)
  }

  validate(): ValidationChain[] {
    return [body('method').isIn(Object.keys(requestMethodsBooking)).withMessage('No request method selected')]
  }
}
