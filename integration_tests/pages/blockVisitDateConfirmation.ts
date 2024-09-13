import Page from './page'

export default class BlockVisitDateConfirmationPage extends Page {
  constructor(date: string) {
    super(`Are you sure you want to block visits on ${date}?`)
  }

  noExistingBookings = (): void => {
    cy.get('[data-test="no-existing-bookings"]')
  }

  selectYes = (): void => {
    cy.get('input[name=confirmBlockDate][value=yes]').check()
  }

  continue = (): void => {
    cy.get('[data-test="submit"]').click()
  }
}
