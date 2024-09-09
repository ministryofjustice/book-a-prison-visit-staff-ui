import { RequestHandler } from 'express'
import { body, matchedData, Meta, ValidationChain, validationResult } from 'express-validator'
import { format, startOfYesterday } from 'date-fns'
import { BlockedDatesService } from '../../services'

export default class BlockVisitDatesController {
  public constructor(private readonly blockedDatesService: BlockedDatesService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const blockedDates = await this.blockedDatesService.getFutureBlockedDates(
        req.session.selectedEstablishment.prisonId,
        res.locals.user.username,
      )

      const datePickerMinDate = format(startOfYesterday(), 'dd/MM/yyyy')
      const datePickerExcludedDates = blockedDates.map(date => format(date.excludeDate, 'dd/MM/yyyy')).join(' ')

      res.render('pages/blockVisitDates/blockVisitDates', {
        errors: req.flash('errors'),
        formValues: req.flash('formValues')?.[0],
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
        req.flash('formValues', matchedData(req, { onlyValidData: false }))
        return res.redirect('/block-visit-dates')
      }

      const { date } = matchedData<{ date: string }>(req)
      req.session.visitBlockDate = date

      return res.redirect('/block-visit-dates/block-new-date')
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('date', 'Enter a valid date')
        .notEmpty()
        .bail()
        // reformat raw input from day/month/year to year-month-day
        .customSanitizer((date: string) => date.split('/').reverse().join('-'))
        // convert to a Date
        .toDate()
        .isISO8601()
        .bail()
        // reformat to date string
        .customSanitizer((date: Date) => format(date, 'yyyy-MM-dd'))
        // date cannot be in past
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
