import { spawnSync } from 'node:child_process';

function buatTimestampBuild() {
  const now = new Date();
  const date = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(/-/g, '');
  const time = now.toLocaleTimeString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false }).slice(0, 5).replace(/:/g, '');
  return `${date}.${time}`;
}

function runVite(args, env) {
  const result = spawnSync('npx', ['vite', ...args], {
    stdio: 'inherit',
    shell: true,
    env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const appTimestamp = buatTimestampBuild();
const env = {
  ...process.env,
  APP_TIMESTAMP: appTimestamp,
};

console.log(`[build:ssr] APP_TIMESTAMP=${appTimestamp}`);
runVite(['build'], env);
runVite(['build', '--ssr', 'src/entry-server.jsx', '--outDir', 'dist/server'], env);
