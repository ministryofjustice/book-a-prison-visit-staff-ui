import type { NextFunction, Request, Response } from 'express'
import { Prison } from '../@types/bapv'

// temporarily hard-coding here pending work on establishment switcher and decision on default value
const defaultEstablishment: Prison = { prisonId: 'HEI', prisonName: 'Hewell (HMP)' }

export default function populateSelectedEstablishment(req: Request, res: Response, next: NextFunction) {
  if (req.session.selectedEstablishment === undefined) {
    req.session.selectedEstablishment = defaultEstablishment
  }
  res.locals.selectedEstablishment = req.session.selectedEstablishment

  next()
}
