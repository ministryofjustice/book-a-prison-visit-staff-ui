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

  // show selected day's sessions
  const selectedFormGroup = document.querySelector(`.${calendarDayGroupClass}[data-date='${dateToShow}']`)
  selectedFormGroup.classList.add(calendarDayGroupActiveClass)

  // focus on first visit session for selected day
  const firstSession = selectedFormGroup.querySelector('input')
  firstSession.focus({ preventScroll: true })
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
