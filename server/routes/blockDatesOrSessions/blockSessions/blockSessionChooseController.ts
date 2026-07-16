import { RequestHandler } from 'express'
import { SessionData } from 'express-session'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { VisitSessionsService } from '../../../services'
import type { SessionSchedule } from '../../../data/orchestrationApiTypes'
import { formatStartToEndTime } from '../../../utils/utils'
import { buildAttendeesText } from '../../timetable/timetableItemBuilder'

export default class BlockSessionChooseController {
  public constructor(private readonly visitSessionsService: VisitSessionsService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { username } = res.locals.user
      const { prisonId } = req.session.selectedEstablishment
      const { blockDateOrSession } = req.session

      blockDateOrSession.backLinkHref = '/block-visit-dates-or-sessions/block-date-or-session'
      const { backLinkHref, date } = blockDateOrSession

      const sessions = await this.visitSessionsService.getSessionSchedule({
        username,
        prisonId,
        date,
        includeExcludedSessions: true,
      })

      const atLeastOneSessionNotBlocked = sessions.some(session => !session.isSessionExcluded)
      if (!atLeastOneSessionNotBlocked) {
        req.flash('errors', [
          {
            location: 'body',
            msg: 'All sessions for that date are already blocked',
            path: 'blockType',
            type: 'field',
            value: 'session',
          },
        ])
        req.flash('formValues', { blockType: 'session' })
        return res.redirect('/block-visit-dates-or-sessions/block-date-or-session')
      }

      blockDateOrSession.sessions = sessions

      return res.render('pages/blockDatesOrSessions/blockSessions/blockSessionChoose', {
        backLinkHref,
        errors: req.flash('errors'),
        date,
        sessionsRadioItems: this.buildSessionsRadioItems(sessions),
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect('/block-visit-dates-or-sessions/block-new-session/choose')
      }

      const { blockDateOrSession } = req.session
      const { sessionTemplateReference } = matchedData<{ sessionTemplateReference: string }>(req)

      blockDateOrSession.selectedSession = blockDateOrSession.sessions.find(
        session => session.sessionTemplateReference === sessionTemplateReference,
      )
      blockDateOrSession.backLinkHref = '/block-visit-dates-or-sessions/block-new-session/choose'

      return res.redirect('/block-visit-dates-or-sessions/block-new-session/confirm')
    }
  }

  public validate(): ValidationChain[] {
    return [
      // Selected session must be one of the sessions available for the selected date
      body('sessionTemplateReference', 'No session selected').custom((sessionTemplateReference: string, { req }) => {
        const { blockDateOrSession } = req.session as SessionData
        return (
          blockDateOrSession.sessions?.some(
            session => session.sessionTemplateReference === sessionTemplateReference && !session.isSessionExcluded,
          ) ?? false
        )
      }),
    ]
  }

  private buildSessionsRadioItems(sessions: SessionSchedule[]): { value: string; text: string; disabled?: true }[] {
    return sessions.map(session => {
      const time = formatStartToEndTime(session.sessionTimeSlot.startTime, session.sessionTimeSlot.endTime)
      const attendees = buildAttendeesText({ ...session })
      return {
        value: session.sessionTemplateReference,
        text: `${time} (${session.visitRoom}), ${attendees}`,
        ...(session.isSessionExcluded && { disabled: true }),
      }
    })
  }
}
