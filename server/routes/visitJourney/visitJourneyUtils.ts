// return URL prefix for either visit booking or visit update journey
const getUrlPrefix = (isUpdate: boolean, visitReference: string) => {
  return isUpdate ? `/visit/${visitReference}/update` : '/book-a-visit'
}

export default getUrlPrefix
