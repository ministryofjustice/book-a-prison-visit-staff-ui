import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { VisitorListItem } from '../../@types/bapv'
import { getFlashFormValues } from '../visitorUtils'
import getUrlPrefix from './visitJourneyUtils'

export default class MainContact {
  constructor(private readonly mode: string) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const formValues = getFlashFormValues(req)

    if (!Object.keys(formValues).length && visitSessionData.mainContact) {
      formValues.contact = visitSessionData.mainContact.contact
        ? visitSessionData.mainContact.contact.personId.toString()
        : 'someoneElse'
      formValues.phoneNumber = visitSessionData.mainContact.phoneNumber
      formValues.someoneElseName = visitSessionData.mainContact.contact
        ? undefined
        : visitSessionData.mainContact.contactName
    }

    res.render('pages/bookAVisit/mainContact', {
      errors: req.flash('errors'),
      reference: visitSessionData.visitReference ?? '',
      adultVisitors: req.session.adultVisitors?.adults,
      formValues,
      urlPrefix: getUrlPrefix(isUpdate, visitSessionData.previousVisitReference),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      req.flash('formValues', req.body)
      return res.redirect(req.originalUrl)
    }

    const selectedContact = req.session.visitorList.visitors.find(
      (visitor: VisitorListItem) => req.body.contact === visitor.personId.toString(),
    )

    visitSessionData.mainContact = {
      contact: selectedContact,
      phoneNumber: req.body.phoneNumber,
      contactName: selectedContact === undefined ? req.body.someoneElseName : undefined,
    }

    const urlPrefix = getUrlPrefix(isUpdate, visitSessionData.previousVisitReference)
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
