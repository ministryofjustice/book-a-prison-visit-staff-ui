import Page, { PageElement } from '../../page'

export default class LinkVisitorPage extends Page {
  constructor() {
    super('Do you want to notify the booker?')
  }

  getVisitorName = (): PageElement => cy.get(`[data-test=visitor-name]`)

  notifyBooker = (index: number): PageElement => cy.get(`#notifyBooker-${index}`)

  submit = (): PageElement => cy.get('[data-test=submit]').click()
}
