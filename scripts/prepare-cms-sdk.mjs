#!/usr/bin/env node
/**
 * Fetches @cms/sdk from the Vancouverly CMS monorepo for standalone repo builds.
 * Skipped when VITE_CMS_SDK_PATH is set (Dockerfile copies SDK into .vendor/).
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const vendor = path.join(root, '.vendor')
const sdkDir = path.join(vendor, 'cms-sdk')
const sharedDir = path.join(vendor, 'cms-shared')
const marker = path.join(sdkDir, 'dist', 'index.js')

if (process.env.VITE_CMS_SDK_PATH) {
  process.exit(0)
}

if (fs.existsSync(marker)) {
  process.exit(0)
}

const ref = process.env.CMS_GIT_REF ?? 'master'
const repo = process.env.CMS_GIT_REPO ?? 'https://github.com/Nxzume/client-site-cms.git'
const cloneDir = path.join(vendor, 'client-site-cms')

fs.mkdirSync(vendor, { recursive: true })
if (!fs.existsSync(cloneDir)) {
  execSync(`git clone --depth 1 --branch ${ref} ${repo} ${cloneDir}`, {
    stdio: 'inherit',
  })
}

execSync('npm ci', { cwd: cloneDir, stdio: 'inherit' })
execSync('npm run build -w @cms/shared && npm run build -w @cms/sdk', {
  cwd: cloneDir,
  stdio: 'inherit',
})

fs.rmSync(sdkDir, { recursive: true, force: true })
fs.rmSync(sharedDir, { recursive: true, force: true })
fs.cpSync(path.join(cloneDir, 'packages/sdk'), sdkDir, { recursive: true })
fs.cpSync(path.join(cloneDir, 'packages/shared'), sharedDir, { recursive: true })

// file: deps inside the cloned packages point at monorepo paths — rewrite for vendor layout.
const sdkPkg = JSON.parse(fs.readFileSync(path.join(sdkDir, 'package.json'), 'utf8'))
sdkPkg.dependencies['@cms/shared'] = `file:${sharedDir}`
fs.writeFileSync(path.join(sdkDir, 'package.json'), JSON.stringify(sdkPkg, null, 2))
execSync('npm install --omit=dev', { cwd: sdkDir, stdio: 'inherit' })

console.log('Prepared @cms/sdk in .vendor/cms-sdk')
