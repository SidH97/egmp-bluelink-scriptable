import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const port = Number.parseInt(process.env.UI_TEST_PORT || '4173', 10)
const host = process.env.UI_TEST_HOST || '0.0.0.0'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptDir, '..', '..')

const fileMap = {
  '/': resolve(scriptDir, 'index.html'),
  '/index.html': resolve(scriptDir, 'index.html'),
  '/styles.css': resolve(scriptDir, 'styles.css'),
  '/app.js': resolve(scriptDir, 'app.js'),
  '/data/listVehicles.json': resolve(repoRoot, 'exampleData', 'listVehicles.json'),
  '/data/vehicleStatus.json': resolve(repoRoot, 'exampleData', 'vehicleStatus.json'),
  '/data/vehicleStatusCharging.json': resolve(repoRoot, 'exampleData', 'vehicleStatusCharging.json'),
  '/data/vehicleStatusConditioning.json': resolve(repoRoot, 'exampleData', 'vehicleStatusConditioning.json'),
  '/data/vehicleStatusNotForced.json': resolve(repoRoot, 'exampleData', 'vehicleStatusNotForced.json'),
}

const contentType = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}

const server = createServer(async (req, res) => {
  const url = req.url || '/'
  const filePath = fileMap[url]

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not found')
    return
  }

  try {
    const data = await readFile(filePath)
    res.writeHead(200, {
      'Content-Type': contentType[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    })
    res.end(data)
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    const msg = error instanceof Error ? error.message : String(error)
    res.end(`Failed to read ${filePath}: ${msg}`)
  }
})

server.listen(port, host, () => {
  console.log(`UI test mode running at http://${host}:${port}`)
  console.log('Press Ctrl+C to stop.')
})
