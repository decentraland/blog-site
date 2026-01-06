import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ command, mode }) => {
  const envVariables = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    build: {
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
      proxy: {
        '/api/cms': {
          target: 'https://cms.decentraland.zone',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/cms/, '/spaces/ea2ybdmmn1kv/environments/master'),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('[Vite Proxy] Error:', err)
            })
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('[Vite Proxy] Sending Request:', req.method, req.url, '→', proxyReq.path)
            })
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('[Vite Proxy] Received Response:', req.url, '→', proxyRes.statusCode)
            })
          }
        }
      }
    }
  }
})
