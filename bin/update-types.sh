#!/bin/sh

# Download API definitions and update TypeScript files
# Also automatically tidies and fixes linting issues

APIS='{
  "apis": [
    {
      "api": "orchestration-api",
      "url": "https://hmpps-manage-prison-visits-orchestration-dev.prison.service.justice.gov.uk/v3/api-docs"
    },
    {
      "api": "prison-api",
      "url": "https://prison-api-dev.prison.service.justice.gov.uk/v3/api-docs"
    },
    {
      "api": "prison-register-api",
      "url": "https://prison-register-dev.hmpps.service.justice.gov.uk/v3/api-docs"
    },
    {
      "api": "prisoner-contact-registry-api",
      "url": "https://prisoner-contact-registry-dev.prison.service.justice.gov.uk/v3/api-docs"
    },
    {
      "api": "prisoner-offender-search-api",
      "url": "https://prisoner-search-dev.prison.service.justice.gov.uk/v3/api-docs"
    },
    {
      "api": "whereabouts-api",
      "url": "https://whereabouts-api-dev.service.justice.gov.uk/v3/api-docs"
    }
  ]
}'

echo $APIS | jq -c '.apis[]' | while read API; do
  API_NAME=$(jq -r '.api' <<< $API)
  API_URL=$(jq -r '.url' <<< $API)

  echo "\nProcessing $API_NAME..."

  npx openapi-typescript $API_URL --output "./server/@types/$API_NAME.d.ts"

  echo "..tidying up..."
  sed -i '' 's/^export interface external {}$/\/\/ eslint-disable-next-line @typescript-eslint\/no-empty-interface\n&/'  "./server/@types/$API_NAME.d.ts"
  npx eslint  "./server/@types/$API_NAME.d.ts" --fix
done

echo "\nNow running type check:"
npm run typecheck