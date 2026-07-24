import type { CheerioAPI } from 'cheerio'

export default function testScreenReaderAndVisibleOnlyText(
  $el: ReturnType<CheerioAPI>,
  screenReaderText: string,
  visibleOnlyText: string,
): void {
  const $clone = $el.clone()

  expect($clone.text().trim()).toBe(screenReaderText)
  $clone.find('.govuk-visually-hidden').remove()
  expect($clone.text().trim()).toBe(visibleOnlyText)
}
