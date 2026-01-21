import nunjucks from 'nunjucks'

const environment = new nunjucks.Environment()

export default class ViewUtils {
  static escape(val: string): string {
    const escape = environment.getFilter('escape')
    return escape(val).val
  }
}
