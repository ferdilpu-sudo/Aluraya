$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not [Environment]::Is64BitOperatingSystem) { throw 'Windows x64 diperlukan.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Pasang Node.js 24 LTS x64 terlebih dahulu.' }
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) { throw 'Pasang Rust stable dan C++ Build Tools terlebih dahulu.' }
if (-not (Test-Path node_modules)) {
    & npm.cmd ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci gagal.' }
}
& npm.cmd run desktop:prepare
if ($LASTEXITCODE -ne 0) { throw 'Persiapan sidecar gagal.' }
& npm.cmd run doctor
if ($LASTEXITCODE -ne 0) { throw 'Prasyarat belum lengkap; baca hasil doctor di atas.' }
& npm.cmd run tauri dev
if ($LASTEXITCODE -ne 0) { throw 'Startup Aluraya gagal. Simpan output error untuk diagnosis.' }
