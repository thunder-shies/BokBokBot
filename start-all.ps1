param(
    [switch]$StartOllama
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"

function Start-DevTerminal {
    param(
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$Command
    )

    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$WorkingDirectory'; $Command"
    ) | Out-Null
}

if ($StartOllama) {
    Start-DevTerminal -WorkingDirectory $root -Command "ollama serve"
}

$backendActivate = Join-Path $backendPath "venv\Scripts\Activate.ps1"
$rootActivate = Join-Path $root ".venv\Scripts\Activate.ps1"

if (Test-Path $backendActivate) {
    $backendCmd = ". '$backendActivate'; python -m uvicorn app.main:app --reload --port 8000"
}
elseif (Test-Path $rootActivate) {
    $backendCmd = ". '$rootActivate'; python -m uvicorn app.main:app --reload --port 8000"
}
else {
    $backendCmd = "python -m uvicorn app.main:app --reload --port 8000"
}

Start-DevTerminal -WorkingDirectory $backendPath -Command $backendCmd
Start-DevTerminal -WorkingDirectory $frontendPath -Command "npm.cmd run dev"

Write-Host "Started backend and frontend in new terminals."
Write-Host "Frontend: http://localhost:3000 (or shown by React dev server)"
Write-Host "Backend:  http://localhost:8000"
if (-not $StartOllama) {
    Write-Host "If needed, start Ollama separately: ollama serve"
}
