import { RequestHandler } from 'express'
import { appendNavStateToPath, extractVisitNavState } from '../visitNavigationUtils'
import { VisitReferenceParams } from '../../../@types/requestParameterTypes'
import { visitRequestRejectionReasons } from '../../../constants/visitRequestRejection'

export default class VisitRequestRejectionReasonController {
  public constructor() {}

  public view(): RequestHandler<VisitReferenceParams> {
    return async (req, res) => {
      const { reference } = req.params
      const navState = extractVisitNavState({ from: req.query.from, query: req.query.query })

      return res.render('pages/visit/visitRequests/rejectionReason', {
        backLinkHref: appendNavStateToPath(`/visit/${reference}`, navState),
        formAction: appendNavStateToPath(`/visit/${reference}/request/reject`, navState),
        reference,
        visitRequestRejectionReasons,
      })
    }
  }
}
