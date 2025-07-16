import Page, { PageElement } from '../page'

export default class SelectVisitTypePage extends Page {
  constructor() {
    super(`Check the prisoner's closed visit restrictions`)
  }

  getPrisonerRestrictionType = (index: number): PageElement =>
    cy.get(`.prisoner-restrictions .test-restrictions-type${index}`)

  selectOpenVisitType = (): void => {
    cy.get('[data-test="visit-type-open"]').check()
  }

  selectClosedVisitType = (): void => {
    cy.get('[data-test="visit-type-closed"]').check()
  }

  submitButton = (): PageElement => cy.get('[data-test=submit]')
}
