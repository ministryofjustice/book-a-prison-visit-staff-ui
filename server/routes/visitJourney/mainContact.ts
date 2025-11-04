import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { BookOrUpdate, VisitorListItem } from '../../@types/bapv'
import { getFlashFormValues } from '../visitorUtils'
import { getUrlPrefix } from './visitJourneyUtils'
import { VisitService } from '../../services'

export default class MainContact {
  constructor(
    private readonly mode: BookOrUpdate,
    private readonly visitService: VisitService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const formValues = getFlashFormValues(req)
    const { isEnabledForPublic } = req.session.selectedEstablishment

    if (!Object.keys(formValues).length && visitSessionData.mainContact) {
      formValues.contact = visitSessionData.mainContact.contactId
        ? visitSessionData.mainContact.contactId.toString()
        : 'someoneElse'
      formValues.phoneNumber = visitSessionData.mainContact.phoneNumber ? 'hasPhoneNumber' : 'noPhoneNumber'
      formValues.phoneNumberInput = visitSessionData.mainContact.phoneNumber
      formValues.someoneElseName = visitSessionData.mainContact.contactId
        ? undefined
        : visitSessionData.mainContact.contactName
      formValues.email = visitSessionData.mainContact.email ?? ''
    }
    res.render('pages/bookAVisit/mainContact', {
      errors: req.flash('errors'),
      reference: visitSessionData.visitReference ?? '',
      adultVisitors: req.session.adultVisitors?.adults,
      formValues,
      showEmailField: isEnabledForPublic,
      urlPrefix: getUrlPrefix(isUpdate),
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const errors = validationResult(req)

    const urlPrefix = getUrlPrefix(isUpdate)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      req.flash('formValues', req.body)
      return res.redirect(`${urlPrefix}/select-main-contact`)
    }

    const selectedContact = req.session.visitorList.visitors.find(
      (visitor: VisitorListItem) => req.body.contact === visitor.personId.toString(),
    )

    visitSessionData.mainContact = {
      contactId: selectedContact?.personId,
      relationshipDescription: selectedContact?.relationshipDescription,
      phoneNumber: req.body.phoneNumber === 'hasPhoneNumber' ? req.body.phoneNumberInput : undefined,
      email: req.body.email,
      contactName: selectedContact?.name ?? req.body.someoneElseName,
    }

    // update visit application to have the latest data
    await this.visitService.changeVisitApplication({
      username: res.locals.user.username,
      visitSessionData,
    })

    return res.redirect(`${urlPrefix}/request-method`)
  }

  validate(): ValidationChain[] {
    return [
      body('contact').custom((value: string) => {
        if (!value) {
          throw new Error('No main contact selected')
        }

        return true
      }),
      body('someoneElseName')
        .trim()
        .custom((value: string, { req }) => {
          if (value === '' && req.body.contact === 'someoneElse') {
            throw new Error('Enter the name of the main contact')
          }

          return true
        }),
      body('phoneNumber').isIn(['hasPhoneNumber', 'noPhoneNumber']).withMessage('No answer selected'),
      body('phoneNumberInput')
        .trim()
        .custom((value: string, { req }) => {
          if (req.body.phoneNumber === 'hasPhoneNumber') {
            if (value === '') {
              throw new Error('Enter a phone number')
            }
            if (!/^(?:0|\+?44)(?:\d\s?){9,10}$/.test(value)) {
              throw new Error('Enter a valid UK phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192')
            }
          }
          return true
        }),
      body('email', 'Enter a valid email address').trim().isEmail().optional({ values: 'falsy' }),
    ]
  }
}
