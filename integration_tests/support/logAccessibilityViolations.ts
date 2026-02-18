import type { Result } from 'axe-core'

/* eslint-disable no-console */
const logAccessibilityViolations = (violations: Result[]) => {
  console.log(`\n${violations.length} accessibility violation(s) detected`)

  const violationData = violations.map(({ id, impact, description, nodes }) => ({
    id,
    impact,
    description,
    nodes: nodes.length,
  }))

  console.table(violationData)
}

export default logAccessibilityViolations
