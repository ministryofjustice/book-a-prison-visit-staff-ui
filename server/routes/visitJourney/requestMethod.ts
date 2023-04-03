import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import getUrlPrefix from './visitJourneyUtils'

export default class RequestMethod {
  constructor(private readonly mode: string) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session

    const requestMethods = [
      { id: 'phone', value: 'Phone call' },
      { id: 'website', value: 'GOV.UK' },
      { id: 'email', value: 'Email' },
      { id: 'person', value: 'In person' },
    ]

    res.render('pages/requestMethod', {
      errors: req.flash('errors'),
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

    // visitSessionData.mainContact = {
    //   contact: selectedContact,
    //   phoneNumber: req.body.phoneNumber,
    //   contactName: selectedContact === undefined ? req.body.someoneElseName : undefined,
    // }
    visitSessionData.requestMethod = req.body.method

    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.visitReference)
    return res.redirect(`${urlPrefix}/check-your-booking`)
  }

  validate(): ValidationChain[] {
    return [
      body('method').custom((value: string) => {
        if (!/^(phone|website|email|person)$/.test(value)) {
          throw new Error('No request method selected')
        }
        return true
      }),
    ]
  }
}
