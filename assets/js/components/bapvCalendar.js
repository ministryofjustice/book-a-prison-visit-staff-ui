const calendarDayClass = 'bapv-calendar__day'
const calendarDaySelectedClass = 'bapv-calendar__day--selected'
const calendarDayGroupClass = 'bapv-calendar__day-group'
const calendarDayGroupActiveClass = 'bapv-calendar__day-group--active'

function handleSelectDate(event) {
  event.preventDefault()
  const dateToShow = event.target.parentElement.dataset.date

  // remove highlighted day
  document.querySelector(`.${calendarDaySelectedClass}`)?.classList.remove(calendarDaySelectedClass)

  // hide active form group
  document.querySelector(`.${calendarDayGroupActiveClass}`)?.classList.remove(calendarDayGroupActiveClass)

  // highlight selected day
  document.querySelector(`.${calendarDayClass}[data-date='${dateToShow}']`).classList.add(calendarDaySelectedClass)
  document.getElementById(`day-link-${dateToShow}`).blur()

  // show selected day's sessions
  const selectedFormGroup = document.querySelector(`.${calendarDayGroupClass}[data-date='${dateToShow}']`)
  selectedFormGroup.classList.add(calendarDayGroupActiveClass)

  // scroll to first session for selected day if it's not in viewport
  const firstSession = selectedFormGroup.querySelector('input')
  const isFirstSessionInViewport = window.innerHeight <= firstSession.getBoundingClientRect().bottom
  if (isFirstSessionInViewport) {
    selectedFormGroup.scrollIntoView({ behavior: 'smooth' })
  }

  // focus on first non-disabled session
  selectedFormGroup.querySelector('input:not(:disabled)')?.focus({ preventScroll: true })
}

// handle clicks on the calendar days
document.querySelectorAll(`.${calendarDayClass} a`).forEach(dayLink => {
  dayLink.addEventListener('click', handleSelectDate)
})

// set the default selected day on load
const selectedDate = document.querySelector(`.${calendarDaySelectedClass}`)?.dataset?.date

if (selectedDate) {
  document
    .querySelector(`.${calendarDayGroupClass}[data-date='${selectedDate}']`)
    .classList.add(calendarDayGroupActiveClass)
}
