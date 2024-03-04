import { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { getFlashFormValues } from '../visitorUtils'
import getUrlPrefix from './visitJourneyUtils'

export default class AdditionalSupport {
  constructor(private readonly mode: string) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const formValues = getFlashFormValues(req)

    if (!Object.keys(formValues).length && visitSessionData.visitorSupport) {
      if (visitSessionData.visitorSupport.description.length) {
        formValues.additionalSupportRequired = 'yes'
        formValues.additionalSupport = visitSessionData.visitorSupport.description
      } else {
        formValues.additionalSupportRequired = 'no'
      }
    }

    res.render('pages/bookAVisit/additionalSupport', {
      errors: req.flash('errors'),
      formValues,
      urlPrefix: getUrlPrefix(isUpdate, visitSessionData.visitReference),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const errors = validationResult(req)
    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.visitReference)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      req.flash('formValues', req.body)
      return res.redirect(`${urlPrefix}/additional-support`)
    }

    visitSessionData.visitorSupport =
      req.body.additionalSupportRequired === 'no'
        ? { description: '' }
        : { description: req.body.additionalSupport.toString() }

    return res.redirect(`${urlPrefix}/select-main-contact`)
  }

  validate(): ValidationChain[] {
    return [
      body('additionalSupportRequired').custom((value: string) => {
        if (!/^(yes|no)$/.test(value)) {
          throw new Error('No answer selected')
        }
        return true
      }),
      body('additionalSupport').custom((value: string, { req }) => {
        if (req.body.additionalSupportRequired === 'yes' && (value ?? '').length === 0) {
          throw new Error('Enter details of the request')
        }
        return true
      }),
    ]
  }
}
