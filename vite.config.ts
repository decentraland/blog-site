import federation from '@originjs/vite-plugin-federation'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { federationSharedPatch } from './federation-shared-patch'

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
