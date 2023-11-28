import { Request, Response } from 'express'
import { Cookie } from 'express-session'
import type { User } from '../data/hmppsAuthClient'
import TestData from '../routes/testutils/testData'
import { createMockSupportedPrisonsService } from '../services/testutils/mocks'
import populateSelectedEstablishment from './populateSelectedEstablishment'
import { Prison } from '../@types/bapv'

const supportedPrisonsService = createMockSupportedPrisonsService()

const supportedPrisons = TestData.supportedPrisons()
supportedPrisonsService.getSupportedPrisons.mockResolvedValue(supportedPrisons)
supportedPrisonsService.getPolicyNoticeDaysMin.mockResolvedValue(2)

let req: Request
const res = {
  locals: {},
  redirect: jest.fn(),
} as unknown as Response
const next = jest.fn()

describe('populateSelectedEstablishment', () => {
  beforeEach(() => {
    req = {
      path: '/',
      session: {
        regenerate: jest.fn(),
        destroy: jest.fn(),
        reload: jest.fn(),
        id: 'sessionId',
        resetMaxAge: jest.fn(),
        save: jest.fn(),
        touch: jest.fn(),
        cookie: new Cookie(),
      },
    } as unknown as Request

    res.locals = {
      selectedEstablishment: <Prison>undefined,
      user: <User>{ activeCaseLoadId: 'HEI' },
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when establishment not already set in session', () => {
    it('should set establishment in session and populate res.locals if active caseload is a supported prison', async () => {
      res.locals.user.activeCaseLoadId = 'BLI'

      const expectedEstablishment: Prison = {
        prisonId: 'BLI',
        prisonName: supportedPrisons.BLI,
        policyNoticeDaysMin: 2,
      }

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(1)
      expect(supportedPrisonsService.getPolicyNoticeDaysMin).toHaveBeenCalledTimes(1)
      expect(req.session.selectedEstablishment).toStrictEqual(expectedEstablishment)
      expect(res.locals.selectedEstablishment).toStrictEqual(expectedEstablishment)
    })

    it('should redirect to /change-establishment if no establishment set and active caseload is not a supported prison', async () => {
      res.locals.user.activeCaseLoadId = 'XYZ'

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(1)
      expect(res.redirect).toHaveBeenCalledWith('/change-establishment')
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
    })

    it('should redirect to /change-establishment if no establishment set and active caseload is not set', async () => {
      res.locals.user.activeCaseLoadId = undefined

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(1)
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(res.redirect).toHaveBeenCalledWith('/change-establishment')
    })

    it('should make no changes and not redirect if request path is /change-establishment', async () => {
      req.path = '/change-establishment'

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).toHaveBeenCalledTimes(0)
      expect(req.session.selectedEstablishment).toBe(undefined)
      expect(res.locals.selectedEstablishment).toBe(undefined)
      expect(res.redirect).not.toHaveBeenCalled()
    })
  })

  describe('when establishment already set in session', () => {
    it('should populate res.locals with selected establishment without prisons lookup', async () => {
      req.session.selectedEstablishment = { prisonId: 'HEI', prisonName: supportedPrisons.HEI }

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(res.locals.selectedEstablishment).toStrictEqual(req.session.selectedEstablishment)
    })

    it('should populate res.locals with already selected establishment without prisons lookup if active caseload changes', async () => {
      res.locals.user.activeCaseLoadId = 'BLI'
      req.session.selectedEstablishment = { prisonId: 'HEI', prisonName: supportedPrisons.HEI }

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(res.locals.selectedEstablishment).toStrictEqual(req.session.selectedEstablishment)
    })

    it('should make no changes and not redirect if request path is /change-establishment', async () => {
      req.path = '/change-establishment'
      res.locals.user.activeCaseLoadId = 'BLI'
      req.session.selectedEstablishment = { prisonId: 'HEI', prisonName: supportedPrisons.HEI }

      await populateSelectedEstablishment(supportedPrisonsService)(req, res, next)

      expect(supportedPrisonsService.getSupportedPrisons).not.toHaveBeenCalled()
      expect(res.locals.selectedEstablishment).toStrictEqual(req.session.selectedEstablishment)
    })
  })
})
