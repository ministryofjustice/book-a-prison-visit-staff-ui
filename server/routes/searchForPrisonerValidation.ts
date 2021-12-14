type Error = {
  href: string
  text: string
}

const errors: { [key: string]: Error } = {
  INVALID_QUERY: {
    href: '#search',
    text: 'You must enter at least 3 characters',
  },
}

export default function validateForm(search: string): Error | null {
  if (search.length < 3) {
    return errors.INVALID_QUERY
  }

  return null
}
