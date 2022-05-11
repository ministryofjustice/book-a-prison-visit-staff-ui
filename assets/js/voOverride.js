const voOverride = document.querySelector('#vo-override')

if (voOverride) {
  function setBookButtonState() {
    const bookButton = document.querySelector('.govuk-button')
    
    if (voOverride.checked) {
      bookButton.removeAttribute('disabled')
      bookButton.removeAttribute('aria-disabled')
      bookButton.classList.remove('govuk-button--disabled')
    } else {
      bookButton.setAttribute('disabled', '')
      bookButton.setAttribute('aria-disabled', 'true')
      bookButton.classList.add('govuk-button--disabled')
    }
  }

  setBookButtonState()
  voOverride.addEventListener('change', setBookButtonState)
}
