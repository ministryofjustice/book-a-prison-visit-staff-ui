import createApp from './app'
import HmppsAuthClient from './data/hmppsAuthClient'
import { prisonApiClientBuilder } from './data/prisonApiClient'
import { createRedisClient } from './data/redisClient'
import TokenStore from './data/tokenStore'
import UserService from './services/userService'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient({ legacyMode: false })))
const userService = new UserService(hmppsAuthClient, prisonApiClientBuilder)

const app = createApp(userService, hmppsAuthClient)

export default app
