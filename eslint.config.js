import coreDapps from '@dcl/eslint-config/core-dapps.config.js'

const ignoredFiles = {
  ignores: ['eslint.config.js']
}

export default [ignoredFiles, ...coreDapps]
