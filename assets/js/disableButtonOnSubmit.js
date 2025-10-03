document.querySelector('.disable-button-on-submit')?.addEventListener('submit', e => {
  e.target.querySelector('button[type=submit]').setAttribute('disabled', 'disabled')
})
