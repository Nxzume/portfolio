import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const script = path.join(root, 'scripts/blender/build_piano_keyboard.py')

const candidates = [
  process.env.BLENDER,
  process.platform === 'win32'
    ? path.join(process.env.USERPROFILE || '', 'Apps/Blender/blender-5.2.2-windows-x64/blender.exe')
    : null,
  'blender',
].filter(Boolean)

const blender = candidates.find((bin) => bin === 'blender' || existsSync(bin))
if (!blender) {
  console.error('Blender not found. Set BLENDER to the executable path.')
  process.exit(1)
}

const result = spawnSync(blender, ['--background', '--python', script], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
