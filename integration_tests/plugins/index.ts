import { resetStubs } from '../mockApis/wiremock'

import auth from '../mockApis/auth'
import tokenVerification from '../mockApis/tokenVerification'
import prisonerContactRegistry from '../mockApis/prisonerContactRegistry'
import whereaboutsOffenderEvents from '../mockApis/whereabouts'
import prisonApi from '../mockApis/prison'

export default (on: (string, Record) => void): void => {
  on('task', {
    reset: resetStubs,

    getSignInUrl: auth.getSignInUrl,
    stubSignIn: auth.stubSignIn,

    stubAuthUser: auth.stubUser,
    stubAuthPing: auth.stubPing,

    stubTokenVerificationPing: tokenVerification.stubPing,

    stubGetPrisonerContacts: prisonerContactRegistry.stubGetPrisonerContacts,

    stubGetOffenderEvents: whereaboutsOffenderEvents.stubGetOffenderEvents,

    stubGetBookings: prisonApi.stubGetBookings,
    stubGetPrisonerDetail: prisonApi.stubGetPrisonerDetail,
    stubGetPrisonerRestrictions: prisonApi.stubGetPrisonerRestrictions,
    stubGetVisitBalances: prisonApi.stubGetVisitBalances,
  })
}
