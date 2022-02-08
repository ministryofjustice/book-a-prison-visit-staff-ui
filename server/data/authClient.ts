import superagent from 'superagent'
/** @type {any} */
import { URLSearchParams } from 'url'
import logger from '../../logger'
import config from '../config'
import generateOauthClientToken from '../authentication/clientCredentials'

const timeoutSpec = config.apis.oauth2.timeout
const apiUrl = config.apis.oauth2.url

async function getSystemClientToken(username?: string) {
  const clientToken = generateOauthClientToken(config.apis.oauth2.systemClientId, config.apis.oauth2.systemClientSecret)

  const oauthRequest = username
    ? new URLSearchParams({ grant_type: 'client_credentials', username }).toString()
    : new URLSearchParams({ grant_type: 'client_credentials' }).toString()

  logger.info(
    `Oauth request '${oauthRequest}' for client id '${config.apis.oauth2.systemClientId}' and user '${username}'`
  )

  const result = await superagent
    .post(`${apiUrl}/oauth/token`)
    .set('Authorization', clientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(oauthRequest)
    .timeout(timeoutSpec)
  return result.body
}

export default async (username?: string): Promise<string> => {
  const systemClientToken = await getSystemClientToken(username)
  return systemClientToken.access_token
}
