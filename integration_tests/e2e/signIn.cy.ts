import HomePage from '../pages/home'
import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'
import AuthorisationErrorPage from '../pages/authorisationError'

context('SignIn', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubSupportedPrisonIds')
    cy.task('stubGetPrison')
    cy.task('stubGetNotificationCount', {})
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in header', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.headerUserName().should('contain.text', 'J. Smith')
  })

  it('User can log out', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    homePage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn()
    Page.verifyOnPage(HomePage)
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure clears user session', () => {
    cy.signIn()
    const homePage = Page.verifyOnPage(HomePage)
    cy.task('stubVerifyToken', false)

    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)

    cy.task('stubVerifyToken', true)
    cy.task('stubSignIn', { userToken: { name: 'bobby brown', roles: ['ROLE_MANAGE_PRISON_VISITS'] } })

    cy.signIn()

    homePage.headerUserName().contains('B. Brown')
  })

  it('User without required role is directed to Authorisation Error page', () => {
    cy.task('stubSignIn', { userToken: { roles: ['SOME_OTHER_ROLE'] } })
    cy.signIn({ failOnStatusCode: false })
    const authorisationErrorPage = Page.verifyOnPage(AuthorisationErrorPage)
    authorisationErrorPage.message().contains('You are not authorised to use this application')
  })
})
