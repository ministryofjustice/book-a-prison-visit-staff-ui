import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { AuditService, BlockDatesOrSessionsService, VisitService } from '../../../services'
import { formatStartToEndTime } from '../../../utils/utils'
import { buildAttendeesText } from '../../timetable/timetableItemBuilder'
import logger from '../../../../logger'
import { getSessionBlockedMessage } from './blockSessionsMessages'

export default class BlockSessionConfirmController {
  public constructor(
    private readonly auditService: AuditService,
    private readonly blockDatesOrSessionsService: BlockDatesOrSessionsService,
    private readonly visitService: VisitService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { username } = res.locals.user
      const { prisonId } = req.session.selectedEstablishment
      const { blockDateOrSession } = req.session

      blockDateOrSession.backLinkHref = '/block-visit-dates-or-sessions/block-new-session/choose'
      const { backLinkHref, date, selectedSession } = blockDateOrSession

      const visitCount = (
        await this.visitService.getVisitsBySessionTemplate({
          username,
          prisonId,
          reference: selectedSession.sessionTemplateReference,
          sessionDate: date,
        })
      ).length

      const time = formatStartToEndTime(
        selectedSession.sessionTimeSlot.startTime,
        selectedSession.sessionTimeSlot.endTime,
      )
      const attendees = buildAttendeesText({ ...selectedSession })

      return res.render('pages/blockDatesOrSessions/blockSessions/blockSessionConfirm', {
        backLinkHref,
        errors: req.flash('errors'),
        date,
        time,
        attendees,
        visitCount,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/block-visit-dates-or-sessions/block-new-session/confirm')
      }

      const { confirmBlockSession } = matchedData<{ confirmBlockSession: 'yes' | 'no' }>(req)
      if (confirmBlockSession === 'yes') {
        const { blockDateOrSession } = req.session
        const { date, selectedSession } = blockDateOrSession
        const { username } = res.locals.user

        try {
          await this.blockDatesOrSessionsService.blockVisitSession({
            sessionTemplateReference: selectedSession.sessionTemplateReference,
            date,
            username,
          })

          req.flash('messages', getSessionBlockedMessage({ date, session: selectedSession }))

          await this.auditService.blockedVisitSession({
            date,
            sessionReference: selectedSession.sessionTemplateReference,
            username,
            operationId: res.locals.appInsightsOperationId,
          })
        } catch (error) {
          logger.error(
            error,
            `Could not block visit session (date: ${date}, session: ${selectedSession.sessionTemplateReference}) for ${res.locals.user.username}`,
          )
        }
      }

      delete req.session.blockDateOrSession
      return res.redirect('/block-visit-dates-or-sessions')
    }
  }

  public validate(): ValidationChain[] {
    return [body('confirmBlockSession', 'No answer selected').isIn(['yes', 'no'])]
  }
}
