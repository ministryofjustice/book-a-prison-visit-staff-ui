import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { VisitorListItem } from '../../@types/bapv'
import { getFlashFormValues } from '../visitorUtils'

export default class MainContact {
  constructor(private readonly mode: string) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'updateVisitSessionData' : 'visitSessionData']
    const formValues = getFlashFormValues(req)

    if (!Object.keys(formValues).length && sessionData.mainContact) {
      formValues.contact = sessionData.mainContact.contact
        ? sessionData.mainContact.contact.personId.toString()
        : 'someoneElse'
      formValues.phoneNumber = sessionData.mainContact.phoneNumber
      formValues.someoneElseName = sessionData.mainContact.contact ? undefined : sessionData.mainContact.contactName
    }

    res.render(`pages/${isUpdate ? 'visit' : 'bookAVisit'}/mainContact`, {
      errors: req.flash('errors'),
      adultVisitors: req.session.adultVisitors?.adults,
      formValues,
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'updateVisitSessionData' : 'visitSessionData']
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      req.flash('formValues', req.body)
      return res.redirect(req.originalUrl)
    }

    const selectedContact = req.session.visitorList.visitors.find(
      (visitor: VisitorListItem) => req.body.contact === visitor.personId.toString(),
    )

    sessionData.mainContact = {
      contact: selectedContact,
      phoneNumber: req.body.phoneNumber,
      contactName: selectedContact === undefined ? req.body.someoneElseName : undefined,
    }

    const urlPrefix = isUpdate ? `/visit/${sessionData.visitReference}/update` : '/book-a-visit'

    return res.redirect(`${urlPrefix}/check-your-booking`)
  }

  validate(): ValidationChain[] {
    return [
      body('contact').custom((value: string) => {
        if (!value) {
          throw new Error('No main contact selected')
        }

        return true
      }),
      body('someoneElseName').custom((value: string, { req }) => {
        if (value === '' && req.body.contact === 'someoneElse') {
          throw new Error('Enter the name of the main contact')
        }

        return true
      }),
      body('phoneNumber').custom((value: string) => {
        if (!value) {
          throw new Error('Enter a phone number')
        }

        if (!/^(?:0|\+?44)(?:\d\s?){9,10}$/.test(value)) {
          throw new Error('Enter a valid UK phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192')
        }

        return true
      }),
    ]
  }
}
