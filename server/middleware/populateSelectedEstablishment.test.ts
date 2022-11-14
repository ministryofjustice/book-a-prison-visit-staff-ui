import { Request, Response } from 'express'
import { Cookie } from 'express-session'
import { Prison } from '../data/prisonRegisterApiTypes'
import populateSelectedEstablishment from './populateSelectedEstablishment'

describe('populateSelectedEstablishment', () => {
  let req: Partial<Request>
  const res: Partial<Response> = { locals: undefined }
  const next = jest.fn()

  beforeEach(() => {
    req = {
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
    }

    res.locals = {}
  })

  it('should set default establishment if non is set in session and populate res.locals', () => {
    const defaultEstablishment = { prisonId: 'HEI', prisonName: 'Hewell (HMP)' } as Prison

    populateSelectedEstablishment(req as Request, res as Response, next)

    expect(req.session.selectedEstablishment).toEqual(defaultEstablishment)
    expect(res.locals.selectedEstablishment).toEqual(defaultEstablishment)
  })

  it('should populate res.locals when establishment already set in session', () => {
    const alreadySelectedEstablishment = { prisonId: 'BLI', prisonName: 'Bristol (HMP)' } as Prison
    req.session.selectedEstablishment = alreadySelectedEstablishment

    populateSelectedEstablishment(req as Request, res as Response, next)

    expect(req.session.selectedEstablishment).toEqual(alreadySelectedEstablishment)
    expect(res.locals.selectedEstablishment).toEqual(alreadySelectedEstablishment)
  })
})
