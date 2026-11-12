// Increase max listeners to handle nock v15 with @mswjs/interceptors
// which adds socket listeners during test execution
import { EventEmitter } from 'events'

EventEmitter.defaultMaxListeners = 20
