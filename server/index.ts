import createApp from './app'
import HmppsAuthClient from './data/hmppsAuthClient'
import { prisonApiClientBuilder } from './data/prisonApiClient'
import systemToken from './data/authClient'
import { createRedisClient } from './data/redisClient'
import TokenStore from './data/tokenStore'
import UserService from './services/userService'

const hmppsAuthClient = new HmppsAuthClient(new TokenStore(createRedisClient({ legacyMode: false })))
const userService = new UserService(hmppsAuthClient, prisonApiClientBuilder, systemToken)

const app = createApp(userService)

export default app
