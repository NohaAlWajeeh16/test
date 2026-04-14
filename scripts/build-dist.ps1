$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'

if (Test-Path $dist) {
  Remove-Item -LiteralPath $dist -Recurse -Force
}

New-Item -ItemType Directory -Path $dist | Out-Null
New-Item -ItemType Directory -Path (Join-Path $dist 'data') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $dist 'images') | Out-Null

Copy-Item -LiteralPath (Join-Path $root 'index.html') -Destination $dist
Copy-Item -LiteralPath (Join-Path $root 'data\audit-data.js') -Destination (Join-Path $dist 'data')
Copy-Item -Path (Join-Path $root 'images\*') -Destination (Join-Path $dist 'images') -Recurse

Write-Host "Built dist at $dist"
