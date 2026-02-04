import { RequestHandler, Request } from 'express'
import { BadRequest } from 'http-errors'
import { isValidVisitReference } from '../validationChecks'
import { VisitReferenceParams } from '../../@types/requestParameterTypes'

export default class ConfirmUpdateController {
  public constructor() {}

  public viewConfirmUpdate(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const reference = getVisitReference(req)
      const { policyNoticeDaysMin } = req.session.selectedEstablishment

      return res.render('pages/visit/confirmUpdate', {
        errors: req.flash('errors'),
        backLinkHref: `/visit/${reference}`,
        policyNoticeDaysMin,
        reference,
      })
    }
  }

  public submitConfirmUpdate(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const reference = getVisitReference(req)
      const { confirmUpdate } = req.body

      if (confirmUpdate === 'yes') {
        req.session.visitSessionData.overrideBookingWindow = true
        return res.redirect('/update-a-visit/select-visitors')
      }
      if (confirmUpdate === 'no') {
        return res.redirect(`/visit/${reference}`)
      }

      req.flash('errors', [
        {
          msg: 'No option selected',
          path: 'confirmUpdate',
          type: 'field',
          location: 'body',
        },
      ] as unknown as [])

      return res.redirect(`/visit/${reference}/confirm-update`)
    }
  }
}

function getVisitReference(req: Request<VisitReferenceParams>): string {
  const { reference } = req.params

  if (!isValidVisitReference(reference)) {
    throw new BadRequest()
  }
  return reference
}
