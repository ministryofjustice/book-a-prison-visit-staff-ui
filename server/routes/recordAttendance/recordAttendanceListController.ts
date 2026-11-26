import { RequestHandler } from 'express'

export default class RecordAttendanceListController {
  public constructor() {}

  public view(): RequestHandler {
    return async (req, res) => {
      return res.render('pages/recordAttendance/recordAttendanceList', {
        messages: req.flash('messages'),
      })
    }
  }
}
