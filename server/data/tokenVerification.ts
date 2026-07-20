import { VerificationClient } from '@ministryofjustice/hmpps-auth-clients'
import type { AuthenticatedRequest } from '@ministryofjustice/hmpps-auth-clients'
import type { Request } from 'express'

import logger from '../../logger'
import config from '../config'

const verificationClient = new VerificationClient(config.apis.tokenVerification, logger)

export type TokenVerifier = (request: Request) => Promise<boolean | void>

const tokenVerifier: TokenVerifier = request => verificationClient.verifyToken(request as AuthenticatedRequest)

export default tokenVerifier
