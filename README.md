# book-a-prison-visit-staff-ui
Staff UI for new Manage a Prison Visit project.

## Running the app
The easiest way to run the app is to use docker compose to create the service and all dependencies. 

`docker-compose pull`

`docker-compose up`

### Dependencies
The app requires: 
* hmpps-auth - for authentication
* redis - session store and token caching

### Running the app for development

To start the main services excluding the app itself: 

`docker-compose up --scale=app=0`

Or, to start just Redis if using HMPPS Auth dev:

`docker-compose up redis-bapv`

Install dependencies using `npm install`, ensuring you are using >= `Node v16.x`

Using your personal client credentials, create a `.env` local settings file
```bash
REDIS_HOST=localhost
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
HMPPS_AUTH_EXTERNAL_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
NOMIS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
NODE_ENV=development

# Use personal client credentials for API and SYSTEM client
API_CLIENT_ID=clientid
API_CLIENT_SECRET=clientsecret
SYSTEM_CLIENT_ID=clientid
SYSTEM_CLIENT_SECRET=clientsecret

PRISONER_SEARCH_API_URL="https://prisoner-offender-search-dev.prison.service.justice.gov.uk"
PRISON_API_URL="https://api-dev.prison.service.justice.gov.uk"
VISIT_SCHEDULER_API_URL="https://visit-scheduler-dev.prison.service.justice.gov.uk"
PRISONER_CONTACT_REGISTRY_API_URL="https://prisoner-contact-registry-dev.prison.service.justice.gov.uk"
WHEREABOUTS_API_URL="https://whereabouts-api-dev.service.justice.gov.uk"
```

And then, to build the assets and start the app with nodemon:

`npm run start:dev`

### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

For local running, start a test db, redis, and wiremock instance by:

`docker-compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with nodemon)

And then either, run tests in headless mode with:

`npm run int-test`
 
Or run tests with the cypress UI:

`npm run int-test-ui`


### Dependency Checks

The template project has implemented some scheduled checks to ensure that key dependencies are kept up to date.
If these are not desired in the cloned project, remove references to `check_outdated` job from `.circleci/config.yml`

## User audit
To record an audit trail of user actions, events are sent to the [hmpps-audit-api](https://github.com/ministryofjustice/hmpps-audit-api) service SQS queue. Currently, the following are audited (see [auditService.ts](./server/services/auditService.ts) and [auditService.test.ts](./server/services/auditService.test.ts) for details of what is logged):

* `BOOKED_VISIT`
* `CANCELLED_VISIT`
* `OVERRODE_ZERO_VO`
* `PRINTED_VISIT_LIST` (unused - feature not yet implemented)
* `RESERVED_VISIT`
* `SEARCHED_PRISONERS`
* `SEARCHED_VISITS`
* `VIEWED_PRISONER`
* `VIEWED_VISIT_DETAILS`
* `VIEWED_VISITS`
* `VISIT_RESTRICTION_SELECTED`

### Diagnosing audit problems
At present there isn't a simple way to retrieve specific data from the audit service. However, using [Application Insights](https://portal.azure.com/#home) logs, it is possible to see whether messages are either being successfully ingested or instead ending up on the audit service's DLQ (dead-letter queue). For example:

* To see SQS massages being sent from this application:
```
traces
| where cloud_RoleName == "book-a-prison-visit-staff-ui"
| where message has "SQS message sent"
```
The `operation_Id` from these can be looked up in Application Insights' 'Transaction search' to bring up related information.

* To see messages being successfully accepted by the audit service:
```
customEvents
| where cloud_RoleName == "hmpps-audit-api"
| where customDimensions.service == "book-a-prison-visit-staff-ui" 
```

* To see failures - e.g. messages that will end up on DLQ:
```
exceptions
| where cloud_RoleName == "hmpps-audit-api"
| where method has "book-a-prison-visit-staff-ui"
```
