import fs from 'fs'
import path from 'path'
import config from './config'

const { buildNumber, gitRef, productId, branchName, activeAgencies } = config

export type ApplicationInfo = {
  applicationName: string
  buildNumber: string
  gitRef: string
  gitShortHash: string
  productId?: string
  branchName: string
  activeAgencies: Array<string>
}

export default (): ApplicationInfo => {
  const packageJson = path.join(__dirname, '../../package.json')
  const { name: applicationName } = JSON.parse(fs.readFileSync(packageJson).toString())
  return {
    applicationName,
    buildNumber,
    gitRef,
    gitShortHash: gitRef.substring(0, 7),
    productId,
    branchName,
    activeAgencies: activeAgencies.split(',').map(agencyCode => agencyCode.trim()),
  }
}
