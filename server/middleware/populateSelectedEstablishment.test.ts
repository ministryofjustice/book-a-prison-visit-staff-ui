import { Request, Response } from 'express'
import { SessionData } from 'express-session'
import TestData from '../routes/testutils/testData'
import { createMockSupportedPrisonsService } from '../services/testutils/mocks'
import populateSelectedEstablishment from './populateSelectedEstablishment'
import { user } from '../routes/testutils/appSetup'
import { Services } from '../services'
import { Prison } from '../@types/bapv'

const supportedPrisonsService = createMockSupportedPrisonsService()
const services = { supportedPrisonsService } as unknown as Services

let req: Request
const res = {
  locals: {},
  redirect: jest.fn(),
} as unknown as Response
const next = jest.fn()

const prison = TestData.prison()

const selectedEstablishment: SessionData['selectedEstablishment'] = { ...prison, isEnabledForPublic: true }

describe('populateSelectedEstablishment', () => {
  beforeEach(() => {
    req = { session: {} } as unknown as Request

    user.activeCaseLoadId = prison.prisonId

    res.locals = {
      selectedEstablishment: undefined,
      user,
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('should ignore path /establishment-not-supported', () => {
    it('should call next() if the path is /establishment-not-supported', async () => {
      ;(req.path as string) = '/establishment-not-supported'

      await populateSelectedEstablishment(services)(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      expect(supportedPrisonsService.getPrison).not.toHaveBeenCalled()
    })
  })

  describe('when selected establishment and active case load both set', () => {
    it('should populate res.locals and call next() when they match', async () => {
      user.activeCaseLoadId = prison.prisonId
      req.session.selectedEstablishment = selectedEstablishment

      await populateSelectedEstablishment(services)(req, res, next)

      expect(res.locals.selectedEstablishment).toStrictEqual({ ...prison, isEnabledForPublic: true })
      expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      expect(supportedPrisonsService.getPrison).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('should clear selected establishment and redirect to /back-to-start when they do not match', async () => {
      user.activeCaseLoadId = 'XYZ'
      req.session.selectedEstablishment = selectedEstablishment

      await populateSelectedEstablishment(services)(req, res, next)

      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      expect(supportedPrisonsService.getPrison).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/back-to-start')
    })
  })

  // because front-end components meta data (e.g. activeCaseLoad) only gets set on GET requests
  describe('when selected establishment is set but active case load is not set', () => {
    it('should populate res.locals and call next()', async () => {
      user.activeCaseLoadId = undefined
      req.session.selectedEstablishment = selectedEstablishment

      await populateSelectedEstablishment(services)(req, res, next)

      expect(res.locals.selectedEstablishment).toStrictEqual({ ...prison, isEnabledForPublic: true })
      expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      expect(supportedPrisonsService.getPrison).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  // e.g. new session or after case load change detected
  describe('when selected establishment is not set but active case load is set', () => {
    it('should populate selected establishment when active case load is a supported prison (public enabled)', async () => {
      user.activeCaseLoadId = prison.prisonId
      req.session.selectedEstablishment = undefined

      supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)
      supportedPrisonsService.getPrison.mockResolvedValue(prison)

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.isSupportedPrison).toHaveBeenCalledWith(prison.prisonId)
      expect(supportedPrisonsService.getPrison).toHaveBeenCalledWith(prison.prisonId)
      expect(req.session.selectedEstablishment).toStrictEqual({ ...prison, isEnabledForPublic: true })
      expect(res.locals.selectedEstablishment).toStrictEqual({ ...prison, isEnabledForPublic: true })
      expect(next).toHaveBeenCalled()
    })

    it('should populate selected establishment when active case load is a supported prison (not public enabled)', async () => {
      user.activeCaseLoadId = prison.prisonId
      req.session.selectedEstablishment = undefined

      const prisonNotPublicEnabled: Prison = { ...prison, publicClient: null }
      supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)
      supportedPrisonsService.getPrison.mockResolvedValue(prisonNotPublicEnabled)

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.isSupportedPrison).toHaveBeenCalledWith(prison.prisonId)
      expect(supportedPrisonsService.getPrison).toHaveBeenCalledWith(prison.prisonId)
      expect(req.session.selectedEstablishment).toStrictEqual({ ...prisonNotPublicEnabled, isEnabledForPublic: false })
      expect(res.locals.selectedEstablishment).toStrictEqual({ ...prisonNotPublicEnabled, isEnabledForPublic: false })
      expect(next).toHaveBeenCalled()
    })

    it('should redirect to /establishment-not-supported when active case load is not a supported prison', async () => {
      const unsupportedPrison = TestData.prison({ prisonId: 'XYZ', prisonName: 'XYZ (HMP)' })
      user.activeCaseLoadId = unsupportedPrison.prisonId
      req.session.selectedEstablishment = undefined

      supportedPrisonsService.isSupportedPrison.mockResolvedValue(false)

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.isSupportedPrison).toHaveBeenCalledWith(unsupportedPrison.prisonId)
      expect(supportedPrisonsService.getPrison).not.toHaveBeenCalled()
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(res.redirect).toHaveBeenCalledWith('/establishment-not-supported')
      expect(next).not.toHaveBeenCalled()
    })
  })
})
