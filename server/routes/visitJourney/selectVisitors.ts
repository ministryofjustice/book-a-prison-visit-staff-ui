import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { VisitorListItem } from '../../@types/bapv'
import PrisonerProfileService from '../../services/prisonerProfileService'
import PrisonerVisitorsService from '../../services/prisonerVisitorsService'
import { getFlashFormValues } from '../visitorUtils'

export default class SelectVisitors {
  constructor(
    private readonly mode: string,
    private readonly prisonerVisitorsService: PrisonerVisitorsService,
    private readonly prisonerProfileService: PrisonerProfileService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'amendVisitSessionData' : 'visitSessionData']
    const { offenderNo } = sessionData.prisoner

    const visitorList = await this.prisonerVisitorsService.getVisitors(offenderNo, res.locals.user?.username)
    if (!req.session.visitorList) {
      req.session.visitorList = { visitors: [] }
    }
    req.session.visitorList.visitors = visitorList

    const restrictions = await this.prisonerProfileService.getRestrictions(offenderNo, res.locals.user?.username)
    sessionData.prisoner.restrictions = restrictions

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && sessionData.visitors) {
      formValues.visitors = sessionData.visitors.map(visitor => visitor.personId.toString())
    }

    res.render(`pages/${isUpdate ? 'visit' : 'bookAVisit'}/visitors`, {
      errors: req.flash('errors'),
      offenderNo: sessionData.prisoner.offenderNo,
      prisonerName: sessionData.prisoner.name,
      visitorList,
      restrictions,
      formValues,
    })
  }

  async post(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const sessionData = req.session[isUpdate ? 'amendVisitSessionData' : 'visitSessionData']
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      req.flash('errors', errors.array() as [])
      req.flash('formValues', req.body)
      return res.redirect(req.originalUrl)
    }

    const selectedIds = [].concat(req.body.visitors)
    const selectedVisitors = req.session.visitorList.visitors.filter((visitor: VisitorListItem) =>
      selectedIds.includes(visitor.personId.toString()),
    )

    const adults = selectedVisitors.reduce((adultVisitors: VisitorListItem[], visitor: VisitorListItem) => {
      if (visitor.adult ?? true) {
        adultVisitors.push(visitor)
      }

      return adultVisitors
    }, [])
    sessionData.visitors = selectedVisitors

    if (!req.session.adultVisitors) {
      req.session.adultVisitors = { adults: [] }
    }
    req.session.adultVisitors.adults = adults

    const closedVisitVisitors = selectedVisitors.reduce((closedVisit, visitor) => {
      return closedVisit || visitor.restrictions.some(restriction => restriction.restrictionType === 'CLOSED')
    }, false)
    sessionData.visitRestriction = closedVisitVisitors ? 'CLOSED' : 'OPEN'
    sessionData.closedVisitReason = closedVisitVisitors ? 'visitor' : undefined

    const closedVisitPrisoner = sessionData.prisoner.restrictions.some(
      restriction => restriction.restrictionType === 'CLOSED',
    )

    return !closedVisitVisitors && closedVisitPrisoner
      ? res.redirect('/book-a-visit/visit-type')
      : res.redirect('/book-a-visit/select-date-and-time')
  }

  validate(): ValidationChain {
    return body('visitors').custom((value: string, { req }) => {
      const selected = [].concat(value)

      if (value === undefined) {
        throw new Error('No visitors selected')
      }

      const selectedAndBanned = req.session.visitorList.visitors.filter((visitor: VisitorListItem) => {
        return selected.includes(visitor.personId.toString()) && visitor.banned
      })
      if (selectedAndBanned.length) {
        throw new Error('Invalid selection')
      }

      if (selected.length > 3) {
        throw new Error('Select no more than 3 visitors with a maximum of 2 adults')
      }

      const adults = req.session.visitorList.visitors
        .filter((visitor: VisitorListItem) => selected.includes(visitor.personId.toString()))
        .reduce((count: number, visitor: VisitorListItem) => {
          return visitor.adult ?? true ? count + 1 : count
        }, 0)

      if (adults === 0) {
        throw new Error('Add an adult to the visit')
      }

      if (adults > 2) {
        throw new Error('Select no more than 2 adults')
      }

      return true
    })
  }
}
