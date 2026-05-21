import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class VisitPassesPage extends AbstractPage {
  readonly printAll: Locator

  constructor(page: Page) {
    super(page, 'Print visit passes')

    this.printAll = page.getByRole('button', { name: 'Print all' })
  }

  async printAllAndCheckForPrintDialog(): Promise<void> {
    await this.page.evaluate('(() => {window.waitForPrintDialog = new Promise(f => window.print = f);})()')
    await this.printAll.click()
    await this.page.waitForFunction('window.waitForPrintDialog')
  }
}
