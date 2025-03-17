// eslint-disable-next-line import/prefer-default-export
export const getPrisonerLocation = ({
  prisonId,
  prisonName,
  cellLocation,
  locationDescription,
}: {
  prisonId: string
  prisonName: string
  cellLocation: string
  locationDescription: string
}) => {
  if (prisonId === 'OUT') {
    return locationDescription
  }

  if (prisonId === 'TRN') {
    return 'Unknown'
  }

  return `${cellLocation}, ${prisonName}`
}
