/**
 * @fileoverview Runner root untuk simulasi production: pastikan SSR build tersedia lalu jalankan backend.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const frontendDistDir = path.join(rootDir, 'frontend', 'dist');
const frontendTemplatePath = path.join(frontendDistDir, 'index.html');
const frontendServerEntryPath = path.join(frontendDistDir, 'server', 'entry-server.js');

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
    },
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function hasSsrBuildArtifacts() {
  return fs.existsSync(frontendTemplatePath) && fs.existsSync(frontendServerEntryPath);
}

if (!hasSsrBuildArtifacts()) {
  console.log('[start] SSR build belum ditemukan, menjalankan build:ssr frontend...');
  runCommand('npm', ['run', 'build:ssr', '--prefix', 'frontend']);
}

console.log('[start] Menjalankan backend production (SSR + API)...');
runCommand('npm', ['run', 'start:production', '--prefix', 'backend']);
