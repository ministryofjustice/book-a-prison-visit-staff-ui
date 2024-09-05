const viewAnotherDateToggle = document.querySelector('.bapv-another-date__toggle button')

if (viewAnotherDateToggle) {
  function toggleDatePicker(event) {
    event.preventDefault()
    const datePicker = document.querySelector('.bapv-another-date__form')

    if (datePicker.classList.contains('moj-js-hidden')) {
      viewAnotherDateToggle.setAttribute('aria-expanded', 'false')
      datePicker.classList.remove('moj-js-hidden')
      document.querySelector('.moj-js-datepicker-toggle').click()
    } else {
      viewAnotherDateToggle.setAttribute('aria-expanded', 'true')
      datePicker.classList.add('moj-js-hidden')
    }
  }

  viewAnotherDateToggle.addEventListener('click', toggleDatePicker)

  if (document.querySelector('.govuk-error-summary') !== null) {
    viewAnotherDateToggle.setAttribute('aria-expanded', 'false')
    document.querySelector('.bapv-another-date__form').classList.remove('moj-js-hidden')
  }
}
