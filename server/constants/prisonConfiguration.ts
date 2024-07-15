type PrisonConfiguration = {
  selectVisitorsText: string[]
}

const prisonConfiguration: Record<string, PrisonConfiguration> = {
  // Askham Grange (HMP & YOI)
  AGI: {
    selectVisitorsText: [
      'You can add up to 4 people aged 18 and over, and 4 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Aylesbury (HMYOI)
  AYI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Bedford (HMP & YOI)
  BFI: {
    selectVisitorsText: [
      'You can add up to 2 people aged 18 and over, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Bristol (HMP & YOI)
  BLI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over. Children can also be added to the visit.',
      'Contact HMP Bristol when the total number of visitors (adults and children) is more than 3.',
    ],
  },
  // Bullingdon (HMP & YOI)
  BNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Bure (HMP)
  BRI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },  
  // Brinsford (HMP & YOI)
  BSI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Chelmsford (HMP & YOI)
  CDI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 8 and over, and 3 children under 8 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Cardiff (HMP & YOI)
  CFI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Coldingley (HMP)
  CLI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and any number of children related to the prisoner.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Dartmoor (HMP)
  DAI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Drake Hall (HMP & YOI)
  DHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 17 and over, and 4 children under 17 years old. ',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Durham (HMP & YOI)
  DMI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Downview (HMP & YOI)
  DWI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Erlestoke (HMP & YOI)
  EEI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Standford Hill (HMP & YOI)
  EHI: {
    selectVisitorsText: [
      'You can add up to 4 people aged 18 and over, and any number of children related to the prisoner.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // East Sutton Park (HMP & YOI)
  ESI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Eastwood Park (HMP & YOI)
  EWI: {
    selectVisitorsText: ['You can add up to 3 people.', 'At least one visitor must be 18 or older.'],
  },
  // Foston Hall (HMP & YOI)
  FHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Full Sutton (HMP)
  FNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Featherstone (HMP)
  FSI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of approved children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Guys Marsh (HMP)
  GMI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Hewell (HMP)
  HEI: {
    selectVisitorsText: [
      'Add up to 3 people aged 10 and over, and 4 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Hull (HMP & YOI)
  HLI: {
    selectVisitorsText: [
      'You can add up to 4 people aged 16 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Highpoint (HMP)
  HPI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Kirkham (HMP)
  KMI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Lancaster Farms (HMP)
  LFI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Lindholme (HMP)
  LHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 6 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Lincoln (HMP & YOI)
  LII: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 6 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Low Newton (HMP & YOI)
  LNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
      'Contact the establishment if you would like to bring more than 3 children.',
    ],
  },
  // Littlehey (HMP)
  LTI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Moorland (HMP & YOI)
  MDI: {
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 18 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Morton Hall (HMP)
  MHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // The Mount (HMP)
  MTI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // New Hall (HMP & YOI)
  NHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // North Sea Camp (HMP)
  NSI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Onley (HMP)
  ONI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over with no more than 6 children per visit.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Preston (HMP & YOI)
  PNI: {
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 16 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Pentonville (HMP & YOI)
  PVI: {
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 18 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Rochester (HMP & YOI)
  RCI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over, and 3 children under 16 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Ranby (HMP)
  RNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and any number of children.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Send (HMP)
  SDI: {
    selectVisitorsText: ['You can add up to a total of 4 people.', 'At least one visitor must be 18 or older.'],
  },
  // Stafford (HMP)
  SFI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Stoke Heath (HMP & YOI)
  SHI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Stocken (HMP)
  SKI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 16 and over - with a maximum of 5 total visitors.',
      'At least one visitor must be 18 or older.',
      'Contact the establishment if you would like to bring more children.',
    ],
  },
  // Swinfen Hall (HMP & YOI)
  SNI: {
    selectVisitorsText: [
      'You can add up to a total of 3 people.',
      'A total of 4 people can attend if one is under 5.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Sudbury (HMP & YOI)
  SUI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 12 and over - with a maximum of 5 total visitors.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Styal (HMP & YOI)
  STI: {
    selectVisitorsText: [
      'You can add up to a total of 5 people, with a maximum of 3 people aged 18 and over.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Swansea (HMP & YOI)
  SWI: {
    selectVisitorsText: [
      'You can add up to 3 people aged over 18, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Thorn Cross (HMP & YOI)
  TCI: {
    selectVisitorsText: [
      'You can add up to 3 people aged over 18, and 5 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Winchester (HMP & YOI)
  WCI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 10 and over, and 3 children under 10 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Wayland (HMP)
  WLI: {
    selectVisitorsText: [
      'You can add up to 3 people aged over 18, and 4 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Werrington (HMYOI)
  WNI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 15 and over, and 3 children under 15 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Whitemoor (HMP)
  WRI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
  // Wandsworth (HMP & YOI)
  WWI: {
    selectVisitorsText: [
      'You can add up to 3 people aged 18 and over, and 3 children under 18 years old.',
      'At least one visitor must be 18 or older.',
    ],
  },
}

const defaultConfiguration: PrisonConfiguration = {
  selectVisitorsText: [],
}

const getPrisonConfiguration = (prisonId: string): PrisonConfiguration => {
  return prisonConfiguration[prisonId] ?? defaultConfiguration
}

export default getPrisonConfiguration
