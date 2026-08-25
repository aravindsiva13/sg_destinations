// =============================================================================
// Shraddha Garden — local "one-click" host.
// Starts the API + web server + public tunnel, then prints your live link.
// Launched by START-WEBSITE.bat. Keep the window open; close it to stop.
//
// Fixed link: fill in ngrok.txt (authtoken + domain) to always get the SAME
// link (e.g. shraddha-garden.ngrok-free.app). If ngrok.txt isn't filled in,
// it falls back to a free random Cloudflare link.
// =============================================================================
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const API_DIR = join(ROOT, 'api');
const children = [];

function banner(lines) {
  const width = 60;
  console.log('\n' + '='.repeat(width));
  for (const l of lines) console.log('  ' + l);
  console.log('='.repeat(width) + '\n');
}

// --- read optional ngrok settings (for a fixed link) -------------------------
function readNgrokConfig() {
  const file = join(ROOT, 'ngrok.txt');
  if (!existsSync(file)) return null;
  let token = '';
  let domain = '';
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const key = line.slice(0, line.indexOf('=')).trim().toLowerCase();
    let val = line.slice(line.indexOf('=') + 1).trim();
    val = val.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!val || val.toUpperCase().includes('PASTE')) continue;
    if (key === 'authtoken') token = val;
    if (key === 'domain') domain = val;
  }
  return token && domain ? { token, domain } : null;
}
const ngrok = readNgrokConfig();

console.log('Starting your website… please wait ~15 seconds.\n');

// 1) API (compiled backend on port 4000)
const api = spawn(process.execPath, [join(API_DIR, 'dist', 'src', 'server.js')], {
  cwd: API_DIR,
  env: { ...process.env, PORT: '4000' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
children.push(api);
api.stdout.on('data', (d) => process.stdout.write('[server] ' + d));
api.stderr.on('data', (d) => process.stdout.write('[server] ' + d));

// 2) Web server (serves the site + forwards /api → 4000) on port 4173
const edge = spawn(process.execPath, [join(ROOT, 'serve-edge.mjs')], {
  cwd: ROOT,
  env: { ...process.env, EDGE_PORT: '4173' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
children.push(edge);
edge.stdout.on('data', (d) => process.stdout.write('[web] ' + d));
edge.stderr.on('data', (d) => process.stdout.write('[web] ' + d));

// --- show the live link (once) ----------------------------------------------
let shown = false;
function showUrl(url) {
  if (shown) return;
  shown = true;
  try {
    writeFileSync(join(ROOT, 'WEBSITE-LINK.txt'), url + '\n');
  } catch {}
  banner([
    'YOUR WEBSITE IS LIVE  🎉',
    '',
    '  ' + url,
    '',
    'Admin portal:  ' + url + '/admin',
    '',
    '(The link is also saved in WEBSITE-LINK.txt)',
    'Keep this window OPEN. Close it to stop the website.',
    ngrok ? 'This is your fixed link — it stays the same every time.' : 'This link changes each time you start it.',
  ]);
}

// 3) Public tunnel — fixed ngrok link if configured, else random Cloudflare link
let tunnel;
if (ngrok) {
  const fixedUrl = 'https://' + ngrok.domain;
  console.log('Using your fixed ngrok link…\n');
  tunnel = spawn(
    'npx',
    ['-y', 'ngrok', 'http', '4173', '--url', fixedUrl, '--authtoken', ngrok.token, '--log', 'stdout'],
    { cwd: ROOT, shell: true, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let errored = false;
  const scan = (buf) => {
    const s = buf.toString();
    // Link already running in another window / process.
    if (/err_ngrok_334|already online/i.test(s)) {
      if (!errored) {
        errored = true;
        banner([
          'THIS LINK IS ALREADY RUNNING SOMEWHERE ELSE',
          '',
          'Another open window is already using this link.',
          '',
          'To fix it:',
          '  1) Close ALL of these black windows',
          '  2) Double-click STOP-WEBSITE.bat',
          '  3) Wait about 20 seconds',
          '  4) Double-click START-WEBSITE.bat (only one)',
        ]);
      }
      return;
    }
    // Wrong/expired authtoken.
    if (/err_ngrok_(105|107|108)|authentication failed|invalid.*authtoken/i.test(s)) {
      if (!errored) {
        errored = true;
        banner([
          'NGROK LOGIN PROBLEM',
          '',
          'Your authtoken in ngrok.txt may be wrong or expired.',
          'Copy a fresh one from:',
          '  https://dashboard.ngrok.com/get-started/your-authtoken',
        ]);
      }
      return;
    }
    // Success.
    if (!errored && /started tunnel|url=https/i.test(s)) showUrl(fixedUrl);
  };
  tunnel.stdout.on('data', scan);
  tunnel.stderr.on('data', scan);
  // If ngrok connected but didn't log a keyword we matched, show the link
  // after a short wait — but only if no error was reported.
  setTimeout(() => {
    if (!errored) showUrl(fixedUrl);
  }, 12000);
} else {
  tunnel = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', 'http://127.0.0.1:4173'], {
    cwd: ROOT,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const scan = (buf) => {
    const m = buf.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (m) showUrl(m[0]);
  };
  tunnel.stdout.on('data', scan);
  tunnel.stderr.on('data', scan);
}
children.push(tunnel);

// --- clean shutdown ----------------------------------------------------------
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  console.log('\nStopping the website…');
  for (const c of children) {
    try {
      c.kill();
    } catch {}
  }
  // tunnels are grandchildren (via npx) — make sure they're gone on Windows.
  for (const name of ['cloudflared.exe', 'ngrok.exe']) {
    try {
      spawn('taskkill', ['/F', '/IM', name], { shell: true, stdio: 'ignore' });
    } catch {}
  }
  setTimeout(() => process.exit(0), 500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
