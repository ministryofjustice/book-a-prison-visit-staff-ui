import { RequestHandler } from 'express'
import { body, matchedData, Meta, ValidationChain, validationResult } from 'express-validator'
import { format, parse, startOfYesterday } from 'date-fns'
import { BlockedDatesService } from '../../services'

export default class BlockVisitDatesController {
  public constructor(private readonly blockedDatesService: BlockedDatesService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const blockedDates = await this.blockedDatesService.getFutureBlockedDates(
        req.session.selectedEstablishment.prisonId,
        res.locals.user.username,
      )

      const datePickerMinDate = format(new Date(), 'dd/MM/yyyy')
      const datePickerExcludedDates = blockedDates.map(date => format(date.excludeDate, 'dd/MM/yyyy')).join(' ')

      res.render('pages/blockVisitDates/blockVisitDates', {
        errors: req.flash('errors'),
        formValues: req.flash('formValues')?.[0],
        message: req.flash('message'),
        blockedDates,
        datePickerMinDate,
        datePickerExcludedDates,
        showEstablishmentSwitcher: true,
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
        return res.redirect('/block-visit-dates')
      }

      const { date } = matchedData<{ date: string }>(req)
      req.session.visitBlockDate = date

      return res.redirect('/block-visit-dates/block-new-date')
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
          const blockedDates = await this.blockedDatesService.getFutureBlockedDates(
            req.session.selectedEstablishment.prisonId,
            req.user.username,
          )
          if (blockedDates.some(blockedDate => blockedDate.excludeDate === date)) {
            throw new Error('The date entered is already blocked')
          }
        }),
    ]
  }
}
