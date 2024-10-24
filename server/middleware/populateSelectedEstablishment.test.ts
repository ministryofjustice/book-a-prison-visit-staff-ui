import { Request, Response } from 'express'
import TestData from '../routes/testutils/testData'
import { createMockSupportedPrisonsService } from '../services/testutils/mocks'
import populateSelectedEstablishment from './populateSelectedEstablishment'
import { user } from '../routes/testutils/appSetup'
import { Services } from '../services'

const supportedPrisonsService = createMockSupportedPrisonsService()
const services = { supportedPrisonsService } as unknown as Services

const supportedPrisons = TestData.supportedPrisons()

let req: Request
const res = {
  locals: {},
  redirect: jest.fn(),
} as unknown as Response
const next = jest.fn()

describe('populateSelectedEstablishment', () => {
  beforeEach(() => {
    req = { session: {} } as unknown as Request

    user.activeCaseLoadId = 'HEI'

    res.locals = {
      selectedEstablishment: undefined,
      user,
    }

    supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when establishment not already set in session', () => {
    it('should set establishment in session and populate res.locals if active caseload is a supported prison', async () => {
      res.locals.user.activeCaseLoadId = 'BLI'
      const prison = TestData.prison({ prisonId: 'BLI', prisonName: 'Bristol (HMP)' })
      supportedPrisonsService.getPrison.mockResolvedValue(prison)

      await populateSelectedEstablishment(services)(req, res, next)
      await new Promise(process.nextTick)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledWith('user1')
      expect(supportedPrisonsService.getPrison).toHaveBeenCalledWith('user1', 'BLI')
      expect(req.session.selectedEstablishment).toStrictEqual(prison)
      expect(res.locals.selectedEstablishment).toStrictEqual(prison)
      expect(next).toHaveBeenCalled()
    })

    it('should redirect to /establishment-not-supported if no establishment set and active caseload is not a supported prison', async () => {
      res.locals.user.activeCaseLoadId = 'XYZ'

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledWith('user1')
      expect(res.redirect).toHaveBeenCalledWith('/establishment-not-supported')
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(next).not.toHaveBeenCalled()
    })

    it('should redirect to /establishment-not-supported if no establishment set and active caseload is not set', async () => {
      res.locals.user.activeCaseLoadId = undefined

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledWith('user1')
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(res.redirect).toHaveBeenCalledWith('/establishment-not-supported')
      expect(next).not.toHaveBeenCalled()
    })

    it('should make no changes and not redirect if request path is /establishment-not-supported', async () => {
      ;(req.path as string) = '/establishment-not-supported'

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(0)
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(res.redirect).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('when establishment already set in session', () => {
    it('should populate res.locals with selected establishment without prisons lookup', async () => {
      req.session.selectedEstablishment = TestData.prison()

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(res.locals.selectedEstablishment).toStrictEqual(req.session.selectedEstablishment)
      expect(next).toHaveBeenCalled()
    })

    it('should populate res.locals with already selected establishment without prisons lookup if active caseload changes', async () => {
      res.locals.user.activeCaseLoadId = 'BLI'
      req.session.selectedEstablishment = TestData.prison({ prisonId: 'BLI', prisonName: 'Bristol (HMP)' })

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(res.locals.selectedEstablishment).toStrictEqual(req.session.selectedEstablishment)
      expect(next).toHaveBeenCalled()
    })

    it('should make no changes and not redirect if request path is /establishment-not-supported', async () => {
      ;(req.path as string) = '/establishment-not-supported'
      res.locals.user.activeCaseLoadId = 'BLI'
      req.session.selectedEstablishment = TestData.prison()

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(res.locals.user.activeCaseLoadId).toBe('BLI')
      expect(res.locals.selectedEstablishment).toBe(req.session.selectedEstablishment)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('when establishment and active case load both set and do not match', () => {
    it('should clear selected establishment and redirect to /back-to-start', async () => {
      res.locals.user.activeCaseLoadId = 'BLI'
      req.session.selectedEstablishment = TestData.prison()

      await populateSelectedEstablishment(services)(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/back-to-start')
      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('when establishment and active case load are both undefined', () => {
    it('should redirect to /establishment-not-supported', async () => {
      res.locals.user.activeCaseLoadId = undefined

      await populateSelectedEstablishment(services)(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/establishment-not-supported')
      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledWith('user1')
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(next).not.toHaveBeenCalled()
    })
  })
})
