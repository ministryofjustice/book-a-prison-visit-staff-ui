import { type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class VisitDetailsPage extends AbstractPage {
  // Visit details
  readonly visitDate: Locator

  readonly visitTime: Locator

  readonly visitRoom: Locator

  readonly visitType: Locator

  readonly visitContact: Locator

  readonly visitPhone: Locator

  readonly visitEmail: Locator

  readonly visitReference: Locator

  readonly additionalSupport: Locator

  // Prisoner details
  readonly prisonerName: Locator

  readonly prisonerNumber: Locator

  readonly prisonerLocation: Locator

  readonly prisonerDob: Locator

  readonly prisonerAge: Locator

  // Buttons
  readonly updateBooking: Locator

  readonly cancelBooking: Locator

  readonly clearNotifications: Locator

  readonly approveRequest: Locator

  readonly rejectRequest: Locator

  constructor(page: Page, title: string) {
    super(page, title)

    // Visit details
    this.visitDate = page.getByTestId('visit-date')
    this.visitTime = page.getByTestId('visit-time')
    this.visitRoom = page.getByTestId('visit-room')
    this.visitType = page.getByTestId('visit-type')
    this.visitContact = page.getByTestId('visit-contact')
    this.visitPhone = page.getByTestId('visit-phone')
    this.visitEmail = page.getByTestId('visit-email')
    this.visitReference = page.getByTestId('reference')
    this.additionalSupport = page.getByTestId('additional-support')

    // Prisoner details
    this.prisonerName = page.getByTestId('prisoner-name')
    this.prisonerNumber = page.getByTestId('prisoner-number')
    this.prisonerLocation = page.getByTestId('prisoner-location')
    this.prisonerDob = page.getByTestId('prisoner-dob')
    this.prisonerAge = page.getByTestId('prisoner-age')

    // Buttons
    this.updateBooking = page.getByTestId('update-visit')
    this.cancelBooking = page.getByTestId('cancel-visit')
    this.clearNotifications = page.getByTestId('clear-notifications')
    this.approveRequest = page.getByTestId('approve-visit-request')
    this.rejectRequest = page.getByTestId('reject-visit-request')
  }

  // Dynamic locators

  prisonerRestriction(index: number): Locator {
    return this.page.getByTestId(`prisoner-restriction-${index}`)
  }

  prisonerAlert(index: number): Locator {
    return this.page.getByTestId(`prisoner-alert-${index}`)
  }

  visitorName(index: number): Locator {
    return this.page.getByTestId(`visitor-name-${index}`)
  }

  visitorRelation(index: number): Locator {
    return this.page.getByTestId(`visitor-relation-${index}`)
  }

  visitorRestriction(visitorIndex: number, index: number): Locator {
    return this.page.getByTestId(`visitor-${visitorIndex}-restriction-${index}`)
  }

  // Visit history
  eventHeader(index: number): Locator {
    return this.page.getByTestId(`timeline-entry-${index}`).locator('.moj-timeline__title')
  }

  actionedBy(index: number): Locator {
    return this.page.getByTestId(`timeline-entry-${index}`).locator('.moj-timeline__byline')
  }

  eventTime(index: number): Locator {
    return this.page.getByTestId(`timeline-entry-${index}`).locator('time')
  }

  eventDescription(index: number): Locator {
    return this.page.getByTestId(`timeline-entry-${index}`).locator('.moj-timeline__description')
  }
}
