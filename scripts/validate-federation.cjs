/* eslint-disable */

/**
 * Federation Shared Version Validator
 *
 * Validates that the `requiredVersion` ranges declared in the Module Federation
 * shared config (vite.config.ts) are satisfied by the actual installed package
 * versions in node_modules.
 *
 * Why this matters:
 * - landing-site (host) and each remote (explore-site, blog-site, etc.) declare
 *   shared singleton dependencies with `requiredVersion` constraints.
 * - If these drift from the actual installed versions, federation can silently
 *   fail at runtime: the share scope rejects the version and the remote gets
 *   `undefined` for that module, or duplicate instances cause React hook errors.
 * - Some shared packages (e.g. @emotion/react, @emotion/styled) are transitive
 *   deps of other shared packages (e.g. decentraland-ui2) — they are NOT listed
 *   in package.json but still need validation against the installed version.
 *
 * Run locally: npm run validate:federation
 * Runs in CI:  .github/workflows/validate-federation.yml (on every push)
 */

const fs = require('fs')
const path = require('path')
const semver = require('semver')

const viteConfigPath = path.resolve(__dirname, '..', 'vite.config.ts')
const packageJsonPath = path.resolve(__dirname, '..', 'package.json')

const viteConfig = fs.readFileSync(viteConfigPath, 'utf8')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

// Extract requiredVersion entries from vite.config.ts federation shared block
const sharedBlockMatch = viteConfig.match(/shared:\s*\{([\s\S]*?)\}\s*as\s*Record/)
if (!sharedBlockMatch) {
  console.error('Could not find federation shared block in vite.config.ts')
  process.exit(1)
}

const sharedBlock = sharedBlockMatch[1]
const entryPattern = /['"]?([^'":\s]+)['"]?\s*:\s*\{[^}]*requiredVersion:\s*['"]([^'"]+)['"]/g

let match
const errors = []
const warnings = []

while ((match = entryPattern.exec(sharedBlock)) !== null) {
  const pkg = match[1]
  const requiredVersion = match[2]

  // Get the actual installed version — works for both direct and transitive deps
  let installedVersion
  try {
    const pkgJsonPath = require.resolve(pkg + '/package.json')
    installedVersion = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version
  } catch {
    warnings.push(`${pkg}: declared in federation shared but not installed`)
    continue
  }

  if (!semver.satisfies(installedVersion, requiredVersion)) {
    errors.push(
      `${pkg}: installed ${installedVersion} does not satisfy federation requiredVersion "${requiredVersion}"`
    )
  }
}

if (warnings.length > 0) {
  warnings.forEach(w => console.warn(`  ⚠ ${w}`))
}

if (errors.length > 0) {
  console.error('Federation version drift detected:\n')
  errors.forEach(e => console.error(`  ✗ ${e}`))
  console.error('\nUpdate the requiredVersion in vite.config.ts federation shared config.')
  process.exit(1)
} else {
  console.log('✓ All federation shared versions are in sync with package.json')
}
