import { build } from 'vite';

function buatTimestampBuild() {
  const now = new Date();
  const date = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(/-/g, '');
  const time = now.toLocaleTimeString('sv-SE', { timeZone: 'Asia/Jakarta', hour12: false }).slice(0, 5).replace(/:/g, '');
  return `${date}.${time}`;
}

const appTimestamp = buatTimestampBuild();
process.env.APP_TIMESTAMP = appTimestamp;

console.log(`[build:ssr] APP_TIMESTAMP=${appTimestamp}`);

await build();
await build({
  build: {
    ssr: 'src/entry-server.jsx',
    outDir: 'dist/server',
  },
});
