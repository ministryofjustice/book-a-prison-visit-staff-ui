import type { Express } from 'express'
import request from 'supertest'
import * as cheerio from 'cheerio'
import { SessionData } from 'express-session'
import { appWithAllRoutes, FlashData, flashProvider, user } from '../../testutils/appSetup'
import { createMockAuditService, createMockBookerService } from '../../../services/testutils/mocks'
import bapvUserRoles from '../../../constants/bapvUserRoles'
import TestData from '../../testutils/testData'
import { MoJAlert } from '../../../@types/bapv'

let app: Express
let flashData: FlashData
let sessionData: SessionData

const auditService = createMockAuditService()
const bookerService = createMockBookerService()

const booker = TestData.bookerDetailedInfo()
const prisoner = TestData.bookerPrisoner()
const visitor = TestData.bookerPrisonerVisitor()
const url = `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}/link-visitor/${visitor.visitorId}/notify`

beforeEach(() => {
  flashData = { messages: [] }
  flashProvider.mockImplementation((key: keyof FlashData) => flashData[key])

  sessionData = {
    bookerLinkVisitor: {
      reference: booker.reference,
      prisonerId: prisoner.prisonerNumber,
      nonLinkedContacts: [visitor],
    },
  } as SessionData

  app = appWithAllRoutes({
    services: { auditService, bookerService },
    userSupplier: () => ({ ...user, userRoles: [bapvUserRoles.BOOKER_ADMIN] }),
    sessionData,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('Booker management - link visitor with optional notification', () => {
  describe(`GET ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).get(url).expect(302).expect('location', '/authError')
    })

    it('should reject an invalid booker reference', () => {
      return request(app)
        .get(
          `/manage-bookers/INVALID-BOOKER-REFERENCE/prisoner/${prisoner.prisonerNumber}/link-visitor/${visitor.visitorId}/notify`,
        )
        .expect(400)
    })

    it('should render do you want to notify booker page', () => {
      const socialContact = TestData.socialContact()
      bookerService.getBookerDetails.mockResolvedValue(booker)
      bookerService.getNonLinkedSocialContacts.mockResolvedValue([socialContact])

      return request(app)
        .get(url)
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          // Page header
          expect($('title').text()).toMatch(/^Notify the booker about the linked visitor -/)
          expect($('.govuk-breadcrumbs li').length).toBe(0)
          expect($('.govuk-back-link').attr('href')).toBe(
            `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}/link-visitor`,
          )
          expect($('h1').text()).toBe('Do you want to notify the booker?')

          // Form
          expect($('input[name=notifyBooker]').length).toBe(2)
          expect($('[data-test=submit]').parent('form').attr('action')).toBe(url)
          expect($('[data-test=submit]').text().trim()).toBe('Submit')
        })
    })

    it('should redirect to booker details page if no booker visitor list in session', () => {
      delete sessionData.bookerLinkVisitor
      return request(app).get(url).expect(302).expect('location', `/manage-bookers/${booker.reference}/booker-details`)
    })

    it('should redirect to link approved visitor list page if prisonerId in URL does not match value in session', () => {
      sessionData.bookerLinkVisitor.prisonerId = 'B2345CD'
      return request(app)
        .get(url)
        .expect(302)
        .expect('location', `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}/link-visitor`)
    })

    it('should redirect to link approved visitor list page if visitorID in URL does not match a value in session', () => {
      sessionData.bookerLinkVisitor.nonLinkedContacts = [{ ...visitor, visitorId: 0 }]
      return request(app)
        .get(url)
        .expect(302)
        .expect('location', `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}/link-visitor`)
    })
  })

  describe(`POST ${url}`, () => {
    it('should require booker admin role', () => {
      app = appWithAllRoutes({ services: { auditService, bookerService } })
      return request(app).post(url).expect(302).expect('location', '/authError')
    })

    it('should reject an invalid booker reference', () => {
      return request(app)
        .post(
          `/manage-bookers/INVALID-BOOKER-REFERENCE/prisoner/${prisoner.prisonerNumber}/link-visitor/${visitor.visitorId}/notify`,
        )
        .expect(400)
    })

    it('should link visitor, set success message, send audit, clear session then redirect to booker details page', () => {
      return request(app)
        .post(url)
        .send({ notifyBooker: 'yes' })
        .expect(302)
        .expect('location', `/manage-bookers/${booker.reference}/booker-details`)
        .expect(() => {
          expect(bookerService.linkBookerVisitor).toHaveBeenCalledWith({
            username: 'user1',
            reference: booker.reference,
            prisonerId: prisoner.prisonerNumber,
            visitorId: visitor.visitorId,
            sendNotification: true,
          })

          expect(flashProvider).toHaveBeenCalledWith('messages', <MoJAlert>{
            variant: 'success',
            title: 'Jeanette Smith has been linked to this booker.',
            text: '',
            dismissible: true,
          })

          expect(auditService.linkedBookerVisitor).toHaveBeenCalledWith({
            reference: booker.reference,
            prisonerId: prisoner.prisonerNumber,
            visitorId: visitor.visitorId.toString(),
            username: 'user1',
            operationId: undefined,
          })

          expect(sessionData.bookerLinkVisitor).toBeUndefined()
        })
    })

    it('should redirect to booker details page if no booker visitor list in session', () => {
      delete sessionData.bookerLinkVisitor
      return request(app)
        .post(url)
        .send({ notifyBooker: 'yes' })
        .expect(302)
        .expect('location', `/manage-bookers/${booker.reference}/booker-details`)
    })

    it('should redirect to link approved visitor list page if prisonerId in URL does not match value in session', () => {
      sessionData.bookerLinkVisitor.prisonerId = 'B2345CD'
      return request(app)
        .post(url)
        .send({ notifyBooker: 'yes' })
        .expect(302)
        .expect('location', `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}/link-visitor`)
    })

    it('should redirect to link approved visitor list page if visitorID in URL does not match a value in session', () => {
      sessionData.bookerLinkVisitor.nonLinkedContacts = [{ ...visitor, visitorId: 0 }]
      return request(app)
        .post(url)
        .send({ notifyBooker: 'yes' })
        .expect(302)
        .expect('location', `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}/link-visitor`)
    })

    it('should redirect to link approved visitor list page if specified visitor has no DoB', () => {
      sessionData.bookerLinkVisitor.nonLinkedContacts = [{ ...visitor, dateOfBirth: null }]
      return request(app)
        .post(url)
        .send({ notifyBooker: 'yes' })
        .expect(302)
        .expect('location', `/manage-bookers/${booker.reference}/prisoner/${prisoner.prisonerNumber}/link-visitor`)
    })
  })
})
