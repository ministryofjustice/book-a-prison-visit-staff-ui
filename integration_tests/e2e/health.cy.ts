context('Healthcheck', () => {
  context('All healthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubAuthPing')
      cy.task('stubTokenVerificationPing')
      cy.task('stubPrisonerSearchPing')
      cy.task('stubPrisonerContactRegistryPing')
      cy.task('stubOrchestrationPing')

      cy.task('stubAuthToken', {})
    })

    it('Health check page is visible', () => {
      cy.request('/health').its('body.status').should('equal', 'UP')
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })

    it.skip('Info is visible and should contain activeAgencies', () => {
      cy.task('stubSupportedPrisonIds')

      cy.request('/info')
        .its('body.activeAgencies')
        .should('be.an', 'array')
        .should('have.length', '2')
        .then(activeAgencies => {
          cy.wrap(activeAgencies).its(0).should('equal', 'HEI')
          cy.wrap(activeAgencies).its(1).should('equal', 'BLI')
        })
    })

    it('Info returns 503 Service unavailable if there is an error getting activeAgencies', () => {
      cy.task('stubSupportedPrisonIdsError')

      cy.request({ url: '/info', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.status).to.equal(503)
        expect(response.body).to.equal('')
      })
    })
  })

  context('Some unhealthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubAuthPing')
      cy.task('stubTokenVerificationPing', 500)
      cy.task('stubPrisonerSearchPing')
      cy.task('stubPrisonerContactRegistryPing')
      cy.task('stubOrchestrationPing')
    })

    it('Reports correctly when token verification down', () => {
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.components.hmppsAuth.status).to.equal('UP')
        expect(response.body.components.tokenVerification.status).to.equal('DOWN')
        expect(response.body.components.tokenVerification.details).to.contain({ status: 500, attempts: 3 })
      })
    })

    it('Health check page is visible and DOWN', () => {
      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).its('body.status').should('equal', 'DOWN')
    })
  })
})
