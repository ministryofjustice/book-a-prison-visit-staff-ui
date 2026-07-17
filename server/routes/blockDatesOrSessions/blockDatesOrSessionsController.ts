import { RequestHandler } from 'express'
import { body, matchedData, Meta, ValidationChain, validationResult } from 'express-validator'
import { format, parse, startOfYesterday } from 'date-fns'
import { BlockDatesOrSessionsService, VisitSessionsService } from '../../services'
import buildBlockedDatesAndSessionsTable from './blockedDatesAndSessionsTableBuilder'

export default class BlockDatesOrSessionsController {
  public constructor(
    private readonly blockDatesOrSessionsService: BlockDatesOrSessionsService,
    private readonly visitSessionsService: VisitSessionsService,
  ) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const rawBlockedDatesAndSessions = await this.blockDatesOrSessionsService.getFutureBlockedDatesAndSessions({
        prisonId: req.session.selectedEstablishment.prisonId,
        includeSessions: true,
        username: res.locals.user.username,
      })

      const datePickerMinDate = format(new Date(), 'dd/MM/yyyy')
      const blockedDatesAndSessions = buildBlockedDatesAndSessionsTable(rawBlockedDatesAndSessions)

      res.render('pages/blockDatesOrSessions/blockDatesOrSessions', {
        errors: req.flash('errors'),
        formValues: req.flash('formValues')?.[0],
        message: req.flash('messages')?.[0],
        blockedDatesAndSessions,
        datePickerMinDate,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        const { rawDate } = matchedData<{ rawDate: string }>(req)
        req.flash('formValues', { date: rawDate })
        return res.redirect('/block-visit-dates-or-sessions')
      }

      const { date } = matchedData<{ date: string }>(req)
      req.session.blockDateOrSession = {
        backLinkHref: '/block-visit-dates-or-sessions',
        date,
      }

      const sessionSchedule = await this.visitSessionsService.getSessionSchedule({
        username: res.locals.user.username,
        prisonId: req.session.selectedEstablishment.prisonId,
        date,
        includeExcludedSessions: true,
      })

      const dateHasSessions = sessionSchedule.length > 0

      if (dateHasSessions) {
        return res.redirect('/block-visit-dates-or-sessions/block-date-or-session')
      }

      return res.redirect('/block-visit-dates-or-sessions/block-new-date')
    }
  }

  public validate(): ValidationChain[] {
    return [
      // store pre-sanitised user-entered value as rawDate to show in field validation error
      body('rawDate').customSanitizer((_value, { req }) => (typeof req.body?.date === 'string' ? req.body.date : '')),
      body('date', 'Enter a valid date')
        .trim()
        // reformat to year-month-day (used by API)
        .customSanitizer((value: string) => {
          const date = parse(value, 'd/M/yyyy', new Date())
          return date.toString() !== 'Invalid Date' ? format(date, 'yyyy-MM-dd') : ''
        })
        .isDate()
        .bail()
        // must be a future date
        .isAfter({ comparisonDate: format(startOfYesterday(), 'yyyy-MM-dd') })
        .withMessage('The date must be in the future')
        .bail()
        // date cannot be an existing blocked date
        .custom(async (date: string, { req }: Meta & { req: Express.Request }) => {
          const blockedDates = await this.blockDatesOrSessionsService.getFutureBlockedDates(
            req.session.selectedEstablishment.prisonId,
          )
          if (blockedDates.some(blockedDate => blockedDate.excludeDate === date)) {
            throw new Error('The full day is already blocked for the date entered')
          }
        }),
    ]
  }
}
