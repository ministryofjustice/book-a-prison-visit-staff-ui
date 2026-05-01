import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import DatePickerComponent from '../components-playwright/datePicker'

export default class VisitsByDatePage extends AbstractPage {
  readonly axeDisabledRules = [
    // Known issue with MoJ Side navigation component when using section headers. See:
    // https://design-patterns.service.justice.gov.uk/components/side-navigation/
    'heading-order',
  ]

  readonly datePicker: DatePickerComponent

  readonly dateTabsToday: Locator

  readonly dateTabsTomorrow: Locator

  readonly activeSessionNavLink: Locator

  readonly visitSessionHeading: Locator

  readonly noResultsMessage: Locator

  readonly bookedOnHeader: Locator

  constructor(page: Page) {
    super(page, 'View visits by date')

    // date picker
    this.datePicker = new DatePickerComponent(page)

    // tabs
    this.dateTabsToday = page.locator(':nth-child(1) > .moj-sub-navigation__link')
    this.dateTabsTomorrow = page.locator(':nth-child(2) > .moj-sub-navigation__link')

    // session navigation
    this.activeSessionNavLink = page.locator('.moj-side-navigation__item--active > a')
    this.bookedOnHeader = page.getByTestId('header-booked-on').locator('button')

    // visit sections
    this.visitSessionHeading = page.getByTestId('visit-session-heading')
    this.noResultsMessage = page.getByTestId('no-visits-message')
  }

  visitSectionHeading(type: string): Locator {
    return this.page.getByTestId(`visit-section-heading-${type}`)
  }

  tablesBookedCount(type: string): Locator {
    return this.page.getByTestId(`visit-tables-booked-${type}`)
  }

  visitorsTotalCount(type: string): Locator {
    return this.page.getByTestId(`visit-visitors-total-${type}`)
  }

  prisonerName(index: number): Locator {
    return this.page.getByTestId('prisoner-name').nth(index)
  }

  prisonerNumber(index: number): Locator {
    return this.page.getByTestId('prisoner-number').nth(index)
  }

  bookedOn(index: number): Locator {
    return this.page.getByTestId('booked-on').nth(index)
  }

  visitStatus(index: number): Locator {
    return this.page.getByTestId('visit-status').nth(index)
  }

  // --- another date form ---
  async toggleChooseAnotherDatePopUp(): Promise<void> {
    await this.page.getByTestId('another-date-button').click()
  }

  async viewSelectedDate(): Promise<void> {
    await this.page.getByTestId('submit').click()
  }

  selectSessionNavItem(index: number): Locator {
    return this.page.locator('.moj-side-navigation__item a').nth(index)
  }
}
