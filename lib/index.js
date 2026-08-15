/**
 * dsh-global-rules host entry: serves HTTP routes that read and write the
 * user-global instruction file (~/.dsh/AGENTS.md) for the settings panel.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const name = 'global-rules'

const MAX_BODY_BYTES = 256 * 1024

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

/** True when the request's Origin matches its Host — required on POST. */
function sameOrigin(request) {
  const origin = request.headers.origin
  const host = request.headers.host
  if (origin === undefined || host === undefined) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/** Read and parse a JSON request body, capped at MAX_BODY_BYTES. */
async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_BODY_BYTES) throw new Error('request body too large')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export function apply(ctx) {
  ctx.inject(['webServer'], (host) => {
    const file = join(homedir(), '.dsh', 'AGENTS.md')
    host.effect(() => host.webServer.register({
      kind: 'exact',
      path: '/global-rules',
      handler: async (request, response) => {
        if (request.method === 'GET') {
          try {
            const content = await readFile(file, 'utf8')
            sendJson(response, 200, { exists: true, content })
          } catch (error) {
            if (error && error.code === 'ENOENT') {
              sendJson(response, 200, { exists: false, content: '' })
            } else {
              sendJson(response, 500, { error: String(error && error.message || error) })
            }
          }
          return
        }
        if (request.method === 'POST') {
          if (!sameOrigin(request)) {
            response.writeHead(403)
            response.end()
            return
          }
          try {
            const body = await readJsonBody(request)
            const content = typeof body === 'object' && body !== null ? body.content : undefined
            if (typeof content !== 'string') {
              sendJson(response, 400, { error: 'content must be a string' })
              return
            }
            await writeFile(file, content, 'utf8')
            sendJson(response, 200, { ok: true })
          } catch (error) {
            sendJson(response, 500, { error: String(error && error.message || error) })
          }
          return
        }
        response.writeHead(405, { allow: 'GET, POST' })
        response.end()
      },
    }), 'dsh-global-rules: http route')
  })
}
