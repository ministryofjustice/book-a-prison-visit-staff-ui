import { stubFor } from './wiremock'

const stubUserMe = (username = 'user1', activeCaseloadId = 'HEI') =>
  stubFor({
    request: {
      method: 'GET',
      url: '/nomisUserRoles/me',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: { username, activeCaseloadId },
    },
  })

export default stubUserMe
