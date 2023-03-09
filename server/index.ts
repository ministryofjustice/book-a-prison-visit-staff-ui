import { dataAccess } from './data'
import createApp from './app'
import UserService from './services/userService'

const { hmppsAuthClient, prisonApiClientBuilder } = dataAccess()
const userService = new UserService(hmppsAuthClient, prisonApiClientBuilder)

const app = createApp(userService, hmppsAuthClient)

export default app
