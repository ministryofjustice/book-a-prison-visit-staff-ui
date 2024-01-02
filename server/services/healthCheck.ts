import { serviceCheckFactory } from '../data/healthCheck'
import config from '../config'
import type { AgentConfig } from '../config'

interface HealthCheckStatus {
  name: string
  status: string
  message: unknown
}

interface HealthCheckResult extends Record<string, unknown> {
  healthy: boolean
  checks: Record<string, unknown>
}

export type HealthCheckService = () => Promise<HealthCheckStatus>
export type HealthCheckCallback = (result: HealthCheckResult) => void

function service(name: string, url: string, agentConfig: AgentConfig): HealthCheckService {
  const check = serviceCheckFactory(name, url, agentConfig)
  return () =>
    check()
      .then(result => ({ name, status: 'ok', message: result }))
      .catch(err => ({ name, status: 'ERROR', message: err }))
}

function addAppInfo(result: HealthCheckResult): HealthCheckResult {
  const buildInformation = getBuild()
  const buildInfo = {
    uptime: process.uptime(),
    build: buildInformation,
    version: buildInformation && buildInformation.buildNumber,
  }

  return { ...result, ...buildInfo }
}

function getBuild() {
  try {
    // eslint-disable-next-line import/no-unresolved,global-require
    return require('../../build-info.json')
  } catch (ex) {
    return null
  }
}

function gatherCheckInfo(aggregateStatus: Record<string, unknown>, currentStatus: HealthCheckStatus) {
  return { ...aggregateStatus, [currentStatus.name]: currentStatus.message }
}

const apiChecks = [
  service('hmppsAuth', `${config.apis.hmppsAuth.url}/health/ping`, config.apis.hmppsAuth.agent),
  service('manageUsersApi', `${config.apis.manageUsersApi.url}/health/ping`, config.apis.manageUsersApi.agent),
  service('nomisUserRolesApi', `${config.apis.nomisUserRolesApi.url}/health/ping`, config.apis.nomisUserRolesApi.agent),
  service('orchestration', `${config.apis.orchestration.url}/health/ping`, config.apis.orchestration.agent),
  service('prison', `${config.apis.prison.url}/health/ping`, config.apis.prison.agent),
  service(
    'prisonerContactRegistry',
    `${config.apis.prisonerContactRegistry.url}/health/ping`,
    config.apis.prisonerContactRegistry.agent,
  ),
  service('prisonRegister', `${config.apis.prisonRegister.url}/health/ping`, config.apis.prisonRegister.agent),
  service('prisonerSearch', `${config.apis.prisonerSearch.url}/health/ping`, config.apis.prisonerSearch.agent),
  service('whereabouts', `${config.apis.whereabouts.url}/health/ping`, config.apis.whereabouts.agent),
  ...(config.apis.tokenVerification.enabled
    ? [
        service(
          'tokenVerification',
          `${config.apis.tokenVerification.url}/health/ping`,
          config.apis.tokenVerification.agent,
        ),
      ]
    : []),
]

export default function healthCheck(callback: HealthCheckCallback, checks = apiChecks): void {
  Promise.all(checks.map(fn => fn())).then(checkResults => {
    const allOk = checkResults.every(item => item.status === 'ok')

    const result = {
      healthy: allOk,
      checks: checkResults.reduce(gatherCheckInfo, {}),
    }

    callback(addAppInfo(result))
  })
}
