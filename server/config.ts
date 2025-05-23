import { NotificationTypeRaw } from './data/orchestrationApiTypes'

const production = process.env.NODE_ENV === 'production'

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: AgentConfig
}

export default {
  applicationName: 'Manage prison visits',
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  productId: get('PRODUCT_ID', 'UNASSIGNED', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  branchName: get('GIT_BRANCH', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
  production,
  https: production,
  staticResourceCacheDuration: '1h',
  redis: {
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
    systemTokenPrefix: `systemToken-${get('REDIS_KEY', 'bapv-staff', requiredInProduction)}:`,
    sessionPrefix: `sess-${get('REDIS_KEY', 'bapv-staff', requiredInProduction)}:`,
  },
  session: {
    secret: get('SESSION_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  dpsHome: get('DPS_URL', 'https://dps-dev.prison.service.justice.gov.uk/', requiredInProduction),
  dpsPrisoner: get(
    'DPS_PRISONER_URL',
    'https://prisoner-dev.digital.prison.service.justice.gov.uk/',
    requiredInProduction,
  ),
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'clientid', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
      systemClientId: get('SYSTEM_CLIENT_ID', 'clientid', requiredInProduction),
      systemClientSecret: get('SYSTEM_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    prisonerSearch: {
      url: get('PRISONER_SEARCH_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('PRISONER_SEARCH_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('PRISONER_SEARCH_API_TIMEOUT_RESPONSE', 10000))),
      pageSize: 10,
      pagesLinksToShow: 3,
    },
    prisonerContactRegistry: {
      url: get('PRISONER_CONTACT_REGISTRY_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: Number(get('PRISONER_CONTACT_REGISTRY_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('PRISONER_CONTACT_REGISTRY_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('PRISONER_CONTACT_REGISTRY_API_TIMEOUT_RESPONSE', 10000))),
    },
    whereabouts: {
      url: get('WHEREABOUTS_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: Number(get('WHEREABOUTS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('WHEREABOUTS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('WHEREABOUTS_API_TIMEOUT_RESPONSE', 10000))),
    },
    audit: {
      queueUrl: get(
        'AUDIT_SQS_QUEUE_URL',
        'http://localhost:4566/000000000000/audit_event_queue',
        requiredInProduction,
      ),
      serviceName: get('AUDIT_SERVICE_NAME', 'book-a-prison-visit-staff-ui', requiredInProduction),
    },
    orchestration: {
      url: get('ORCHESTRATION_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: Number(get('ORCHESTRATION_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('ORCHESTRATION_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('ORCHESTRATION_API_TIMEOUT_RESPONSE', 10000))),
    },
  },
  visit: {
    // Max number of days AFTER a visit that it can be marked CANCELLED
    cancellationLimitDays: Number(get('CANCELLATION_LIMIT_DAYS', 28)),
  },
  features: {
    notificationTypes: {
      enabledRawNotifications: <NotificationTypeRaw[]>(
        get(
          'FEATURE_ENABLED_RAW_NOTIFICATION_TYPES',
          'PRISONER_RECEIVED_EVENT,PRISONER_RELEASED_EVENT,PRISON_VISITS_BLOCKED_FOR_DATE',
        ).split(',')
      ),
    },
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
  environmentName: get('ENVIRONMENT_NAME', ''),
}
