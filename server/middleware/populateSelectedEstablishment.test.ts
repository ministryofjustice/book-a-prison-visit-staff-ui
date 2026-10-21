import { Request, Response } from 'express'
import TestData from '../routes/testutils/testData'
import { createMockSupportedPrisonsService } from '../services/testutils/mocks'
import populateSelectedEstablishment from './populateSelectedEstablishment'
import { user } from '../routes/testutils/appSetup'
import { Services } from '../services'

const supportedPrisonsService = createMockSupportedPrisonsService()
const services = { supportedPrisonsService } as unknown as Services

let req: Request
const res = {
  locals: {},
  redirect: jest.fn(),
} as unknown as Response
const next = jest.fn()

const prison = TestData.prison()

describe('populateSelectedEstablishment', () => {
  beforeEach(() => {
    req = { session: {} } as unknown as Request

    res.locals = {
      user,
    } as Express.Locals

    supportedPrisonsService.getPrison.mockResolvedValue(prison)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('should ignore path /establishment-not-supported', () => {
    it('should call next() if the path is /establishment-not-supported', async () => {
      ;(req.path as string) = '/establishment-not-supported'

      await populateSelectedEstablishment(services)(req, res, next)

      expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      expect(supportedPrisonsService.getPrison).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('when selected establishment and active case load both set', () => {
    it('should populate data and call next() when they match', async () => {
      user.activeCaseLoadId = prison.prisonId
      req.session.selectedEstablishmentId = prison.prisonId

      await populateSelectedEstablishment(services)(req, res, next)

      expect(res.locals.selectedEstablishment).toStrictEqual(prison)
      expect(req.context.selectedEstablishment).toStrictEqual(prison)

      expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      expect(supportedPrisonsService.getPrison).toHaveBeenCalledWith(prison.prisonId)
      expect(next).toHaveBeenCalled()
    })

    it('should clear selected establishment and redirect to /back-to-start when they do not match', async () => {
      user.activeCaseLoadId = 'XYZ'
      req.session.selectedEstablishmentId = prison.prisonId

      await populateSelectedEstablishment(services)(req, res, next)

      expect(res.locals.selectedEstablishment).toBeUndefined()
      expect(req.session.selectedEstablishmentId).toBeUndefined()
      expect(req.context.selectedEstablishment).toBeUndefined()

      expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      expect(supportedPrisonsService.getPrison).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/back-to-start')
    })
  })

  // because front-end components meta data (e.g. activeCaseLoad) only gets set on GET requests
  describe('when selected establishment is set but active case load is not set', () => {
    it('should populate data and call next()', async () => {
      user.activeCaseLoadId = undefined
      req.session.selectedEstablishmentId = prison.prisonId

      await populateSelectedEstablishment(services)(req, res, next)

      expect(res.locals.selectedEstablishment).toStrictEqual(prison)
      expect(req.context.selectedEstablishment).toStrictEqual(prison)

      expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      expect(supportedPrisonsService.getPrison).toHaveBeenCalledWith(prison.prisonId)
      expect(next).toHaveBeenCalled()
    })
  })

  // e.g. new session or after case load change detected
  describe('when selected establishment is not set but active case load is set', () => {
    it('should populate data when active case load is a supported prison', async () => {
      user.activeCaseLoadId = prison.prisonId
      supportedPrisonsService.isSupportedPrison.mockResolvedValue(true)

      await populateSelectedEstablishment(services)(req, res, next)

      expect(req.session.selectedEstablishmentId).toBe(prison.prisonId)
      expect(res.locals.selectedEstablishment).toStrictEqual(prison)
      expect(req.context.selectedEstablishment).toStrictEqual(prison)

      expect(supportedPrisonsService.isSupportedPrison).toHaveBeenCalledWith(prison.prisonId)
      expect(supportedPrisonsService.getPrison).toHaveBeenCalledWith(prison.prisonId)
      expect(next).toHaveBeenCalled()
    })

    it('should redirect to /establishment-not-supported when active case load is not a supported prison', async () => {
      const unsupportedPrisonId = 'XYZ'
      user.activeCaseLoadId = unsupportedPrisonId

      supportedPrisonsService.isSupportedPrison.mockResolvedValue(false)

      await populateSelectedEstablishment(services)(req, res, next)

      expect(req.session.selectedEstablishmentId).toBeUndefined()
      expect(res.locals.selectedEstablishment).toBeUndefined()
      expect(req.context.selectedEstablishment).toBeUndefined()

      expect(supportedPrisonsService.isSupportedPrison).toHaveBeenCalledWith(unsupportedPrisonId)
      expect(supportedPrisonsService.getPrison).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/establishment-not-supported')
    })
  })

  describe('when selected establishment and active case load are both not set', () => {
    it('should redirect to /establishment-not-supported', async () => {
      user.activeCaseLoadId = undefined

      await populateSelectedEstablishment(services)(req, res, next)

      expect(res.locals.selectedEstablishment).toBeUndefined()
      expect(req.context.selectedEstablishment).toBeUndefined()

      expect(supportedPrisonsService.isSupportedPrison).not.toHaveBeenCalled()
      expect(supportedPrisonsService.getPrison).not.toHaveBeenCalled()

      expect(res.redirect).toHaveBeenCalledWith('/establishment-not-supported')
    })
  })
})
