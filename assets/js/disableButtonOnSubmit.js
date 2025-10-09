document.querySelector('.disable-button-on-submit')?.addEventListener('submit', event => {
  event.target.querySelector('button[type=submit]').setAttribute('disabled', 'disabled')
})
