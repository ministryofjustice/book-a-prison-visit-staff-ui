import config from '../../config'

type FeatureNames = keyof typeof config.features

// eslint-disable-next-line import/prefer-default-export
export const setFeature = <Feature extends FeatureNames>(
  feature: Feature,
  value: (typeof config.features)[Feature],
) => {
  jest.replaceProperty(config, 'features', {
    ...config.features,
    [feature]: value,
  })
}
