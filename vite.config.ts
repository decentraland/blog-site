import federation from '@originjs/vite-plugin-federation'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'

// Shared packages that must come from the host (landing-site) at runtime.
// The federation plugin only rewrites imports in source code it transforms, but
// pre-compiled node_modules dependencies still bundle their own copies of these
// packages, causing duplicate instances (e.g. two Reacts -> hook error #321,
// two @emotion/react -> missing theme context).
//
// This plugin rewrites the output chunks that contain bundled copies of shared
// packages so they delegate to the federation share scope via importShared().
// It identifies bundled chunks by matching known license/marker strings, then
// replaces their content with thin wrappers that re-export from importShared.
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

function federationSharedPatch(): Plugin {
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
            // This inlines React 18's production JSX factory. It must be
            // kept in sync if React is upgraded. Ideally we would use
            // importShared("react/jsx-runtime") but the federation share
            // scope only resolves top-level packages, not subpath exports.
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

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ command, mode }) => {
  const envVariables = loadEnv(mode, process.cwd())

  return {
    plugins: [
      react(),
      /* eslint-disable @typescript-eslint/naming-convention */
      federation({
        name: 'blog_site',
        filename: 'remoteEntry.js',
        exposes: {
          './App': './src/remote-entry.tsx'
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.3.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.3.0' },
          'react-router-dom': { singleton: true, requiredVersion: '^7.9.0' },
          '@emotion/react': { singleton: true, requiredVersion: '^11.14.0' },
          '@emotion/styled': { singleton: true, requiredVersion: '^11.14.0' },
          '@reduxjs/toolkit': { singleton: true, requiredVersion: '^2.9.0' },
          'react-redux': { singleton: true, requiredVersion: '^9.2.0' },
          wagmi: { singleton: true, requiredVersion: '^2.19.0' },
          viem: { singleton: true, requiredVersion: '^2.44.0' },
          '@dcl/hooks': { singleton: true, requiredVersion: '^1.2.0' },
          'decentraland-ui2': { singleton: true, requiredVersion: '^2.0.0' },
          '@dcl/schemas': { singleton: true, requiredVersion: '^25.2.0' }
        } as Record<string, { singleton: boolean; requiredVersion: string }>
      }),
      /* eslint-enable @typescript-eslint/naming-convention */
      federationSharedPatch()
    ],
    build: {
      target: 'esnext',
      chunkSizeWarningLimit: 1024,
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/]
      }
    },
    optimizeDeps: {
      include: ['decentraland-ui2', '@dcl/ui-env', '@dcl/hooks']
    },
    ...(command === 'build' ? { base: envVariables.VITE_BASE_URL || '/' } : undefined),
    server: {
      cors: true,
      /* eslint-disable @typescript-eslint/naming-convention */
      proxy: {
        '/api/cms': {
          target: 'https://cms.decentraland.zone',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/cms/, '/spaces/ea2ybdmmn1kv/environments/master'),
          configure: proxy => {
            proxy.on('error', err => {
              console.log('[Vite Proxy] Error:', err)
            })
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('[Vite Proxy] Sending Request:', req.method, req.url, '→', proxyReq.path)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('[Vite Proxy] Received Response:', req.url, '→', proxyRes.statusCode)
            })
          }
        },
        '/auth': {
          target: 'https://decentraland.zone',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: proxy => {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('[Vite Proxy] Auth Request:', req.method, req.url, '→', proxyReq.path)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('[Vite Proxy] Auth Response:', req.url, '→', proxyRes.statusCode)
            })
          }
        }
      }
      /* eslint-enable @typescript-eslint/naming-convention */
    },
    preview: {
      cors: true
    }
  }
})
