const expandableComments = document.querySelectorAll('.bapv-expandable-comment')

expandableComments.forEach(expandableComment => {
  expandableComment.querySelector('.bapv-expandable-comment__show').addEventListener('click', () => {
    expandableComment
      .querySelector('.bapv-expandable-comment__full-comment')
      .classList.add('bapv-expandable-comment__full-comment--expanded')
  })

  expandableComment.querySelector('.bapv-expandable-comment__hide').addEventListener('click', () => {
    expandableComment
      .querySelector('.bapv-expandable-comment__full-comment')
      .classList.remove('bapv-expandable-comment__full-comment--expanded')
  })
})
