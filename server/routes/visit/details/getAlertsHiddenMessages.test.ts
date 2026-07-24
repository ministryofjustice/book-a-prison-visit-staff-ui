import getAlertsHiddenMessages from './getAlertsHiddenMessages'
import config from '../../../config'

describe('getAlertsHiddenMessages', () => {
  const prisonerNumber = 'A1234BC'
  let expected: ReturnType<typeof getAlertsHiddenMessages>

  beforeEach(() => {
    expected = {
      prisoner: {
        attributes: { 'data-test': 'prisoner-inset' },
        classes: 'govuk-!-margin-bottom-1',
      },
      visitor: {
        attributes: { 'data-test': 'visitor-inset' },
      },
    } as ReturnType<typeof getAlertsHiddenMessages>
  })

  it('should return past visit message if skipAlertsAndRestrictionReason is VISIT_IN_PAST', () => {
    expected.prisoner.html = `Alerts and restrictions are not shown for past visits.<br>You can view alerts and restrictions in the <a href="${config.dpsContacts}/prisoner/${prisonerNumber}/alerts-restrictions">contacts service</a>.`
    expected.visitor.html = `Visitor restrictions are not shown for past visits.<br>You can view restrictions in the <a href="${config.dpsContacts}/prisoner/${prisonerNumber}/contacts/list">contacts service</a>.`

    const results = getAlertsHiddenMessages({ skipAlertsAndRestrictionReason: 'VISIT_IN_PAST', prisonerNumber })
    expect(results).toStrictEqual(expected)
  })

  it('should return released prisoner message if skipAlertsAndRestrictionReason is PRISONER_RELEASED', () => {
    expected.prisoner.text = 'Alerts and restrictions are not shown for released prisoners.'
    expected.visitor.text = 'Visitor restrictions are not shown for released prisoners.'

    const results = getAlertsHiddenMessages({
      skipAlertsAndRestrictionReason: 'PRISONER_RELEASED',
      prisonerNumber,
    })
    expect(results).toStrictEqual(expected)
  })

  it('should return transferred prisoner message if skipAlertsAndRestrictionReason is PRISONER_TRANSFERRED', () => {
    expected.prisoner.text = 'Alerts and restrictions are not shown for transferred prisoners.'
    expected.visitor.text = 'Visitor restrictions are not shown for transferred prisoners.'

    const results = getAlertsHiddenMessages({
      prisonerNumber,
      skipAlertsAndRestrictionReason: 'PRISONER_TRANSFERRED',
    })
    expect(results).toStrictEqual(expected)
  })

  it('should return null if skipAlertsAndRestrictionReason is null', () => {
    const results = getAlertsHiddenMessages({
      prisonerNumber,
      skipAlertsAndRestrictionReason: null,
    })
    expect(results).toStrictEqual(null)
  })
})
