# book-a-prison-visit-staff-ui
[![Ministry of Justice Repository Compliance Badge](https://github-community.service.justice.gov.uk/repository-standards/api/book-a-prison-visit-staff-ui/badge?style=flat)](https://github-community.service.justice.gov.uk/repository-standards/book-a-prison-visit-staff-ui)
[![pipeline](https://github.com/ministryofjustice/book-a-prison-visit-staff-ui/actions/workflows/pipeline.yml/badge.svg)](https://github.com/ministryofjustice/book-a-prison-visit-staff-ui)
[![Docker Repository on ghcr](https://img.shields.io/badge/ghcr.io-repository-2496ED.svg?logo=docker)](https://ghcr.io/ministryofjustice/book-a-prison-visit-staff-ui)

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

Install dependencies using `npm install`, ensuring you are using >= `Node v22.x`

Using credentials from the dev namespace, create a `.env` local settings file
```bash
REDIS_HOST=localhost
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
HMPPS_AUTH_EXTERNAL_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
NODE_ENV=development

# Use credentials from the dev namespace for API and SYSTEM client
API_CLIENT_ID=clientid
API_CLIENT_SECRET=clientsecret
SYSTEM_CLIENT_ID=clientid
SYSTEM_CLIENT_SECRET=clientsecret

COMPONENT_API_URL="https://frontend-components-dev.hmpps.service.justice.gov.uk"
ORCHESTRATION_API_URL="https://hmpps-manage-prison-visits-orchestration-dev.prison.service.justice.gov.uk"
PRISONER_SEARCH_API_URL="https://prisoner-search-dev.prison.service.justice.gov.uk"
PRISONER_CONTACT_REGISTRY_API_URL="https://prisoner-contact-registry-dev.prison.service.justice.gov.uk"
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


## Test Coverage Reports
We use jest code coverage to report on test coverage and produce reports for the unit tests.

### Where are the code coverage reports?
In the [CircleCI builds](https://app.circleci.com/pipelines/github/ministryofjustice/book-a-prison-visit-staff-ui) find a `unit_test` job and click on the `ARTIFACTS` tab.

The unit test coverage report can be found at `test_results/jest/coverage/lcov-report/index.html`.

## Visit journeys – book and update
The same booking journey is used both for initially booking a visit and updating an existing visit. The difference between the two and the different API calls required occurs when submitting the 'Select date and time of visit' page (see `POST` handler in [`dateAndTime.ts`](./server/routes/visitJourney/dateAndTime.ts)).

**Booking a new visit**
* first time selecting date/time
  * uses `POST /visits/application/slot/reserve` to create a visit application and gets an application `reference`
* changing date/time (before booking)
  * uses `PUT /visits/application/{reference}/slot/change` to modify the current application

**Updating an existing visit**
* first time selecting date/time (which will have been pre-populated with the existing slot if possible)
  * uses `PUT /visits/application/{bookingReference}/change` to create a new visit application from the existing visit. This gives a **new** application `Reference`
* changing date/time (before booking)
  * also uses `PUT /visits/application/{reference}/slot/change` to modify the current application

In both cases, near the end of the journey (main contact page) there is a further call to update the booking details:
* `PUT /visits/application/{reference}/slot/change` to update/set all the data in the current application

Finally:
* At the end of a booking journey:
  * `PUT /visits/{applicationReference}/book` to complete the application and receive a `Visit` with status `BOOKED`
* At the end of an update journey:
  * `PUT /visits/{applicationReference}/update` to complete the application and receive a `Visit` with status `BOOKED`

## Imported types

Some TypeScript types are imported via the Open API (Swagger) docs, e.g. from the Visits Orchestration Service, Prisoner Contact Registry, etc.

These are stored in [`./server/@types/`](./server/@types/), for example [`./server/@types/orchestration-api.d.ts`](./server/@types/orchestration-api.d.ts). There are also some corresponding files such as [`./server/data/orchestrationApiTypes.ts`](./server/data/orchestrationApiTypes.ts) that contain the particular imported types that are actually used in the project.

For example, to update types for the Orchestration service, use the [API docs URL](https://hmpps-manage-prison-visits-orchestration-dev.prison.service.justice.gov.uk/v3/api-docs) from [Swagger](https://hmpps-manage-prison-visits-orchestration-dev.prison.service.justice.gov.uk/swagger-ui/index.html) and the appropriate output filename:

```
npx openapi-typescript https://hmpps-manage-prison-visits-orchestration-dev.prison.service.justice.gov.uk/v3/api-docs --output ./server/@types/orchestration-api.d.ts
```

The downloaded file will need tidying (e.g. single rather than double quotes, etc):
* `npm run lint-fix` should tidy most of the formatting
* there may be some remaining errors about empty interfaces; these can be fixed be either removing the line or putting `// eslint-disable-next-line @typescript-eslint/no-empty-interface` before.

After updating the types, running the TypeScript complier across the project (`npx tsc`) will show any issues that have been caused by the change.

### Import all types
To download and update all the API types and tidy up the files, run:

```
./bin/update-types.sh
```

## Maintenance page
The application has a maintenance page with a service unavailable message. It can also optionally show a date when the service will be available again. The maintenance page is served for all requests except:
* the 'health check' ones (`/health, /info, /ping`) (`/info` will return an `HTTP 503` if orchestration and/or visit scheduler services are unavailable)
* HMPPS Auth related ones (e.g. `/sign-in`)
Logged in users will still see the DPS header and footer. 

This behaviour is controlled by two environment variables. Default values are in Helm config:
```
  MAINTENANCE_MODE: "false"
  # Optional maintenance end date (in ISO format, YYYY-MM-DDTHH:MM)
  MAINTENANCE_MODE_END_DATE_TIME: ""
```

To see the current state of these variables, use this command:
```
# example is for 'dev' namespace; replace with 'prod' as appropriate

kubectl -n visit-someone-in-prison-frontend-svc-dev set env deployment/book-a-prison-visit-staff-ui --list
```

Maintenance mode can be turned on by either:
* changing the values for an environment (e.g. prod) in Helm config, committing and deploying
* manually changing the values for an environment and restarting the pods


### Manually enabling maintenance mode
To turn on maintenance mode, use one of these commands (depending on whether an end date and time should be shown):
```
# examples are for 'dev' namespace; replace with 'prod' as appropriate

# Enable maintenance with no end date and time displayed
kubectl -n visit-someone-in-prison-frontend-svc-dev set env deployment/book-a-prison-visit-staff-ui MAINTENANCE_MODE=true

# Enable maintenance page that includes an end date and time
kubectl -n visit-someone-in-prison-frontend-svc-dev set env deployment/book-a-prison-visit-staff-ui MAINTENANCE_MODE=true MAINTENANCE_MODE_END_DATE_TIME=2025-10-01T14:00
```

This will update the environment variables and restart the pods. To see the status of pods, use:
```
kubectl -n visit-someone-in-prison-frontend-svc-dev get pods
```
Once these are restarted, the maintenance page will be active.


### Manually disabling maintenance mode
To turn off maintenance mode, run this command:
```
# example is for 'dev' namespace; replace with 'prod' as appropriate

kubectl -n visit-someone-in-prison-frontend-svc-dev set env deployment/book-a-prison-visit-staff-ui MAINTENANCE_MODE=false
```
This will update the environment variables and restart the pods. Once these are restarted, the maintenance page will be turned off.


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
