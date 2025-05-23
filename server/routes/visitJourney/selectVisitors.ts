import type { Request, Response } from 'express'
import { body, ValidationChain, validationResult } from 'express-validator'
import { BookOrUpdate, VisitorListItem } from '../../@types/bapv'
import PrisonerVisitorsService from '../../services/prisonerVisitorsService'
import { getFlashFormValues } from '../visitorUtils'
import { getUrlPrefix } from './visitJourneyUtils'
import { getBanStatus } from '../../utils/visitorUtils'
import { getDpsPrisonerAlertsUrl } from '../../utils/utils'

export default class SelectVisitors {
  constructor(
    private readonly mode: BookOrUpdate,
    private readonly prisonerVisitorsService: PrisonerVisitorsService,
  ) {}

  async get(req: Request, res: Response): Promise<void> {
    const isUpdate = this.mode === 'update'
    const { visitSessionData } = req.session
    const { offenderNo } = visitSessionData.prisoner

    const visitorList = await this.prisonerVisitorsService.getVisitors(offenderNo, res.locals.user.username)
    if (!req.session.visitorList) {
      req.session.visitorList = { visitors: [] }
    }
    req.session.visitorList.visitors = visitorList

    const atLeastOneAdult = visitorList.some(visitor => visitor.adult === true)
    const eligibleVisitors = visitorList.some(visitor => visitor.banned === false && visitor.adult === true)

    const { restrictions, alerts } = visitSessionData.prisoner

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && visitSessionData.visitorIds) {
      formValues.visitors = visitSessionData.visitorIds.map(id => id.toString())
    }

    const returnAddress = isUpdate ? `/visit/${visitSessionData.visitReference}` : `/prisoner/${offenderNo}`

    res.render('pages/bookAVisit/visitors', {
      errors: req.flash('errors'),
      offenderNo: visitSessionData.prisoner.offenderNo,
      prisonerName: `${visitSessionData.prisoner.firstName} ${visitSessionData.prisoner.lastName}`,
      visitorList,
      atLeastOneAdult,
      eligibleVisitors,
      alerts,
      restrictions,
      formValues,
      prisonerDpsAlertsUrl: getDpsPrisonerAlertsUrl(offenderNo),
      urlPrefix: getUrlPrefix(isUpdate),
      backLink: returnAddress,
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
      return res.redirect(`${urlPrefix}/select-visitors`)
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
    visitSessionData.visitorIds = selectedIds.map(id => parseInt(id, 10))
    visitSessionData.visitors = selectedVisitors

    if (!req.session.adultVisitors) {
      req.session.adultVisitors = { adults: [] }
    }
    req.session.adultVisitors.adults = adults

    const closedVisitVisitors = selectedVisitors.reduce((closedVisit, visitor) => {
      return closedVisit || visitor.restrictions.some(restriction => restriction.restrictionType === 'CLOSED')
    }, false)
    const newVisitRestriction = closedVisitVisitors ? 'CLOSED' : 'OPEN'
    visitSessionData.visitRestriction = newVisitRestriction

    const closedVisitPrisoner = visitSessionData.prisoner.restrictions.some(
      restriction => restriction.restrictionType === 'CLOSED',
    )

    const allSelectedVisitorBans = selectedVisitors.flatMap(visitor => visitor.restrictions)

    const banStatus = getBanStatus(allSelectedVisitorBans)
    visitSessionData.daysUntilBanExpiry = banStatus.numDays ? banStatus.numDays : undefined

    return !closedVisitVisitors && closedVisitPrisoner
      ? res.redirect(`${urlPrefix}/visit-type`)
      : res.redirect(`${urlPrefix}/select-date-and-time`)
  }

  validate(): ValidationChain {
    return body('visitors').custom((value: string, { req }) => {
      const selected = [].concat(value)

      if (value === undefined) {
        throw new Error('No visitors selected')
      }

      const { maxTotalVisitors } = req.session.selectedEstablishment
      if (selected.length > maxTotalVisitors) {
        throw new Error(`Select no more than ${maxTotalVisitors} visitors`)
      }

      const selectedAndBanned = req.session.visitorList.visitors.filter((visitor: VisitorListItem) => {
        return selected.includes(visitor.personId.toString()) && visitor.banned
      })
      if (selectedAndBanned.length) {
        throw new Error('Invalid selection')
      }

      const adults = req.session.visitorList.visitors
        .filter((visitor: VisitorListItem) => selected.includes(visitor.personId.toString()))
        .reduce((count: number, visitor: VisitorListItem) => {
          return (visitor.adult ?? true) ? count + 1 : count
        }, 0)

      if (adults === 0) {
        throw new Error('Add an adult to the visit')
      }

      return true
    })
  }
}
