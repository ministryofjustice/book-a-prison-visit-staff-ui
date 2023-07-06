const voOverride = document.querySelector('#vo-override')

if (voOverride) {
  function setBookButtonState() {
    const bookButton = document.querySelector('.govuk-button')

    if (voOverride.checked) {
      bookButton.removeAttribute('disabled')
      bookButton.removeAttribute('aria-disabled')
    } else {
      bookButton.setAttribute('disabled', '')
      bookButton.setAttribute('aria-disabled', 'true')
    }
  }

  setBookButtonState()
  voOverride.addEventListener('change', setBookButtonState)
}
