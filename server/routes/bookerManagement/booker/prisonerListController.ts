import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { BookerService } from '../../../services'
import { isValidPrisonerNumber } from '../../validationChecks'
import { BookerPrisonerParams } from '../../../@types/requestTypes'

export default class PrisonerListController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler<BookerPrisonerParams> {
    return async (req, res) => {
      const { reference } = req.params
      const bookerDetailsPageUrl = `/manage-bookers/${reference}/booker-details`

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

  public submit(): RequestHandler<BookerPrisonerParams> {
    return async (req, res) => {
      const { reference } = req.params

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(`/manage-bookers/${reference}/prisoner`)
      }

      const { prisonNumber } = matchedData<{ prisonNumber: string }>(req)

      if (!isValidPrisonerNumber(prisonNumber)) {
        return res.redirect(`/manage-bookers/${reference}/booker-details`)
      }

      return res.redirect(`/manage-bookers/${reference}/prisoner/${prisonNumber}/link-visitor`)
    }
  }

  public validate(): ValidationChain[] {
    return [body('prisonNumber').isString().withMessage('Select a prisoner')]
  }
}
