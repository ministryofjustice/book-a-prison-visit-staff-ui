import type axe from 'axe-core'
import logAccessibilityViolations from '../support/logAccessibilityViolations'

export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  static verifyOnPageTitle = <T>(constructor: new (string) => T, title?: string): T => {
    return new constructor(title)
  }

  constructor(
    private readonly title: string,
    private readonly options: { axeTest?: boolean; axeRulesToIgnore?: string[] } = {
      axeTest: true,
    },
  ) {
    this.checkOnPage()
    if (options.axeTest || options.axeRulesToIgnore?.length) {
      this.runAxe(options.axeRulesToIgnore)
    }
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  runAxe = (axeRulesToIgnore: string[] = []): void => {
    // If passed, build set of axe rules to ignore for a particular page class
    const rules: axe.RuleObject = axeRulesToIgnore.reduce((acc, cur) => {
      acc[cur] = { enabled: false }
      return acc
    }, {})

    cy.injectAxe()
    cy.checkA11y(
      null,
      { rules },
      logAccessibilityViolations,
      false, // skipFailures
    )
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  backLink = (): PageElement => cy.get('[class="govuk-back-link"]')
}
