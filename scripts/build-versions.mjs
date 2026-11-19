import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const V1_COMMIT = '47ad5fa';
const V2_COMMIT = '760a413';
const repoRoot = path.resolve(import.meta.dirname, '..');
const distDir = path.join(repoRoot, 'dist');
const v1DistDir = path.join(distDir, 'v1');
const v2DistDir = path.join(distDir, 'V2');
const v3DistDir = path.join(distDir, 'v3');

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

function injectSwitcher(indexPath, activeVersion) {
  if (!fs.existsSync(indexPath)) return;
  let html = fs.readFileSync(indexPath, 'utf8');
  const pill = (ver, label) =>
    ver === activeVersion
      ? `<span style="padding:4px 8px;border-radius:7px;background:#2563eb;color:#fff;font-weight:700;">${label}</span>`
      : `<a data-dblock-ver="${ver}" href="../${ver}/" style="padding:4px 8px;border-radius:7px;color:#e2e8f0;text-decoration:none;font-weight:600;">${label}</a>`;

  const switcherSnippet = `
    <div id="dblock-version-switcher" style="position:fixed;bottom:16px;right:16px;z-index:9999;display:inline-flex;align-items:center;gap:4px;padding:4px;border-radius:10px;background:rgba(15,23,42,0.92);border:1px solid rgba(148,163,184,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.2);font-family:Inter,system-ui,sans-serif;font-size:12px;">
      ${pill('v1', 'v1')}
      ${pill('V2', 'V2')}
      ${pill('v3', 'v3')}
    </div>
    <script>
      (function () {
        document.querySelectorAll('[data-dblock-ver]').forEach(function (link) {
          link.addEventListener('click', function (e) {
            e.preventDefault();
            var target = link.getAttribute('data-dblock-ver');
            var base = window.location.pathname.replace(/\\/(v1|v2|v3|V1|V2|V3)(\\/.*)?$/, '/');
            if (!base.endsWith('/')) base += '/';
            window.location.href = base + target + '/' + window.location.hash;
          });
        });
      })();
    </script>`;
  html = html.replace('</body>', `${switcherSnippet}\n  </body>`);
  fs.writeFileSync(indexPath, html, 'utf8');
}

function buildV3() {
  console.log('\n=== Building v3 (latest) ===');
  fs.rmSync(distDir, { recursive: true, force: true });
  run('npx', ['vite', 'build']);

  // Copy root v3 build into dist/v3/ so both / and /v3/ serve v3
  const entries = fs.readdirSync(distDir);
  fs.mkdirSync(v3DistDir, { recursive: true });
  for (const entry of entries) {
    if (['v1', 'V1', 'v2', 'V2', 'v3', 'V3'].includes(entry)) continue;
    fs.cpSync(path.join(distDir, entry), path.join(v3DistDir, entry), { recursive: true });
  }

  // Case-insensitive convenience redirect: /V3/ -> /v3/
  writeRedirectHtml(path.join(distDir, 'V3'), '../v3/', 'DBLock AI v3');
}

function buildFromCommit(commitHash, label, outDir, redirectDir, redirectTarget) {
  console.log(`\n=== Building ${label} (${commitHash}) ===`);

  try {
    execSync(`git cat-file -e ${commitHash}^{commit}`, { cwd: repoRoot, stdio: 'ignore' });
  } catch {
    throw new Error(
      `Commit ${commitHash} was not found in git history. Ensure a full git clone (fetch-depth: 0) is available.`
    );
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `dblock-${label.toLowerCase()}-`));
  try {
    run('git', ['worktree', 'add', '--detach', tmpDir, commitHash]);

    const rootNodeModules = path.join(repoRoot, 'node_modules');
    const tmpNodeModules = path.join(tmpDir, 'node_modules');
    if (fs.existsSync(rootNodeModules) && !fs.existsSync(tmpNodeModules)) {
      fs.symlinkSync(rootNodeModules, tmpNodeModules, 'dir');
    }

    fs.rmSync(outDir, { recursive: true, force: true });
    run('npx', ['vite', 'build', '--outDir', outDir], tmpDir);

    injectSwitcher(path.join(outDir, 'index.html'), label);
    writeRedirectHtml(redirectDir, redirectTarget, `DBLock AI ${label}`);
  } finally {
    try {
      run('git', ['worktree', 'remove', '--force', tmpDir]);
    } catch {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
}

if (!v1Only) {
  buildV3();
  buildFromCommit(V2_COMMIT, 'V2', v2DistDir, path.join(distDir, 'v2'), '../V2/');
}
buildFromCommit(V1_COMMIT, 'v1', v1DistDir, path.join(distDir, 'V1'), '../v1/');
console.log('\n=== Multi-version build complete: /, /v1/, /V2/, /v3/ ===\n');
