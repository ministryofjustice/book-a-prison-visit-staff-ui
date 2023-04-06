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
    private readonly options: { axeTest?: boolean } = {
      axeTest: true,
    },
  ) {
    this.checkOnPage()

    if (options.axeTest) {
      this.runAxe()
    }
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  runAxe = (): void => {
    cy.injectAxe()
    cy.checkA11y(
      null,
      null,
      logAccessibilityViolations,
      // @TODO remove skipFailures when outstanding issues fixed!
      true, // skipFailures
    )
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  backLink = (): PageElement => cy.get('[class="govuk-back-link"]')
}
