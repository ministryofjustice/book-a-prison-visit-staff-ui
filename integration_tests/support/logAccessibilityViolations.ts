import type { Result } from 'axe-core'

const logAccessibilityViolations = (violations: Result[]) => {
  cy.task('log', `\n${violations.length} accessibility violation(s) detected`)

  const violationData = violations.map(({ id, impact, description, nodes }) => ({
    id,
    impact,
    description,
    nodes: nodes.length,
  }))

  cy.task('table', violationData)
}

export default logAccessibilityViolations
