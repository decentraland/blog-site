module.exports = {
  extends: ['@dcl/eslint-config/core-dapps'],
  parserOptions: {
    project: ['./tsconfig.app.json', './tsconfig.node.json']
  },
  ignorePatterns: ['.eslintrc.cjs']
}
