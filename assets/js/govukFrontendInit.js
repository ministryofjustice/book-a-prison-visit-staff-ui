window.GOVUKFrontend.initAll()

// Initiate the back links
$('.js-backlink').on('click', e => {
  e.preventDefault()
  window.history.go(-1)
})
