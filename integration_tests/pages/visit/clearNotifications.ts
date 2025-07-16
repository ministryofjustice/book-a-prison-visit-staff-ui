import Page from '../page'

export default class ClearNotificationsPage extends Page {
  constructor() {
    super('Are you sure the visit does not need to be updated or cancelled?', {
      // Known issue with radio conditional reveal. See:
      // https://github.com/alphagov/govuk-frontend/issues/979
      axeRulesToIgnore: ['aria-allowed-attr'],
    })
  }

  selectYes = (): void => {
    cy.get('[data-test="clear-notification-yes"]').check()
  }

  enterReason = (reason: string): void => {
    cy.get('#clearReason').type(reason)
  }

  submit = (): void => {
    cy.get('[data-test="submit"]').click()
  }
}
