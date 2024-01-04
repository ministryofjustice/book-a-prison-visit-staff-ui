import { Response } from 'superagent'

import nomisUserRoles from './nomisUserRoles'
import { stubFor } from './wiremock'

const stubUser = (name: string) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manageUsersApi/users/me',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        username: 'USER1',
        active: true,
        name,
      },
    },
  })

const stubUserRoles = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manageUsersApi/users/me/roles',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: [{ roleCode: 'SOME_USER_ROLE' }],
    },
  })

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/manageUsersApi/health/ping',
    },
    response: {
      status: 200,
    },
  })

export default {
  stubManageUser: (name = 'john smith'): Promise<[Response, Response, Response]> =>
    Promise.all([stubUser(name), stubUserRoles(), nomisUserRoles.stubUserMe()]),
  stubManageUsersPing: ping,
}
