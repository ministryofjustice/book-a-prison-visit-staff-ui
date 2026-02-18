import { RequestHandler } from 'express'
import { body, matchedData, ValidationChain, validationResult } from 'express-validator'
import { BookerService } from '../../../services'
import { isValidPrisonerNumber } from '../../validationChecks'
import { BookerPrisonerParams } from '../../../@types/requestParameterTypes'

export default class VisitorListController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler<BookerPrisonerParams> {
    return async (req, res) => {
      const { reference, prisonerId } = req.params
      const { username } = res.locals.user
      const bookerDetailsPageUrl = `/manage-bookers/${reference}/booker-details`

      if (!isValidPrisonerNumber(prisonerId)) {
        return res.redirect(bookerDetailsPageUrl)
      }

      const booker = await this.bookerService.getBookerDetails({ username, reference })
      const prisoner = booker.permittedPrisoners.find(
        permittedPrisoner => permittedPrisoner.prisoner.prisonerNumber === prisonerId,
      )?.prisoner

      if (!prisoner) {
        return res.redirect(bookerDetailsPageUrl)
      }
      const nonLinkedContacts = await this.bookerService.getNonLinkedSocialContacts({ username, reference, prisonerId })
      const showNoDobWarning = nonLinkedContacts.some(contact => contact.dateOfBirth === null)

      req.session.bookerLinkVisitor = { reference, prisonerId, nonLinkedContacts }

      return res.render('pages/bookerManagement/booker/visitorList', {
        backLinkHref: bookerDetailsPageUrl,
        errors: req.flash('errors'),
        nonLinkedContacts,
        prisoner,
        showNoDobWarning,
        reference,
      })
    }
  }

  public submit(): RequestHandler<BookerPrisonerParams> {
    return async (req, res) => {
      const { reference, prisonerId } = req.params

      if (!isValidPrisonerNumber(prisonerId)) {
        return res.redirect(`/manage-bookers/${reference}/booker-details`)
      }

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        req.flash('errors', errors.array())
        return res.redirect(`/manage-bookers/${reference}/prisoner/${prisonerId}/link-visitor`)
      }

      const { visitorId } = matchedData<{ visitorId: string }>(req)

      return res.redirect(`/manage-bookers/${reference}/prisoner/${prisonerId}/link-visitor/${visitorId}/notify`)
    }
  }

  public validate(): ValidationChain[] {
    return [body('visitorId').isInt().withMessage('Select a visitor to link')]
  }
}
