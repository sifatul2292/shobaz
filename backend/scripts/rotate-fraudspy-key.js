// Run from backend after npm run build. Never print the credential.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const backend = path.resolve(__dirname, '..');
const previousKey = process.env.FRAUDSPY_API_KEY;
delete process.env.FRAUDSPY_API_KEY;
let key;
try {
  key = require(path.join(backend, 'dist/config/configuration')).default()
    .fraudspyApiKey;
} finally {
  if (previousKey !== undefined) process.env.FRAUDSPY_API_KEY = previousKey;
}
if (!key || !key.startsWith('fs_live_')) {
  throw new Error('Replacement key missing from compiled config; rebuild backend first.');
}
const envPath = path.join(backend, '.env');
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
env = env.replace(/^\s*(?:export\s+)?FRAUDSPY_API_KEY\s*=.*(?:\r?\n|$)/gm, '');
fs.writeFileSync(envPath, env.trimEnd() + '\nFRAUDSPY_API_KEY=' + key + '\n', { mode: 0o600 });
console.log('Updated backend .env FraudSpy key.');
const result = spawnSync('pm2', ['restart', 'shobaz-backend', '--update-env'], {
  cwd: backend,
  env: { ...process.env, FRAUDSPY_API_KEY: key },
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status === null ? 1 : result.status;
