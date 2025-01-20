const expandableComments = document.querySelectorAll('.bapv-expandable-comment')
const FUL_COMMENT_EXPANDED_CLASS = 'bapv-expandable-comment__full-comment--expanded'

expandableComments.forEach(expandableComment => {
  const showFullCommentButton = expandableComment.querySelector('.bapv-expandable-comment__show')
  const hideFullCommentButton = expandableComment.querySelector('.bapv-expandable-comment__hide')
  const fullCommentText = expandableComment.querySelector('.bapv-expandable-comment__full-comment')

  showFullCommentButton.addEventListener('click', () => {
    fullCommentText.classList.add(FUL_COMMENT_EXPANDED_CLASS)
  })

  hideFullCommentButton.addEventListener('click', () => {
    fullCommentText.classList.remove(FUL_COMMENT_EXPANDED_CLASS)
  })
})
