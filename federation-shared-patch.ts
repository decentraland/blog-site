import type { Plugin } from 'vite'

// Shared packages that must come from the host (landing-site) at runtime.
//
// Why this plugin exists:
// The federation plugin (`@originjs/vite-plugin-federation`) only rewrites
// imports in source code it transforms. Pre-compiled node_modules dependencies
// still bundle their own copies of shared packages, causing duplicate instances
// at runtime (e.g. two Reacts -> hook error #321, two @emotion/react -> missing
// theme context). The `singleton: true` option in the federation config cannot
// fix this because it only governs the share scope negotiation — it does not
// reach into already-bundled vendor chunks.
//
// How it works:
// After Vite finishes bundling, this plugin scans output chunks for known
// license/marker strings that identify bundled copies of shared packages. When
// found, it moves the original code to a `*__bundled.js` asset and replaces
// the chunk with a thin conditional wrapper:
//   - If the federation share scope exists (embedded in host): use importShared()
//   - Otherwise (standalone mode): re-export from the bundled copy
const SHARED_CHUNK_MARKERS: Record<string, { marker: string; exclude?: string[] }> = {
  /* eslint-disable @typescript-eslint/naming-convention */
  // exclude jsx-runtime and react-dom because their chunks also contain
  // the "react.production.min.js" banner via React re-exports
  react: { marker: 'react.production.min.js', exclude: ['jsx-runtime', 'react-dom'] },
  'react/jsx-runtime': { marker: 'react-jsx-runtime.production.min.js' },
  // exclude react-dom-server since it has its own banner that would false-match
  'react-dom': { marker: 'react-dom.production', exclude: ['react-dom-server'] }
  /* eslint-enable @typescript-eslint/naming-convention */
}

export function federationSharedPatch(): Plugin {
  return {
    name: 'federation-shared-patch',
    enforce: 'post',
    generateBundle(_, bundle) {
      // Find the __federation_fn_import chunk
      let fnImportFile = ''
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && fileName.includes('__federation_fn_import')) {
          fnImportFile = fileName
          break
        }
      }
      if (!fnImportFile) return
      const fnImportBase = './' + fnImportFile.split('/').pop()!

      // For each shared package, find its bundled chunk and patch it
      for (const [pkgName, { marker, exclude }] of Object.entries(SHARED_CHUNK_MARKERS)) {
        let matched = false
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type !== 'chunk') continue
          if (fileName.includes('__federation_')) continue
          if (!chunk.code.includes(marker)) continue
          if (exclude?.some(ex => chunk.code.includes(ex))) continue
          matched = true

          const exports = chunk.exports || []
          const guardPkg = pkgName === 'react/jsx-runtime' ? 'react' : pkgName
          const guard = `globalThis.__federation_shared__?.default?.["${guardPkg}"]`
          const bundledName = fileName.replace('.js', '__bundled.js')

          // Move the original code to a __bundled chunk
          this.emitFile({ type: 'asset', fileName: bundledName, source: chunk.code })

          // Replace the chunk with a conditional wrapper:
          // - If federation share scope exists (embedded in host): use importShared
          // - Otherwise (standalone): re-export from the bundled copy
          if (pkgName === 'react/jsx-runtime') {
            // The federation share scope only resolves top-level packages, not
            // subpath exports like "react/jsx-runtime". To avoid a duplicate
            // JSX runtime, we rebuild the JSX factory from the shared React
            // instance. This inlines React 18's production JSX factory logic
            // (createElement-like fast path used by the automatic JSX transform).
            // It must be kept in sync if React is upgraded.
            // TODO: revisit when upgrading past React 18.3.x
            const reExports = exports.map(e => `export const ${e}=r.${e}??r;`).join('')
            chunk.code = [
              `let r;if(${guard}){`,
              `const{importShared:s}=await import("${fnImportBase}");`,
              'const R=await s("react");',
              'const I=R.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;',
              'const m=Symbol.for("react.element"),x=Symbol.for("react.fragment"),y=Object.prototype.hasOwnProperty,v={key:!0,ref:!0,__self:!0,__source:!0};',
              'function jsx(t,p,k){var e,o={},s=null,f=null;k!==void 0&&(s=""+k);p.key!==void 0&&(s=""+p.key);p.ref!==void 0&&(f=p.ref);for(e in p)y.call(p,e)&&!v.hasOwnProperty(e)&&(o[e]=p[e]);if(t&&t.defaultProps)for(e in t.defaultProps)o[e]===void 0&&(o[e]=t.defaultProps[e]);return{$$typeof:m,type:t,key:s,ref:f,props:o,_owner:I.ReactCurrentOwner.current}}',
              'r={jsx,jsxs:jsx,Fragment:x,default:{jsx,jsxs:jsx,Fragment:x}};',
              `}else{r=await import("./${bundledName.split('/').pop()}");}`,
              reExports
            ].join('')
          } else {
            const reExports = exports.map(e => `export const ${e}=m.${e}??m;`).join('')
            chunk.code = [
              `let m;if(${guard}){`,
              `const{importShared:s}=await import("${fnImportBase}");`,
              `m=await s("${pkgName}");`,
              `}else{m=await import("./${bundledName.split('/').pop()}");}`,
              reExports
            ].join('')
          }
          break // Only patch the first match per package
        }
        if (!matched) {
          console.warn(`[federation-shared-patch] No chunk matched marker for "${pkgName}" - shared patching skipped`)
        }
      }
    }
  }
}
