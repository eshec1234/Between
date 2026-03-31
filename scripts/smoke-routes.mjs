#!/usr/bin/env node
/**
 * Pre-launch smoke: production build + vite preview, then HTTP check core routes.
 * No browser binary required (checklist §11).
 */
import { spawn } from 'node:child_process'

const host = '127.0.0.1'
const port = 4173
const base = `http://${host}:${port}`

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForServer() {
  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    try {
      const r = await fetch(base)
      if (r.ok) return
    } catch {
      /* retry */
    }
    await delay(400)
  }
  throw new Error(`smoke-routes: no response from ${base} within 90s`)
}

const child = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
  env: { ...process.env }
})

const shutdown = () => {
  try {
    child.kill('SIGTERM')
  } catch {
    /* ignore */
  }
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

try {
  await waitForServer()
  /** Vite SPA: every path serves the same shell; routing happens in the bundle. */
  const paths = ['/', '/about', '/faq', '/submit', '/place/00000000-0000-0000-0000-000000000000']
  for (const path of paths) {
    const r = await fetch(base + path)
    const text = await r.text()
    if (!r.ok) throw new Error(`smoke-routes: ${path} HTTP ${r.status}`)
    if (!text.includes('id="root"')) throw new Error(`smoke-routes: ${path} missing #root shell`)
    if (!text.includes('<title>Between</title>')) throw new Error(`smoke-routes: ${path} missing title`)
    if (!text.includes('/assets/') || !text.includes('.js')) throw new Error(`smoke-routes: ${path} missing built JS reference`)
  }
  console.log('smoke-routes: ok (SPA shell for /, /about, /faq, /submit, /place/…) ')
} finally {
  shutdown()
}
