import type { Request, Response } from 'express'
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
    const sessionData = req.session[this.mode === 'edit' ? 'amendVisitSessionData' : 'visitSessionData']
    const { offenderNo } = sessionData.prisoner

    const visitorList = await this.prisonerVisitorsService.getVisitors(offenderNo, res.locals.user?.username)
    if (!req.session.visitorList) {
      req.session.visitorList = { visitors: [] }
    }
    req.session.visitorList.visitors = visitorList

    const restrictions = await this.prisonerProfileService.getRestrictions(offenderNo, res.locals.user?.username)
    req.session.visitSessionData.prisoner.restrictions = restrictions

    const formValues = getFlashFormValues(req)
    if (!Object.keys(formValues).length && sessionData.visitors) {
      formValues.visitors = sessionData.visitors.map(visitor => visitor.personId.toString())
    }

    res.render('pages/bookAVisit/visitors', {
      errors: req.flash('errors'),
      offenderNo: sessionData.prisoner.offenderNo,
      prisonerName: sessionData.prisoner.name,
      visitorList,
      restrictions,
      formValues,
    })
  }
}
