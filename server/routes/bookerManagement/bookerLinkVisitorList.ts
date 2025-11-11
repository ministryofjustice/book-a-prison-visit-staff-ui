import { RequestHandler } from 'express'
import { BookerService } from '../../services'

export default class BookerLinkVisitorListController {
  public constructor(private readonly bookerService: BookerService) {}

  public view(): RequestHandler {
    return async (req, res) => {
      const { reference, prisonerId } = req.params
      const { username } = res.locals.user

      const booker = await this.bookerService.getBookerDetails({ username, reference })
      const prisoner = booker.permittedPrisoners.find(
        permittedPrisoner => permittedPrisoner.prisoner.prisonerNumber === prisonerId,
      )?.prisoner

      if (!prisoner) {
        return res.redirect(`/manage-bookers/${reference}/booker-details`)
      }

      const allContacts = await this.bookerService.getNonLinkedSocialContacts({ username, reference, prisonerId })

      const showNoDobWarning = allContacts.some(contact => contact.dateOfBirth === null)

      return res.render('pages/bookerManagement/bookerLinkVisitorList', {
        allContacts,
        prisoner,
        showNoDobWarning,
        reference,
      })
    }
  }

  public submit(): RequestHandler {
    return async (req, res) => {
      const { reference, prisonerId } = req.params
      const { visitorId }: { visitorId: number } = req.body

      res.redirect(`/manage-bookers/${reference}/${prisonerId}/link-visitor/${visitorId}/notify`)
    }
  }

  // TODO validations for req.params for prisonerId?
}
