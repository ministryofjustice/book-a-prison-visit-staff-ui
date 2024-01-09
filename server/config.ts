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
  buildNumber: get('BUILD_NUMBER', '1_0_0', requiredInProduction),
  gitRef: get('GIT_REF', 'xxxxxxxxxxxxxxxxxxx', requiredInProduction),
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
  dpsHome: get('DPS_URL', 'https://digital-dev.prison.service.justice.gov.uk/', requiredInProduction),
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
    manageUsersApi: {
      url: get('MANAGE_USERS_API_URL', 'http://localhost:9091', requiredInProduction),
      timeout: {
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000))),
    },
    nomisUserRolesApi: {
      url: get('NOMIS_USER_ROLES_API_URL', 'http://localhost:9091', requiredInProduction),
      timeout: {
        response: Number(get('NOMIS_USER_ROLES_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('NOMIS_USER_ROLES_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('NOMIS_USER_ROLES_API_TIMEOUT_RESPONSE', 10000))),
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
    prison: {
      url: get('PRISON_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: Number(get('PRISONER_DETAILS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('PRISONER_DETAILS_API_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('PRISONER_DETAILS_API_TIMEOUT_RESPONSE', 10000))),
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
    prisonRegister: {
      url: get('PRISON_REGISTER_API_URL', 'http://localhost:8080', requiredInProduction),
      timeout: {
        response: Number(get('PRISON_REGISTER_API_URL_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('PRISON_REGISTER_API_URL_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('PRISON_REGISTER_API_URL_TIMEOUT_RESPONSE', 10000))),
    },
    audit: {
      queueUrl: get(
        'AUDIT_SQS_QUEUE_URL',
        'http://localhost:4566/000000000000/audit_event_queue',
        requiredInProduction,
      ),
      serviceName: get('AUDIT_SERVICE_NAME', 'book-a-prison-visit-staff-ui', requiredInProduction),
    },
    notifications: {
      enabled: get('SMS_NOTIFICATIONS_ENABLED', 'false', requiredInProduction) === 'true',
      key: get('GOVUK_NOTIFY_API_KEY', 'abcd', requiredInProduction),
      templates: {
        bookingConfirmation: '85904166-e539-43f5-9f51-7ba106cc61bd',
        cancellationConfirmation: '42a995f2-abbc-474b-8563-ca2995529111',
        cancellationConfirmationNoPrisonPhone: '3103b319-267d-4265-83a6-a38e93fc2342',
        updateConfirmation: '386e83ff-5734-4d99-8279-b3eacb7cc8b8',
      },
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
  features: {
    showReviewBookingsTile: get('FEATURE_REVIEW_BOOKINGS', 'false', requiredInProduction) === 'true',
  },
  domain: get('INGRESS_URL', 'http://localhost:3000', requiredInProduction),
}
