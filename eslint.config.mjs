import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['assets/**/*.js'],
  extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs'],
})
