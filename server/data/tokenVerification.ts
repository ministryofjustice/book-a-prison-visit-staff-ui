import type { Request } from 'express'
import { VerificationClient } from '@ministryofjustice/hmpps-auth-clients'
import type { AuthenticatedRequest } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import logger from '../../logger'

const verificationClient = new VerificationClient(config.apis.tokenVerification, logger)

export type TokenVerifier = (request: Request) => Promise<boolean | void>

const tokenVerifier: TokenVerifier = request => verificationClient.verifyToken(request as AuthenticatedRequest)

export default tokenVerifier
