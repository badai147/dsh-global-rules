/**
 * dsh-global-rules host entry: serves the user-global instruction file
 * ($DSH_HOME/AGENTS.md) for the settings panel.
 *
 * The endpoint is registered through Connection's exact Fetch registry, so it
 * sits inside the same /api Host/Origin fence and browser-authentication gate
 * every other Host API method passes through.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

export const name = 'global-rules'

const MAX_BODY_BYTES = 256 * 1024
const HOME_ENV = 'DSH_HOME'
const HOME_DIR_NAME = '.dsh'
const FILE_NAME = 'AGENTS.md'
const ROUTE_PATH = '/api/global-rules'

/** JSON response with the no-store header the settings panel expects. */
function jsonResponse(status, payload) {
  return Response.json(payload, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}

/** Message of a thrown value, for the panel's failure notice. */
function messageOf(error) {
  return String((error && error.message) || error)
}

/** Expand the supported tilde prefixes against the operating-system home. */
function expandHomePath(path) {
  if (path === '~') {
    return homedir()
  }
  if (path.startsWith('~/') || path.startsWith('~\\')) {
    return join(homedir(), path.slice(2))
  }
  return path
}

/**
 * Resolve the harness home exactly as the built-in instruction loader does:
 * a non-blank $DSH_HOME wins, otherwise ~/.dsh.
 *
 * Deliberately inlined rather than imported from the harness's
 * `@deepseek-ai/dsh-home-paths`: an external plugin cannot assume that package
 * is resolvable inside the profile, and the precedence rule is this short.
 * Keep it in sync with `resolveDshHome`.
 */
function resolveHome() {
  const configured = process.env[HOME_ENV]
  const chosen = configured !== undefined && configured.trim().length > 0
    ? configured
    : join(homedir(), HOME_DIR_NAME)
  return resolve(expandHomePath(chosen))
}

/** Symbolic home label for user-facing copy; never an absolute machine path. */
function homeDisplay(home) {
  return home === resolve(join(homedir(), HOME_DIR_NAME))
    ? `~/${HOME_DIR_NAME}`
    : `$${HOME_ENV}`
}

/**
 * Serve one settings-panel request for the global instruction file.
 * @param request - fenced Fetch request; Connection already applied the
 * Host/Origin fence and browser authentication.
 * @param file - absolute path of the instruction file.
 * @param display - symbolic path shown in the panel.
 */
async function handle(request, file, display) {
  if (request.method === 'GET') {
    try {
      const content = await readFile(file, 'utf8')
      return jsonResponse(200, { exists: true, content, path: display })
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        return jsonResponse(200, { exists: false, content: '', path: display })
      }
      return jsonResponse(500, { error: messageOf(error) })
    }
  }
  let body
  try {
    const declared = Number(request.headers.get('content-length'))
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      return jsonResponse(413, { error: 'request body too large' })
    }
    const text = await request.text()
    if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
      return jsonResponse(413, { error: 'request body too large' })
    }
    body = JSON.parse(text)
  } catch {
    return jsonResponse(400, { error: 'request body must be JSON' })
  }
  const content = typeof body === 'object' && body !== null ? body.content : undefined
  if (typeof content !== 'string') {
    return jsonResponse(400, { error: 'content must be a string' })
  }
  try {
    await writeFile(file, content, 'utf8')
    return jsonResponse(200, { ok: true, path: display })
  } catch (error) {
    return jsonResponse(500, { error: messageOf(error) })
  }
}

export function apply(ctx) {
  const home = resolveHome()
  const file = join(home, FILE_NAME)
  const display = `${homeDisplay(home)}/${FILE_NAME}`
  ctx.inject(['connection'], (host) => {
    host.connection.fetch.register({
      path: ROUTE_PATH,
      methods: ['GET', 'POST'],
      requestBody: 'buffered',
      fetch: (request) => handle(request, file, display),
    })
  })
}
