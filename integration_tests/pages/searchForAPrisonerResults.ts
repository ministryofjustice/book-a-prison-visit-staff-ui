import { format } from 'date-fns'
import { Prisoner } from '../../server/data/prisonerOffenderSearchTypes'
import { properCase } from '../../server/utils/utils'
import Page, { PageElement } from './page'

export default class SearchForAPrisonerResultsPage extends Page {
  constructor() {
    super('Search for a prisoner')
  }

  searchForm = (): PageElement => cy.get('[action="/search/prisoner"]')

  searchInput = (): PageElement => cy.get('.moj-search__input')

  searchButton = (): PageElement => cy.get('.moj-search__button')

  noResults = (): PageElement => cy.get('#search-results-none')

  hasResults = (): PageElement => cy.get('#search-results-true')

  resultRows = (): PageElement => cy.get('.bapv-result-row').parent().parent('tr')

  pagingLinks = (): PageElement => cy.get('.moj-pagination__list')

  nextPageLink = (): PageElement => cy.get('.moj-pagination__item--next a').first()

  firstResultLink = (): PageElement => cy.get('.bapv-result-row').first()

  checkResultRows = (prisoners: Prisoner[], searchTerm: string): void => {
    this.resultRows().each((resultRow, index) => {
      cy.wrap(resultRow).within(() => {
        cy.get('td')
          .eq(0)
          .find('a')
          .should('have.attr', 'href', `/prisoner/${prisoners[index].prisonerNumber}?search=${searchTerm}`)
          .contains(`${properCase(prisoners[index].lastName)}, ${properCase(prisoners[index].firstName)}`)
        cy.get('td').eq(1).contains(prisoners[index].prisonerNumber)
        cy.get('td')
          .eq(2)
          .contains(format(new Date(prisoners[index].dateOfBirth), 'd MMMM yyyy'))
      })
    })
  }
}
