context('Healthcheck', () => {
  context('All healthy', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubAuthPing')
      cy.task('stubManageUsersPing')
      cy.task('stubTokenVerificationPing')
      cy.task('stubNomisUserRolesPing')
      cy.task('stubPrisonerSearchPing')
      cy.task('stubPrisonApiPing')
      cy.task('stubPrisonerContactRegistryPing')
      cy.task('stubWhereaboutsPing')
      cy.task('stubPrisonRegisterPing')
      cy.task('stubOrchestrationPing')
    })

    it('Health check page is visible', () => {
      cy.request('/health').its('body.healthy').should('equal', true)
    })

    it('Ping is visible and UP', () => {
      cy.request('/ping').its('body.status').should('equal', 'UP')
    })

    it('Info is visible', () => {
      cy.request('/info').its('body').should('exist')
    })

    it('Info contains activeAgencies array', () => {
      // TODO this should test the actual agencies
      cy.request('/info').its('body.activeAgencies').should('be.an', 'array')
    })
  })

  context('Some unhealthy', () => {
    it('Reports correctly when token verification down', () => {
      cy.task('reset')
      cy.task('stubAuthPing')
      cy.task('stubTokenVerificationPing', 500)

      cy.request({ url: '/health', method: 'GET', failOnStatusCode: false }).then(response => {
        expect(response.body.checks.hmppsAuth).to.equal('OK')
        expect(response.body.checks.tokenVerification).to.contain({ status: 500, retries: 2 })
      })
    })
  })
})
