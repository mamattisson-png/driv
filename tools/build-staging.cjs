// Build a local test copy of DRIV using a separate Supabase project.
// Run: node tools/build-staging.cjs
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const output = 'dist-staging';
// Cloudflare Pages serves this directory as a static site.
const testProject = 'ujnfbjisrhudvnzvmniq';
const testKey = process.env.DRIV_TEST_PUBLISHABLE_KEY;
if (!testKey || !testKey.startsWith('sb_publishable_')) throw new Error('Provide DRIV_TEST_PUBLISHABLE_KEY');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const tracked = cp.execFileSync('git', ['ls-files']).toString().trim().split('\n');
for (const name of tracked) {
  if (!name || name === 'config.js' || name.startsWith('.github/') || name.startsWith('tests/') || name.startsWith('tools/') || name.startsWith('supabase/')) continue;
  const destination = path.join(output, name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(name, destination);
}
const config = { supabaseUrl: 'https://' + testProject + '.supabase.co', supabaseAnonKey: testKey, vapidPublicKey: '' };
fs.writeFileSync(path.join(output, 'config.js'), 'window.DRIV_CONFIG = ' + JSON.stringify(config) + ';\n');
const index = path.join(output, 'index.html');
const stagingHtml = fs.readFileSync(index, 'utf8')
  .replace('<title>Driv</title>', '<title>DRIV TEST</title>')
  // Temporarily disable offline worker only on staging while diagnosing reload failures.
  .replace('if (!window.claude && "serviceWorker" in navigator', 'if (false && !window.claude && "serviceWorker" in navigator');
fs.writeFileSync(index, stagingHtml);
const worker = path.join(output, 'sw.js');
fs.writeFileSync(worker, fs.readFileSync(worker, 'utf8').replace(/const CACHE = "[^"]+";/, 'const CACHE = "driv-test-' + Date.now() + '";'));
console.log('Test build created in ' + output + '. Deploy only on a separate domain.');