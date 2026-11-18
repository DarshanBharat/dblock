import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const V1_COMMIT = '47ad5fa';
const repoRoot = path.resolve(import.meta.dirname, '..');
const distDir = path.join(repoRoot, 'dist');
const v1DistDir = path.join(distDir, 'v1');
const v2DistDir = path.join(distDir, 'V2');

const v1Only = process.argv.includes('--v1-only');

function run(cmd, args, cwd = repoRoot) {
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}

function writeRedirectHtml(targetDir, redirectTo, title) {
  fs.mkdirSync(targetDir, { recursive: true });
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${redirectTo}" />
    <title>Redirecting to ${title}...</title>
    <script>
      window.location.replace('${redirectTo}' + window.location.search + window.location.hash);
    </script>
  </head>
  <body>
    <p>Redirecting to <a href="${redirectTo}">${title}</a>...</p>
  </body>
</html>
`;
  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
}

function buildV2() {
  console.log('\n=== Building V2 (latest) ===');
  fs.rmSync(distDir, { recursive: true, force: true });
  run('npx', ['vite', 'build']);

  // Copy root V2 build into dist/V2/ so both / and /V2/ serve the latest version
  const entries = fs.readdirSync(distDir);
  fs.mkdirSync(v2DistDir, { recursive: true });
  for (const entry of entries) {
    if (entry === 'V2' || entry === 'v2' || entry === 'v1' || entry === 'V1') continue;
    fs.cpSync(path.join(distDir, entry), path.join(v2DistDir, entry), { recursive: true });
  }

  // Case-insensitive convenience redirect: /v2/ -> /V2/
  writeRedirectHtml(path.join(distDir, 'v2'), '../V2/', 'DBLock AI V2');
}

function buildV1() {
  console.log(`\n=== Building v1 (${V1_COMMIT}, 2026-11-08) ===`);

  try {
    execSync(`git cat-file -e ${V1_COMMIT}^{commit}`, { cwd: repoRoot, stdio: 'ignore' });
  } catch {
    throw new Error(
      `Commit ${V1_COMMIT} was not found in git history. Ensure a full git clone (fetch-depth: 0) is available.`
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dblock-v1-'));
  try {
    run('git', ['worktree', 'add', '--detach', tmpDir, V1_COMMIT]);

    const rootNodeModules = path.join(repoRoot, 'node_modules');
    const tmpNodeModules = path.join(tmpDir, 'node_modules');
    if (fs.existsSync(rootNodeModules) && !fs.existsSync(tmpNodeModules)) {
      fs.symlinkSync(rootNodeModules, tmpNodeModules, 'dir');
    }

    fs.rmSync(v1DistDir, { recursive: true, force: true });
    run('npx', ['vite', 'build', '--outDir', v1DistDir], tmpDir);

    // Inject a lightweight floating switcher into v1's index.html so users can switch back to V2 from the UI
    const v1IndexPath = path.join(v1DistDir, 'index.html');
    if (fs.existsSync(v1IndexPath)) {
      let html = fs.readFileSync(v1IndexPath, 'utf8');
      const switcherSnippet = `
    <div id="dblock-version-switcher" style="position:fixed;bottom:16px;right:16px;z-index:9999;display:inline-flex;align-items:center;gap:4px;padding:4px;border-radius:10px;background:rgba(15,23,42,0.92);border:1px solid rgba(148,163,184,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:Inter,system-ui,sans-serif;font-size:12px;">
      <span style="padding:4px 8px;border-radius:7px;background:#2563eb;color:#fff;font-weight:700;">v1</span>
      <a id="dblock-switch-v2" href="../V2/" style="padding:4px 8px;border-radius:7px;color:#e2e8f0;text-decoration:none;font-weight:600;">V2</a>
    </div>
    <script>
      (function () {
        var link = document.getElementById('dblock-switch-v2');
        if (link) {
          link.addEventListener('click', function (e) {
            e.preventDefault();
            var base = window.location.pathname.replace(/\\/(v1|v2|V1|V2)(\\/.*)?$/, '/');
            if (!base.endsWith('/')) base += '/';
            window.location.href = base + 'V2/' + window.location.hash;
          });
        }
      })();
    </script>`;
      html = html.replace('</body>', `${switcherSnippet}\n  </body>`);
      fs.writeFileSync(v1IndexPath, html, 'utf8');
    }

    // Case-insensitive convenience redirect: /V1/ -> /v1/
    writeRedirectHtml(path.join(distDir, 'V1'), '../v1/', 'DBLock AI v1');
  } finally {
    try {
      run('git', ['worktree', 'remove', '--force', tmpDir]);
    } catch {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

if (!v1Only) {
  buildV2();
}
buildV1();
console.log('\n=== Multi-version build complete: /, /v1/, /V2/ ===\n');
