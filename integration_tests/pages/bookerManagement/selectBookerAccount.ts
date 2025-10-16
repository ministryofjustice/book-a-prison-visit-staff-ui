import Page from '../page'

export default class SelectBookerAccountPage extends Page {
  constructor() {
    super('Select account to manage')
  }

  continue = (): void => {
    cy.get('[data-test="continue"]').click()
  }
}
