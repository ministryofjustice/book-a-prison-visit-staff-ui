import Page, { PageElement } from './page'

export default class ChangeEstablishmentPage extends Page {
  constructor() {
    super('Select establishment')
  }

  selectEstablishment = (prisonId: string): void => {
    cy.get(`#${prisonId}`).check({ force: true })
  }

  continueButton = (): PageElement => cy.get('[data-test=submit]')
}
