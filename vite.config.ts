import { defineConfig, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
}

function multiVersionDevPlugin(): Plugin {
  return {
    name: 'multi-version-dev-router',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '/'
        const [pathname, query = ''] = rawUrl.split('?')
        const search = query ? `?${query}` : ''

        if (pathname === '/v1' || pathname === '/V1' || pathname.startsWith('/V1/')) {
          const rest = pathname.startsWith('/V1/') ? pathname.slice(3) : ''
          res.writeHead(302, { Location: `/v1/${rest}${search}` })
          res.end()
          return
        }

        if (pathname === '/V2' || pathname === '/v2' || pathname.startsWith('/v2/')) {
          const rest = pathname.startsWith('/v2/') ? pathname.slice(3) : ''
          res.writeHead(302, { Location: `/V2/${rest}${search}` })
          res.end()
          return
        }

        if (pathname.startsWith('/v1/')) {
          const v1Root = path.resolve(process.cwd(), 'dist/v1')
          const relPath = pathname.slice('/v1/'.length) || 'index.html'
          const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '')
          let filePath = path.join(v1Root, safePath)

          if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            filePath = path.join(v1Root, 'index.html')
          }

          if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
            res.end('v1 build not found at dist/v1. Run "npm run build:v1" first.')
            return
          }

          const ext = path.extname(filePath)
          res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
          fs.createReadStream(filePath).pipe(res)
          return
        }

        if (pathname.startsWith('/V2/')) {
          const stripped = pathname.slice('/V2'.length) || '/'
          req.url = `${stripped}${search}`
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    multiVersionDevPlugin(),
    tailwindcss(),
    svelte()
  ],
})
