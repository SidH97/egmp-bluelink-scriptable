import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const port = Number.parseInt(process.env.UI_TEST_PORT || '4173', 10)
const host = process.env.UI_TEST_HOST || '0.0.0.0'
const root = new URL('.', import.meta.url).pathname

const fileMap = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/styles.css': 'styles.css',
  '/app.js': 'app.js',
  '/data/listVehicles.json': '../../exampleData/listVehicles.json',
  '/data/vehicleStatus.json': '../../exampleData/vehicleStatus.json',
  '/data/vehicleStatusCharging.json': '../../exampleData/vehicleStatusCharging.json',
  '/data/vehicleStatusConditioning.json': '../../exampleData/vehicleStatusConditioning.json',
  '/data/vehicleStatusNotForced.json': '../../exampleData/vehicleStatusNotForced.json',
}

const contentType = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}

const server = createServer(async (req, res) => {
  const url = req.url || '/'
  const path = fileMap[url]

  if (!path) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }

  try {
    const fullPath = join(root, path)
    const data = await readFile(fullPath)
    res.writeHead(200, {
      'Content-Type': contentType[extname(fullPath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(data)
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    const msg = error instanceof Error ? error.message : String(error)
    res.end(`Failed to read ${path}: ${msg}`)
  }
})

server.listen(port, host, () => {
  console.log(`UI test mode running at http://${host}:${port}`)
  console.log('Press Ctrl+C to stop.')
})
