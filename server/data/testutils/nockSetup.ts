// Setup for nock v15 - handles @mswjs/interceptors socket listener issues
// Only imported by nock-based test files to avoid global impact on all tests

import { EventEmitter } from 'events'

// Increase max listeners to handle nock v15 with @mswjs/interceptors
// which adds socket listeners during test execution
EventEmitter.defaultMaxListeners = 0

// Add a catch-all error handler for sockets to prevent uncaught errors during cleanup
// This is needed when running with runInBand where all tests share one process
process.on('uncaughtException', (err: Error) => {
  const errno = (err as NodeJS.ErrnoException)?.code
  const isNockSocketError = errno === 'ECONNRESET' && err?.message?.includes('connect')

  if (isNockSocketError) {
    // Silently ignore - expected from @mswjs/interceptors cleanup in nock v15
    // This happens during process teardown after tests complete
    return
  }

  throw err
})
