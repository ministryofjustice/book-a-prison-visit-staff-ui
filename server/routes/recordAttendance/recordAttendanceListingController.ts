import { RequestHandler } from 'express'

export default class RecordAttendanceListingController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/recordAttendance/recordAttendanceListing', {
        messages: req.flash('messages'),
      })
    }
  }
}
