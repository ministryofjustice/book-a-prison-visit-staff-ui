import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { BadRequest } from 'http-errors'
import { BookerService } from '../../../services'
import { isValidPrisonerNumber } from '../../validationChecks'
import { BookerParams } from '../../../@types/requestTypes'

export default class PrisonerListController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler<BookerParams> {
    return async (req, res) => {
      const { reference } = req.params
      const { selectedBooker } = req.session
      const bookerDetailsPageUrl = `/manage-bookers/${reference}/booker-details`

      if (selectedBooker !== reference) {
        throw new BadRequest()
      }

      const booker = await this.bookerService.getBookerDetails({ reference })
      const atLeastOnePrisoner = !!booker.permittedPrisoners.length
      return res.render('pages/bookerManagement/booker/prisonerList', {
        backLinkHref: bookerDetailsPageUrl,
        errors: req.flash('errors'),
        reference,
        email: booker.email,
        prisoners: booker.permittedPrisoners,
        atLeastOnePrisoner,
      })
    }
  }

  public submit(): RequestHandler<BookerParams> {
    return async (req, res) => {
      const { reference } = req.params
      const { selectedBooker } = req.session

      if (selectedBooker !== reference) {
        throw new BadRequest()
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(`/manage-bookers/${reference}/prisoner`)
      }

      const { prisonNumber } = matchedData<{ prisonNumber: string }>(req)

      return res.redirect(`/manage-bookers/${reference}/prisoner/${prisonNumber}/link-visitor`)
    }
  }

  public validate(): ValidationChain[] {
    return [
      body('prisonNumber')
        .custom(prisonNumber => isValidPrisonerNumber(prisonNumber))
        .withMessage('Select a prisoner'),
    ]
  }
}
