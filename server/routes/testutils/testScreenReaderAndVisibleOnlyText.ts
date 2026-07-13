import { Cheerio } from 'cheerio'
import { AnyNode } from 'domhandler'

export default function testScreenReaderAndVisibleOnlyText(
  $el: Cheerio<AnyNode>,
  screenReaderText: string,
  visibleOnlyText: string,
): void {
  const $clone = $el.clone()

  expect($clone.text().trim()).toBe(screenReaderText)
  $clone.find('.govuk-visually-hidden').remove()
  expect($clone.text().trim()).toBe(visibleOnlyText)
}
