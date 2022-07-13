import type { NextFunction, Request, Response } from 'express'
import { getCorrelationContext } from 'applicationinsights'

export default function appInsightsOperationId(req: Request, res: Response, next: NextFunction) {
  res.locals.appInsightsOperationId = getCorrelationContext()?.operation.id
  next()
}
