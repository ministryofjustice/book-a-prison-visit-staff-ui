import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import requestMethods from '../../constants/requestMethod'
import { getFlashFormValues } from '../visitorUtils'
import getUrlPrefix from './visitJourneyUtils'

export default class RequestMethod {
  constructor(private readonly mode: string) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && visitSessionData.requestMethod) {
      formValues.method = visitSessionData.requestMethod
    }

    res.render('pages/requestMethod', {
      errors: req.flash('errors'),
      formValues,
      requestMethods,
      urlPrefix: getUrlPrefix(isUpdate, visitSessionData.visitReference),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      return res.redirect(req.originalUrl)
    }

    visitSessionData.requestMethod = req.body.method

    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.visitReference)
    return res.redirect(`${urlPrefix}/check-your-booking`)
  }

  validate(): ValidationChain[] {
    return [body('method').isIn(Object.keys(requestMethods)).withMessage('No request method selected')]
  }
}
