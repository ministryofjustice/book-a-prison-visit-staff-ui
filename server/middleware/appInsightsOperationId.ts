import type { NextFunction, Request, Response } from 'express'
import { trace } from '@ministryofjustice/hmpps-azure-telemetry'

export default function appInsightsOperationId(req: Request, res: Response, next: NextFunction) {
  const span = trace.getActiveSpan()
  const operationId = span?.spanContext().traceId

  res.locals.appInsightsOperationId = operationId
  next()
}
