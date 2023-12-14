;(function setupFilterComponent() {
  function resizeFilterSections() {
    const filterButtons = document.querySelectorAll('.bapv-filter-button')
    const filterSections = document.querySelectorAll('.bapv-filter-selection')
    filterSections.forEach((element, index) => {
      element.classList.remove('moj-js-hidden')
      filterButtons[index].style.width =
        element.offsetWidth > 1 ? element.offsetWidth + 'px' : filterButtons[index].style.width
      element.classList.add('moj-js-hidden')
    })
  }

  function configureFilterButtons() {
    const filterButtons = document.querySelectorAll('.bapv-filter-button')

    function checkFiltersFocus(e) {
      const target = e.target?.id.substr(e.target.id.indexOf('-') + 1)
      const relatedTarget = e.relatedTarget?.id.substr(e.relatedTarget.id.indexOf('-') + 1)
      if (!target || !relatedTarget || relatedTarget.indexOf(target) === -1) {
        const filterSections = document.getElementsByClassName('bapv-filter-selection')
        filterButtons.forEach((element, index) => {
          element.setAttribute('aria-expanded', false)
          element.classList.remove('bapv-filter-button--open')
          filterSections[index].classList.add('moj-js-hidden')
          element.active = false
        })
      }
    }

    function toggleFilter(e) {
      e.stopPropagation()
      const $el = e.target
      const current = !$el.active && $el.dataset['controls']
      const filterSections = document.querySelectorAll('.bapv-filter-selection')
      filterButtons.forEach((element, index) => {
        element.setAttribute('aria-expanded', current === element.dataset['controls'])
        current === element.dataset['controls']
          ? element.classList.add('bapv-filter-button--open')
          : element.classList.remove('bapv-filter-button--open')
        current === filterSections[index].id
          ? filterSections[index].classList.remove('moj-js-hidden')
          : filterSections[index].classList.add('moj-js-hidden')
        if (!$el.active) {
          element.active = false
        }
      })
      $el.active = !$el.active
    }

    filterButtons.forEach(element => {
      element.addEventListener('click', toggleFilter)
    })

    const applyFiltersButton = document.querySelectorAll('.bapv-apply-filters-button')
    applyFiltersButton.forEach(element => {
      element.addEventListener('focus', checkFiltersFocus)
    })
  }

  function configureClearTags() {
    function clearFilter(e) {
      e.stopPropagation()
      const checkbox = document.getElementById(e.target.dataset['controls'])
      checkbox.click()
      document.getElementById('bapv-filter-form').submit()
    }

    const clearTags = document.querySelectorAll('.moj-filter__tag.bapv-filter__tag')
    clearTags.forEach(element => {
      element.addEventListener('click', clearFilter)
    })
  }

  function configureCheckboxes() {
    function checkboxClick(e) {
      e.stopPropagation()
      const button = document.getElementById('button-' + e.target.name.substring(e.target.name.indexOf('-') + 1))
      let anySelected = false
      const checkboxesInGroup = document.querySelectorAll('[id^="checkbox-' + e.target.name + '"]')
      checkboxesInGroup.forEach(element => {
        anySelected = anySelected || element.checked
      })
      anySelected
        ? button.classList.add('bapv-filter-button--selected')
        : button.classList.remove('bapv-filter-button--selected')
    }

    const checkboxes = document.querySelectorAll('.bapv-filter-checkbox')
    checkboxes.forEach(element => {
      element.addEventListener('click', checkboxClick)
    })
  }

  function configureResetButton() {
    function resetFilters(e) {
      e.stopPropagation()
      const form = document.getElementById('bapv-filter-form')
      const checkboxes = document.querySelectorAll('.bapv-filter-checkbox')
      checkboxes.forEach(element => {
        if (element.checked) {
          element.click()
        }
      })
      form.submit()
    }

    const resetBtn = document.getElementById('reset-filters')
    resetBtn.addEventListener('click', resetFilters)
  }

  resizeFilterSections()
  configureFilterButtons()
  configureClearTags()
  configureCheckboxes()
  configureResetButton()
})()
