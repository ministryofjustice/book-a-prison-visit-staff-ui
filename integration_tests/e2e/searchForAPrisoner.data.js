export const singlePageSearchResults = prisonerNumber => {
  return {
    totalPages: 1,
    totalElements: 2,
    content: [
      {
        lastName: 'Last Name 1',
        firstName: 'First Name 1',
        prisonerNumber,
        dateOfBirth: '2000-01-01',
      },
      {
        lastName: 'Last Name 2',
        firstName: 'First Name 2',
        prisonerNumber: 'DE5678F',
        dateOfBirth: '2000-01-02',
      },
    ],
  }
}

export const multiplePageSearchResultsPage1 = prisonerNumber => {
  return {
    totalPages: 2,
    totalElements: 11,
    content: [
      {
        lastName: 'Last Name 1',
        firstName: 'First Name 1',
        prisonerNumber,
        dateOfBirth: '2000-01-01',
      },
      {
        lastName: 'Last Name 2',
        firstName: 'First Name 2',
        prisonerNumber: 'D5678EF',
        dateOfBirth: '2000-01-02',
      },
      {
        lastName: 'Last Name 3',
        firstName: 'First Name 3',
        prisonerNumber: 'D1678EF',
        dateOfBirth: '2000-01-03',
      },
      {
        lastName: 'Last Name 4',
        firstName: 'First Name 4',
        prisonerNumber: 'D2678EF',
        dateOfBirth: '2000-01-04',
      },
      {
        lastName: 'Last Name 5',
        firstName: 'First Name 5',
        prisonerNumber: 'D3678EF',
        dateOfBirth: '2000-01-05',
      },
      {
        lastName: 'Last Name 6',
        firstName: 'First Name 6',
        prisonerNumber: 'D4678EF',
        dateOfBirth: '2000-01-06',
      },
      {
        lastName: 'Last Name 7',
        firstName: 'First Name 7',
        prisonerNumber: 'D6678EF',
        dateOfBirth: '2000-01-07',
      },
      {
        lastName: 'Last Name 8',
        firstName: 'First Name 8',
        prisonerNumber: 'D7678EF',
        dateOfBirth: '2000-01-08',
      },
      {
        lastName: 'Last Name 9',
        firstName: 'First Name 9',
        prisonerNumber: 'D8678EF',
        dateOfBirth: '2000-01-09',
      },
      {
        lastName: 'Last Name 10',
        firstName: 'First Name 10',
        prisonerNumber: 'D9678EF',
        dateOfBirth: '2000-01-10',
      },
    ],
  }
}

export const multiplePageSearchResultsPage2 = () => {
  return {
    totalPages: 2,
    totalElements: 11,
    content: [
      {
        lastName: 'Last Name 11',
        firstName: 'First Name 11',
        prisonerNumber: 'D9678EG',
        dateOfBirth: '2000-01-11',
      },
    ],
  }
}

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
    privilegeSummary: {
      iepLevel: 'Basic',
      iepDate: '2022-01-01',
      bookingId: 1234,
      daysSinceReview: 3,
    },
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
