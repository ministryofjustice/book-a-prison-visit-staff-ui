import { type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class EstablishmentNotSupportedPage extends AbstractPage {
  constructor(page: Page, prisonName: string) {
    super(page, `${prisonName} does not use this service`)
  }
}
