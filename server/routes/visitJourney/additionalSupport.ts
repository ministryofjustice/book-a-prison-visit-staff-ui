import { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { SupportType, VisitorSupport } from '../../data/orchestrationApiTypes'
import VisitSessionsService from '../../services/visitSessionsService'
import { getFlashFormValues } from '../visitorUtils'
import getUrlPrefix from './visitJourneyUtils'

export default class AdditionalSupport {
  constructor(private readonly mode: string, private readonly visitSessionsService: VisitSessionsService) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const formValues = getFlashFormValues(req)

    if (!req.session.availableSupportTypes) {
      req.session.availableSupportTypes = await this.visitSessionsService.getAvailableSupportOptions(
        res.locals.user.username,
      )
    }
    const { availableSupportTypes } = req.session

    if (!Object.keys(formValues).length && visitSessionData.visitorSupport) {
      formValues.additionalSupportRequired = visitSessionData.visitorSupport.length ? 'yes' : 'no'
      formValues.additionalSupport = visitSessionData.visitorSupport.map(support => support.type)
      formValues.otherSupportDetails = visitSessionData.visitorSupport.find(support => support.type === 'OTHER')?.text
    }

    res.render('pages/bookAVisit/additionalSupport', {
      errors: req.flash('errors'),
      availableSupportTypes,
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
        ? []
        : req.body.additionalSupport.map((support: string): VisitorSupport => {
            const supportItem: VisitorSupport = { type: support }
            if (support === 'OTHER') {
              supportItem.text = req.body.otherSupportDetails
            }
            return supportItem
          })

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
      body('additionalSupport')
        .toArray()
        .custom((value: string[], { req }) => {
          if (req.body.additionalSupportRequired === 'yes') {
            const validSupportRequest = value.reduce((valid, supportReq) => {
              return valid
                ? req.session.availableSupportTypes.find((option: SupportType) => option.type === supportReq)
                : false
            }, true)
            if (!value.length || !validSupportRequest) throw new Error('No request selected')
          }
          return true
        }),
      body('otherSupportDetails')
        .trim()
        .custom((value: string, { req }) => {
          if (
            req.body.additionalSupportRequired === 'yes' &&
            <string[]>req.body.additionalSupport.includes('OTHER') &&
            (value ?? '').length === 0
          ) {
            throw new Error('Enter details of the request')
          }
          return true
        }),
    ]
  }
}
