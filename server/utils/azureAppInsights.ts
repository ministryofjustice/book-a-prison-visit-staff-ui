import { initialiseTelemetry, flushTelemetry, telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import type { RequestHandler } from 'express'

initialiseTelemetry({
  serviceName: 'book-a-prison-visit-staff-ui',
  serviceVersion: process.env.BUILD_NUMBER || 'unknown',
  connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  debug: process.env.DEBUG_TELEMETRY === 'true',
})
  .addFilter(telemetry.processors.filterSpanWherePath(['/health', '/ping', '/info', '/assets/*', '/favicon.ico']))
  .addModifier(telemetry.processors.enrichSpanNameWithHttpRoute())
  .startRecording()

const shutdown = async () => {
  await flushTelemetry()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown())
process.on('SIGINT', () => shutdown())

export default function addUsernameAndCaseloadToTelemetry(): RequestHandler {
  return (req, res, next) => {
    const { username, activeCaseLoadId } = res?.locals?.user || {}

    if (username) {
      telemetry.setSpanAttributes({
        ...(username && { username }),
        ...(activeCaseLoadId && { activeCaseLoadId }),
      })
    }

    return next()
  }
}
