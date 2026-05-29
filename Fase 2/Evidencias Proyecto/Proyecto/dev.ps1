<#
Dev helper script for ServiHogar (Windows PowerShell)
- Starts Django API and Vite dev server
- Checks Node.js version for Vite (requires 20.19+ or 22.12+)
- Creates frontend .env with default API URL if missing
- Runs npm install if node_modules is missing
- Optimized Vite startup: auto-selects free port, readiness probe, optional auto-open browser
#>

param(
  [switch]$NoBrowser,
  [int]$Port = 5173
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$python = Join-Path $root '.venv/Scripts/python.exe'
$frontend = Join-Path $root 'frontend'
$frontendEnv = Join-Path $frontend '.env'
$nodeModules = Join-Path $frontend 'node_modules'

function Get-NodeVersion() {
  try {
    $v = node -v 2>$null
    if (-not $v) { return $null }
    $v = $v.Trim().TrimStart('v')
    return [version]$v
  } catch { return $null }
}

function Test-NodeVersionSupported([version]$v) {
  if ($null -eq $v) { return $false }
  if ($v.Major -eq 20) { return $v -ge [version]'20.19.0' }
  if ($v.Major -eq 22) { return ($v.Major -gt 22) -or ($v -ge [version]'22.12.0') }
  # Treat other majors optimistically false to match Vite requirements
  return $false
}

function Test-PortFree([int]$p) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect('127.0.0.1', $p)
    $client.Close()
    return $false  # connection succeeded -> port in use
  } catch { return $true } # connection failed -> port likely free
}

function Get-FreePort([int]$startPort, [int]$maxTries = 16) {
  $p = $startPort
  for ($i = 0; $i -lt $maxTries; $i++) {
    if (Test-PortFree $p) { return $p }
    $p++
  }
  return $startPort  # fallback (let Vite decide)
}

Write-Host "== ServiHogar dev helper ==" -ForegroundColor Cyan

# Backend checks
if (-not (Test-Path $python)) {
  Write-Warning "No se encontró el intérprete Python del entorno virtual en $python"
  Write-Host "Crea el venv e instala dependencias:" -ForegroundColor Yellow
  Write-Host "  py -m venv .venv; .\.venv\Scripts\Activate.ps1; python -m pip install -r backend\requirements.txt" -ForegroundColor DarkGray
  throw "Falta entorno virtual"
}

# Frontend checks
if (-not (Test-Path $frontend)) {
  Write-Warning "No se encontró la carpeta 'frontend'. Crea el proyecto Vite o ajusta la ruta."
} else {
  # Ensure frontend .env
  if (-not (Test-Path $frontendEnv)) {
    "VITE_API_URL=http://127.0.0.1:8000" | Out-File -Encoding utf8 -FilePath $frontendEnv -Force
    Write-Host "Creado frontend/.env con VITE_API_URL por defecto" -ForegroundColor Green
  }

  # npm install if needed
  if (-not (Test-Path $nodeModules)) {
    Write-Host "Instalando dependencias de frontend (npm install)..." -ForegroundColor Cyan
    Push-Location $frontend
    try { npm install } finally { Pop-Location }
  }
}

# Node version check for Vite
$nodeVersion = Get-NodeVersion
if ($null -eq $nodeVersion) {
  Write-Warning "Node.js no está instalado o no está en PATH. Instálalo para ejecutar el frontend (se recomienda Node 20.19+ o 22.12+)."
} elseif (-not (Test-NodeVersionSupported $nodeVersion)) {
  Write-Warning "Tu Node.js ($nodeVersion) no cumple con Vite (requiere 20.19+ o 22.12+). Actualiza Node para usar 'npm run dev'."
}

# Start Django API
Write-Host "Levantando API Django en http://127.0.0.1:8000 ..." -ForegroundColor Cyan
$backend = Join-Path $root 'backend'
Start-Process -FilePath $python -ArgumentList 'manage.py','runserver' -WorkingDirectory $backend

# Start Vite dev server (if frontend exists and node ok)
if (Test-Path $frontend) {
  if ($nodeVersion -and (Test-NodeVersionSupported $nodeVersion)) {
    # Select a free port, prefer requested $Port
    $vitePort = if (Test-PortFree $Port) { $Port } else { Get-FreePort ($Port + 1) }
  Write-Host "Levantando Vite (React) en http://127.0.0.1:$vitePort ..." -ForegroundColor Cyan

  # Start Vite detached using Start-Process (compatible with Windows PowerShell 5.1)
  Start-Process -FilePath 'npm' -ArgumentList @('run','dev','--','--host','127.0.0.1','--port', "$vitePort") -WorkingDirectory $frontend

    # Probe readiness (up to ~10s)
    $ready = $false
    for ($i=0; $i -lt 80; $i++) {
      try { Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:$vitePort") -TimeoutSec 2 | Out-Null; $ready = $true; break } catch { }
      if (-not $ready) {
        try { Invoke-WebRequest -UseBasicParsing -Uri ("http://localhost:$vitePort") -TimeoutSec 2 | Out-Null; $ready = $true; break } catch { }
      }
      Start-Sleep -Milliseconds 250
    }
    if ($ready) {
      Write-Host "Vite listo en http://127.0.0.1:$vitePort" -ForegroundColor Green
      if (-not $NoBrowser) {
        try { Start-Process ("http://127.0.0.1:$vitePort") } catch {}
      }
    } else {
      Write-Warning "No se pudo verificar Vite en http://localhost:$vitePort."
    }
  } else {
    Write-Host "Saltar Vite por versión de Node. Puedes aún construir con:" -ForegroundColor Yellow
    Write-Host "  cd frontend; npm run build" -ForegroundColor DarkGray
  }
}

Write-Host "Listo. Endpoints:" -ForegroundColor Green
Write-Host "  API:  http://127.0.0.1:8000/api/ping" -ForegroundColor DarkGray
if ($vitePort) {
  Write-Host ("  Web:  http://127.0.0.1:{0}" -f $vitePort) -ForegroundColor DarkGray
} else {
  Write-Host "  Web:  http://localhost:5173 (si Vite está levantado)" -ForegroundColor DarkGray
}
