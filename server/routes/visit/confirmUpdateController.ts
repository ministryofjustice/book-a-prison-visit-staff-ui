import { RequestHandler, Request } from 'express'
import { BadRequest } from 'http-errors'
import { isValidVisitReference } from '../validationChecks'
import { VisitReferenceParams } from '../../@types/requestParameterTypes'
import { appendNavStateToPath, extractVisitNavState } from './visitNavigationUtils'

export default class ConfirmUpdateController {
  public constructor() {}

  public viewConfirmUpdate(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const reference = getVisitReference(req)
      const { policyNoticeDaysMin } = req.session.selectedEstablishment
      const navState = extractVisitNavState({ from: req.query.from, query: req.query.query })

      return res.render('pages/visit/confirmUpdate', {
        errors: req.flash('errors'),
        backLinkHref: appendNavStateToPath(`/visit/${reference}`, navState),
        formAction: appendNavStateToPath(`/visit/${reference}/confirm-update`, navState),
        policyNoticeDaysMin,
        reference,
      })
    }
  }

  public submitConfirmUpdate(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const reference = getVisitReference(req)
      const { confirmUpdate } = req.body
      const navState = extractVisitNavState({ from: req.query.from, query: req.query.query })

      if (confirmUpdate === 'yes') {
        req.session.visitSessionData.overrideBookingWindow = true
        return res.redirect('/update-a-visit/select-visitors')
      }
      if (confirmUpdate === 'no') {
        return res.redirect(appendNavStateToPath(`/visit/${reference}`, navState))
      }

      req.flash('errors', [
        {
          msg: 'No option selected',
          path: 'confirmUpdate',
          type: 'field',
          location: 'body',
        },
      ] as unknown as [])

      return res.redirect(appendNavStateToPath(`/visit/${reference}/confirm-update`, navState))
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
