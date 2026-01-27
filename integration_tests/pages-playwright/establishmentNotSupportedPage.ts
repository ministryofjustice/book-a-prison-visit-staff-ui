import { type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class EstablishmentNotSupportedPage extends AbstractPage {
  constructor(page: Page, title: string) {
    super(page, title)
  }
}
