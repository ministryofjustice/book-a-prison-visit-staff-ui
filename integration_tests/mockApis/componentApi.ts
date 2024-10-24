import Component from '@ministryofjustice/hmpps-connect-dps-components/dist/types/Component'
import HeaderFooterMeta from '@ministryofjustice/hmpps-connect-dps-components/dist/types/HeaderFooterMeta'
import { stubFor } from './wiremock'
import { convertToTitleCase, initialiseName } from '../../server/utils/utils'
import TestData from '../../server/routes/testutils/testData'

const caseLoad = TestData.caseLoad()

const meta: HeaderFooterMeta = {
  activeCaseLoad: caseLoad,
  caseLoads: [caseLoad],
  services: [],
}

// copy of the DPS components fallback header HTML (with 'USER-NAME' placeholder)
const headerHtml = `<header class="fallback-dps-header" role="banner"> <div class="fallback-dps-header__container"> <div class="fallback-dps-header__title"> <a class="fallback-dps-header__link fallback-dps-header__link--no-underline fallback-dps-header__title__service-name" href="#"> <svg role="presentation" focusable="false" class="fallback-dps-header__logo" xmlns="http://www.w3.org/2000/svg" width="41" height="30" viewBox="0 0 41 30"> <path d="M22.6,10.4c-1,0.4-2-0.1-2.4-1s0.1-2,1-2.4s2,0.1,2.4,1S23.5,10,22.6,10.4 M16.7,17.1c-0.9,0.4-2-0.1-2.4-1 c-0.4-0.9,0.1-2,1-2.4s2,0.1,2.4,1S17.6,16.7,16.7,17.1 M27.5,13.4c-1,0.4-2-0.1-2.4-1s0.1-2,1-2.4c0.9-0.4,2,0.1,2.4,1 S28.5,13,27.5,13.4 M30.8,18.2c-1,0.4-2-0.1-2.4-1s0.1-2,1-2.4s2,0.1,2.4,1C32.2,16.7,31.7,17.8,30.8,18.2 M17,4.7l2.3,1.2V2.5 L17,3.2L16.8,3l0.9-3h-3.4l0.9,3L15,3.2c-0.1,0.1-2.3-0.7-2.3-0.7v3.4L15,4.7c0.1,0.1,0.1,0.2,0.2,0.2l-1.3,4 c-0.1,0.2-0.1,0.4-0.1,0.6c0,1.1,0.8,2,1.9,2.2h0.7c1-0.2,1.9-1.1,1.9-2.1c0-0.2,0-0.4-0.1-0.6l-1.3-4C16.8,4.8,16.9,4.8,17,4.7 M9.4,10.4c0.9,0.4,2-0.1,2.4-1s-0.1-2-1-2.4s-2,0.1-2.4,1S8.4,10,9.4,10.4 M4.4,13.4c0.9,0.4,2-0.1,2.4-1s-0.1-2-1-2.4 s-2,0.1-2.4,1S3.5,13,4.4,13.4 M1.2,18.2c0.9,0.4,2-0.1,2.4-1s-0.1-2-1-2.4s-2,0.1-2.4,1C-0.2,16.7,0.2,17.8,1.2,18.2 M16,29.2 c4.4,0,8.6,0.3,12.3,0.8c1.1-4.5,2.4-7,3.7-8.8l-2.5-0.9c0.2,1.3,0.3,1.9,0,2.7c-0.4-0.4-0.8-1.1-1.1-2.3l-1.2,4 c0.7-0.5,1.3-0.8,2-0.9c-1.1,2.5-2.6,3.1-3.5,3c-1.1-0.2-1.7-1.2-1.5-2.1c0.3-1.2,1.5-1.5,2.1-0.1c1.1-2.3-0.8-3-2-2.3 c1.9-1.9,2.1-3.5,0.6-5.6c-2.1,1.6-2.1,3.2-1.2,5.5c-1.2-1.4-3.2-0.6-2.5,1.6c0.9-1.4,2.1-0.5,1.9,0.8c-0.2,1.1-1.7,2.1-3.5,1.9 c-2.7-0.2-2.9-2.1-2.9-3.6c0.7-0.1,1.9,0.5,2.9,1.9l0.4-4.3c-1.1,1.1-2.1,1.4-3.2,1.4c0.4-1.2,2.1-3,2.1-3h-5.4c0,0,1.7,1.9,2.1,3 c-1.1,0-2.1-0.2-3.2-1.4l0.4,4.3c1-1.4,2.2-2,2.9-1.9c-0.1,1.5-0.2,3.4-2.9,3.6c-1.9,0.2-3.4-0.8-3.5-1.9c-0.2-1.3,1-2.2,1.9-0.8 c0.7-2.3-1.2-3-2.5-1.6c0.9-2.2,0.9-3.9-1.2-5.5c-1.5,2-1.3,3.7,0.6,5.6c-1.2-0.7-3.1,0-2,2.3c0.6-1.4,1.8-1.1,2.1,0.1 c0.2,0.9-0.3,1.9-1.5,2.1c-0.9,0.2-2.4-0.5-3.5-3c0.6,0,1.2,0.3,2,0.9l-1.2-4c-0.3,1.1-0.7,1.9-1.1,2.3c-0.3-0.8-0.2-1.4,0-2.7 L0,21.2C1.3,23,2.6,25.5,3.7,30C7.4,29.5,11.6,29.2,16,29.2" /> </svg> Digital Prison Services </a> </div> <nav aria-label="Account navigation"> <ul class="fallback-dps-header__navigation"> <li class="fallback-dps-header__navigation__item"> <span data-qa="header-user-name">USER-NAME</span> </li> <li class="fallback-dps-header__navigation__item"> <a data-qa="signOut" class="fallback-dps-header__link fallback-dps-header__link--no-underline fallback-dps-header__sign-out" href="/sign-out">Sign out</a> </li> </ul> </nav> </div> </header>`

const footerHtml = '<footer class="govuk-footer"></footer>'

const stubComponents = (userName: string) => {
  const formattedUserName = initialiseName(convertToTitleCase(userName))
  const customHeaderHtml = headerHtml.replace('USER-NAME', formattedUserName)

  const componentsResponse: { header: Component; footer: Component; meta: HeaderFooterMeta } = {
    header: {
      html: customHeaderHtml,
      css: [],
      javascript: [],
    },
    footer: {
      html: footerHtml,
      css: [],
      javascript: [],
    },
    meta,
  }

  return stubFor({
    request: {
      method: 'GET',
      urlPattern: '/component/components.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: componentsResponse,
    },
  })
}

export default stubComponents
