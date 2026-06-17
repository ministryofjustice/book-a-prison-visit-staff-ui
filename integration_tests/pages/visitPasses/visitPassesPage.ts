import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class VisitPassesPage extends AbstractPage {
  readonly printAll: Locator

  readonly prisonName: Locator

  readonly visitDate: Locator

  readonly visitTime: Locator

  readonly prisonerName: Locator

  readonly prisonNumber: Locator

  readonly reference: Locator

  readonly visitType: Locator

  readonly visitor: Locator

  constructor(page: Page, title: string) {
    super(page, title)

    this.printAll = page.getByRole('button', { name: 'Print all' })
  }

  getPrisonName(index: number): Locator {
    return this.page.getByTestId(`visit-${index}-prison-name`)
  }

  getVisitDate(index: number): Locator {
    return this.page.getByTestId(`visit-${index}-date`)
  }

  getVisitTime(index: number): Locator {
    return this.page.getByTestId(`visit-${index}-time`)
  }

  getPrisonerName(index: number): Locator {
    return this.page.getByTestId(`visit-${index}-prisoner-name`)
  }

  getPrisonNumber(index: number): Locator {
    return this.page.getByTestId(`visit-${index}-prison-number`)
  }

  getReference(index: number): Locator {
    return this.page.getByTestId(`visit-${index}-reference`)
  }

  getVisitType(index: number): Locator {
    return this.page.getByTestId(`visit-${index}-visit-type`)
  }

  getVisitor(passIndex: number, visitorIndex: number): Locator {
    return this.page.getByTestId(`visit-${passIndex}-visitor-${visitorIndex}`)
  }

  async printAllAndCheckForPrintDialog(): Promise<void> {
    await this.page.evaluate('(() => {window.waitForPrintDialog = new Promise(f => window.print = f);})()')
    await this.printAll.click()
    await this.page.waitForFunction('window.waitForPrintDialog')
  }
}
