// return URL prefix for either visit booking or visit update journey
const getUrlPrefix = (isUpdate: boolean, previousVisitReference: string) => {
  return isUpdate ? `/visit/${previousVisitReference}/update` : '/book-a-visit'
}

export default getUrlPrefix
