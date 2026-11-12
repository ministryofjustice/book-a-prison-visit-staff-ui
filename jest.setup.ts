// Increase max listeners to handle nock v15 with @mswjs/interceptors
// which adds socket listeners during test execution
// This must be set globally before any tests run, not in individual test files
import { EventEmitter } from 'events'

EventEmitter.defaultMaxListeners = 20
