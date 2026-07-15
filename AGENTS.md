# Agent Instructions

Use this repo’s docs as the source of truth for setup and operational details:
- [README.md](README.md) for local development, test commands, type generation, maintenance mode, and audit notes
- [helm_deploy/README.md](helm_deploy/README.md) for deployment and Helm usage

## Working Rules

- Prefer the smallest change that fixes the issue at the owning layer.
- Do not edit generated output in `dist/`, coverage artifacts, or test reports unless explicitly asked.
- Keep changes consistent with the existing Express, Nunjucks, and TypeScript patterns in `server/`.
- When adding behavior, update or add the nearest unit test or Playwright spec that exercises the change.

## Build And Test Entry Points

- `npm run build` compiles TypeScript, builds Sass, and copies views into `dist/`.
- `npm run lint` is strict and fails on warnings.
- `npm run test` runs Jest unit tests.
- `npm run int-test` runs Playwright integration tests; they depend on WireMock and must stay serial because the suite uses one worker.
- `npm run start:dev` runs the local watch loop for views, TypeScript, Node, and Sass.

## Project Conventions

- Route handlers live under [server/routes/](server/routes/) and are typically class- or factory-based with adjacent `.test.ts` files.
- Shared service and mock patterns live under [server/services/](server/services/) and [server/services/testutils/](server/services/testutils/).
- Playwright page objects live under [integration_tests/pages/](integration_tests/pages/) and specs under [integration_tests/specs/](integration_tests/specs/).
- Template changes usually require `npm run build` because views are copied into `dist/server/` during the build.
- Custom OpenAPI-derived types live under [server/@types/](server/@types/) and should be updated via the repo’s type-generation flow rather than hand-written from scratch.

## High-Value Files

- [server/app.ts](server/app.ts) for middleware and route wiring.
- [package.json](package.json) for the authoritative scripts.
- [playwright.config.ts](playwright.config.ts) for integration-test constraints and output locations.
- [jest.config.mjs](jest.config.mjs) for unit-test scope and reporting.
