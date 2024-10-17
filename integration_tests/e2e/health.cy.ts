context('Healthcheck', () => {
  context('All healthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubAuthPing')
      cy.task('stubTokenVerificationPing')
      cy.task('stubPrisonerSearchPing')
      cy.task('stubPrisonApiPing')
      cy.task('stubPrisonerContactRegistryPing')
      cy.task('stubWhereaboutsPing')
      cy.task('stubPrisonRegisterPing')
      cy.task('stubOrchestrationPing')

      cy.task('stubAuthToken', {})
    })

    it('Health check page is visible', () => {
      cy.request('/health').its('body.healthy').should('equal', true)
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })

    it('Info is visible and should contain activeAgencies', () => {
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
    it('Reports correctly when token verification down', () => {
      cy.task('reset')
      cy.task('stubAuthPing')
      cy.task('stubTokenVerificationPing', 500)
      cy.task('stubPrisonerSearchPing')
      cy.task('stubPrisonApiPing')
      cy.task('stubPrisonerContactRegistryPing')
      cy.task('stubWhereaboutsPing')
      cy.task('stubPrisonRegisterPing')
      cy.task('stubOrchestrationPing')

      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.checks.hmppsAuth).to.equal('OK')
        expect(response.body.checks.tokenVerification).to.contain({ status: 500, retries: 2 })
      })
    })
  })
})
