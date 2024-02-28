import type { Request, Response } from 'express'
import { createMockFrontendComponentsService } from '../services/testutils/mocks'
import getFrontendComponents from './setupFrontendComponents'
import { Services } from '../services'
import logger from '../../logger'

jest.mock('../../logger')

const frontendComponentsService = createMockFrontendComponentsService()
let req: Request
let res: Response
const next = jest.fn()

describe('getFrontendComponents', () => {
  beforeEach(() => {
    res = {
      locals: {
        user: {
          token: 'user-token',
        },
      },
    } as Response
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should call frontend components service and populate res.locals', async () => {
    const response = {
      header: {
        html: 'header html',
        css: ['header css'],
        javascript: ['header js'],
      },
      footer: {
        html: 'footer html',
        css: ['footer css'],
        javascript: ['footer js'],
      },
    }
    frontendComponentsService.getComponents.mockResolvedValue(response)

    await getFrontendComponents({ frontendComponentsService } as unknown as Services)(req, res, next)

    expect(frontendComponentsService.getComponents).toHaveBeenCalledWith(['footer'], 'user-token')
    expect(res.locals.feComponents).toStrictEqual({
      footer: response.footer.html,
      cssIncludes: [...response.footer.css],
      jsIncludes: [...response.footer.javascript],
    })
  })

  it('should log errors', async () => {
    const error = new Error('Oops')
    frontendComponentsService.getComponents.mockRejectedValue(error)

    await getFrontendComponents({ frontendComponentsService } as unknown as Services)(req, res, next)

    expect(logger.error).toHaveBeenCalledWith(error, 'Failed to retrieve front end components')
  })
})
