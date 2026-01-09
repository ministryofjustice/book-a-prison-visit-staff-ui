import { RequestHandler } from 'express'
import { body, validationResult } from 'express-validator'
import { VisitSessionData } from '../../@types/bapv'
import { clearSession } from '../visitorUtils'
import { AuditService, PrisonerProfileService } from '../../services'
import { getDpsPrisonerAlertsUrl } from '../../utils/utils'
import config from '../../config'

export default class PrisonerProfileController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly prisonerProfileService: PrisonerProfileService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { prisonerId } = req.params
      const { prisonId } = req.session.selectedEstablishment
      const search = (req.query?.search as string) ?? ''
      const queryParamsForBackLink = search !== '' ? new URLSearchParams({ search }).toString() : ''

      const prisonerProfile = await this.prisonerProfileService.getProfile(
        prisonId,
        prisonerId,
        res.locals.user.username,
      )

      await this.auditService.viewPrisoner({
        prisonerId,
        prisonId,
        username: res.locals.user.username,
        operationId: res.locals.appInsightsOperationId,
      })

      const showVoHistoryButton = config.features.voHistory.enabled

      return res.render('pages/prisoner/profile', {
        messages: req.flash('messages'),
        errors: req.flash('errors'),
        ...prisonerProfile,
        prisonerName: `${prisonerProfile.prisonerDetails.lastName}, ${prisonerProfile.prisonerDetails.firstName}`,
        queryParamsForBackLink,
        prisonerDpsAlertsUrl: getDpsPrisonerAlertsUrl(prisonerId),
        showVoHistoryButton,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { prisonerId } = req.params
      const { prisonId } = req.session.selectedEstablishment
      const { username } = res.locals.user

      const { prisonerDetails, alerts, restrictions } = await this.prisonerProfileService.getProfile(
        prisonId,
        prisonerId,
        username,
      )

      if (prisonerDetails.visitBalances?.remainingVo <= 0 && prisonerDetails.visitBalances?.remainingPvo <= 0) {
        await body('vo-override').equals('override').withMessage('Select the box to book a prison visit').run(req)

        const errors = validationResult(req)

        if (!errors.isEmpty()) {
          req.flash('errors', errors.array())
          return res.redirect(`/prisoner/${prisonerId}`)
        }

        await this.auditService.overrodeZeroVO({
          prisonerId,
          username: res.locals.user.username,
          operationId: res.locals.appInsightsOperationId,
        })
      }

      clearSession(req)

      const prisoner = {
        firstName: prisonerDetails.firstName,
        lastName: prisonerDetails.lastName,
        offenderNo: prisonerId,
        location: prisonerDetails.cellLocation ? `${prisonerDetails.cellLocation}, ${prisonerDetails.prisonName}` : '',
        alerts,
        restrictions,
      }
      const visitSessionData: VisitSessionData = {
        allowOverBooking: false,
        prisoner,
        prisonId,
      }

      req.session.visitSessionData = visitSessionData

      return res.redirect('/book-a-visit/select-visitors')
    }
  }
}
