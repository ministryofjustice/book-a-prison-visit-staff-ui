// eslint-disable-next-line import/prefer-default-export
export const prisonerProfileData = prisonerNumber => {
  const prisoner = {
    lastName: 'Last Name 1',
    firstName: 'First Name 1',
    prisonerNumber,
    dateOfBirth: '2000-01-01',
  }
  const offender = {
    lastName: 'Last Name 1',
    firstName: 'First Name 1',
    offenderNo: prisonerNumber,
    dateOfBirth: '2000-01-01',
    agencyId: 'HEI',
    assignedLivingUnit: {
      description: 'ALU Description',
      agencyName: 'ALU Description',
      agencyId: 'HEI',
      locationId: 123,
    },
    category: 'SomeCategory',
    activeAlertCount: 2,
    alerts: [
      {
        active: true,
        alertCode: 'UPIU',
        alertCodeDescription: 'Protective Isolation Unit',
        alertId: 1234,
        alertType: 'U',
        alertTypeDescription: 'COVID unit management',
        bookingId: 1234,
        comment: 'Alert comment',
        dateCreated: '2022-04-25T09:35:34.489Z',
        expired: false,
        offenderNo: prisonerNumber,
      },
    ],
  }
  const visitBalances = {
    latestIepAdjustDate: '2022-04-25T09:35:34.489Z',
    latestPrivIepAdjustDate: '2022-04-25T09:35:34.489Z',
    remainingPvo: 1,
    remainingVo: 2,
  }
  const upcomingVisits = [
    {
      reference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'A1 L3',
      visitType: 'SOCIAL',
      visitStatus: 'RESERVED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-04-25T09:35:34.489Z',
      endTimestamp: '',
      visitors: [
        {
          nomisPersonId: 1234,
        },
      ],
      visitorSupport: [
        {
          type: 'OTHER',
          text: 'custom support details',
        },
      ],
    },
    {
      reference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'A1 L3',
      visitType: 'SOCIAL',
      visitStatus: 'RESERVED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-04-25T09:35:34.489Z',
      endTimestamp: '',
      visitors: [
        {
          nomisPersonId: 1234,
        },
      ],
      visitorSupport: [
        {
          type: 'OTHER',
          text: 'custom support details',
        },
      ],
    },
  ]
  const pastVisits = [
    {
      reference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'A1 L3',
      visitType: 'SOCIAL',
      visitStatus: 'RESERVED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-01-25T09:35:34.489Z',
      endTimestamp: '',
      visitors: [
        {
          nomisPersonId: 1234,
        },
      ],
      visitorSupport: [
        {
          type: 'OTHER',
          text: 'custom support details',
        },
      ],
    },
    {
      reference: 'ab-cd-ef-gh',
      prisonerId: 'A1234BC',
      prisonId: 'HEI',
      visitRoom: 'A1 L3',
      visitType: 'SOCIAL',
      visitStatus: 'RESERVED',
      visitRestriction: 'OPEN',
      startTimestamp: '2022-01-25T09:35:34.489Z',
      endTimestamp: '',
      visitors: [
        {
          nomisPersonId: 1234,
        },
      ],
      visitorSupport: [
        {
          type: 'OTHER',
          text: 'custom support details',
        },
      ],
    },
  ]

  return {
    prisoner,
    offender,
    visitBalances,
    upcomingVisits,
    pastVisits,
  }
}
