// Setup for nock v15 - handles @mswjs/interceptors socket listener issues
// Only imported by nock-based test files to avoid global impact on all tests

import { EventEmitter } from 'events'

// Increase max listeners to handle nock v15 with @mswjs/interceptors
// which adds socket listeners during test execution
EventEmitter.defaultMaxListeners = 0

// Suppress unhandled socket errors from @mswjs/interceptors in nock v15
// These are expected during test suite teardown and shouldn't crash Jest
const uncaughtExceptionHandler = (err: Error) => {
  // Ignore ECONNRESET from socket cleanup in nock v15's @mswjs/interceptors
  if ((err as NodeJS.ErrnoException)?.code === 'ECONNRESET' && err?.message?.includes('connect')) {
    // Silently ignore - this is expected from socket cleanup
    return
  }
  // Re-throw other errors
  throw err
}

process.on('uncaughtException', uncaughtExceptionHandler)

// Cleanup listener when tests complete
afterAll(() => {
  process.removeListener('uncaughtException', uncaughtExceptionHandler)
})
